#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import {
  BROWSER_TRIAGE_OUTPUT_SCHEMA,
  POLICY_PATH,
  MEMORY_PATH,
  PROFILE_OUTPUT_SCHEMA,
  TRIAGE_OUTPUT_SCHEMA,
  buildDefaultMemory,
  buildDefaultPolicy,
  buildBrowserTriagePrompt,
  buildFailureResult,
  buildProfilePrompt,
  buildTriagePrompt,
  classifyFailure,
  ensureJsonFile,
  getRunStamp,
  loadProjectContext,
  mergeMemory,
  runCodexJson,
  validateBrowserTriageResult,
  validateTriageResult,
  writeRunArtifacts,
} from './inbox-triage.mjs';
import { requestJsonFromGitHubModels } from './github-models.mjs';
import {
  collectBrowserMailboxSnapshot,
  createBrowserReplies,
} from './gmail-browser.mjs';
import { parseCliOptions } from './common.mjs';

const execFile = promisify(execFileCallback);
const DEFAULT_GH_BIN = '/opt/homebrew/bin/gh';

function chunkThreads(threads, chunkSize) {
  const chunks = [];

  for (let index = 0; index < threads.length; index += chunkSize) {
    chunks.push(threads.slice(index, index + chunkSize));
  }

  return chunks;
}

function mergeByThreadId(items, key = 'thread_id') {
  const merged = new Map();

  for (const item of items) {
    if (!item?.[key]) {
      continue;
    }

    merged.set(item[key], item);
  }

  return [...merged.values()];
}

async function runBrowserModelTriage({ policy, memory, context, browserSnapshot, dryRun }) {
  const chunkSize = Math.max(1, Number(policy.browser_fallback?.triage_chunk_size ?? 2));
  const chunks = chunkThreads(browserSnapshot.threads ?? [], chunkSize);
  const decisions = [];

  for (const [index, threads] of chunks.entries()) {
    const chunkSnapshot = {
      ...browserSnapshot,
      search_runs: index === 0 ? browserSnapshot.search_runs : [],
      threads,
    };

    const decision = await requestJsonFromGitHubModels({
      systemPrompt: [
        'You are a deterministic Gmail inbox triage assistant for a project owner.',
        'Return valid JSON only.',
        'Use only the supplied mailbox snapshot and project context.',
        'Do not invent threads, senders, or facts that are not present in the provided data.',
      ].join('\n'),
      userPrompt: buildBrowserTriagePrompt({
        policy,
        memory,
        context,
        browserSnapshot: chunkSnapshot,
        dryRun,
      }),
      validate: validateBrowserTriageResult,
      maxTokens: 4000,
      temperature: 0.2,
      model: process.env.GITHUB_MODELS_MODEL?.trim() || 'openai/gpt-4.1',
    });

    decisions.push(decision);
  }

  return {
    success: decisions.every((decision) => decision.success),
    delivery_mode: getDeliveryMode(policy),
    coverage: decisions[0]?.coverage?.scope_note ? decisions[0].coverage : {
      recent_days: policy.search_windows?.recent_days ?? 30,
      context_days: policy.search_windows?.context_days ?? 90,
      scope_note: `Chunked browser triage across ${chunks.length} batch(es).`,
    },
    summary: decisions.map((decision) => decision.summary).filter(Boolean).join(' ').trim()
      || 'No reply-worthy AITHREATBRIEF or affiliate threads were identified in the scanned browser snapshot.',
    reply: mergeByThreadId(decisions.flatMap((decision) => decision.reply ?? [])),
    waiting: mergeByThreadId(decisions.flatMap((decision) => decision.waiting ?? [])),
    ops_alert: mergeByThreadId(decisions.flatMap((decision) => decision.ops_alert ?? [])),
    ignore: mergeByThreadId(decisions.flatMap((decision) => decision.ignore ?? [])),
    advice_review: mergeByThreadId(decisions.flatMap((decision) => decision.advice_review ?? [])),
    drafts_created: mergeByThreadId(decisions.flatMap((decision) => decision.drafts_created ?? [])),
    replies_sent: mergeByThreadId(decisions.flatMap((decision) => decision.replies_sent ?? [])),
    follow_ups: mergeByThreadId(decisions.flatMap((decision) => decision.follow_ups ?? [])),
    failures: decisions.flatMap((decision) => decision.failures ?? []),
    notes: [
      ...decisions.flatMap((decision) => decision.notes ?? []),
      `Browser triage used ${chunks.length} chunk${chunks.length === 1 ? '' : 's'} for model classification.`,
    ],
    reply_requests: mergeByThreadId(decisions.flatMap((decision) => decision.reply_requests ?? [])),
  };
}

function getDeliveryMode(policy) {
  return policy.reply_policy?.mode === 'auto_send' ? 'auto_send' : 'draft_only';
}

function getDegradedDryRunPolicy(policy) {
  return policy.degraded_mode?.dry_run_policy === 'heuristic_ok' ? 'heuristic_ok' : 'fail_closed';
}

function getDegradedLivePolicy(policy) {
  return policy.degraded_mode?.live_policy === 'heuristic_ok' ? 'heuristic_ok' : 'fail_closed';
}

function normalizeText(value) {
  return String(value ?? '').trim().toLowerCase();
}

function extractDomain(email) {
  const normalized = normalizeText(email);
  const atIndex = normalized.lastIndexOf('@');
  return atIndex === -1 ? normalized : normalized.slice(atIndex + 1);
}

function latestThreadMessage(thread) {
  const messages = Array.isArray(thread?.messages) ? thread.messages : [];
  return messages[messages.length - 1] ?? null;
}

function threadHaystack(thread) {
  const latest = latestThreadMessage(thread);
  return [
    thread?.subject,
    thread?.row_sender,
    thread?.row_sender_email,
    latest?.sender_name,
    latest?.sender_email,
    ...(thread?.messages ?? []).map((message) => message.body),
  ].join('\n').toLowerCase();
}

function buildThreadSummary(thread, why, nextAction, draftNeeded = false) {
  const latest = latestThreadMessage(thread);
  return {
    thread_id: thread.thread_id,
    sender: thread.row_sender_email || latest?.sender_email || thread.row_sender || latest?.sender_name || 'unknown',
    subject: thread.subject || '(no subject)',
    latest_message_date: latest?.timestamp || thread.row_date_label || 'unknown',
    why,
    next_action: nextAction,
    draft_needed: draftNeeded,
  };
}

function truncateMessage(error) {
  return (error instanceof Error ? error.message : String(error)).slice(0, 600);
}

function runBrowserHeuristicTriage({ policy, browserSnapshot, dryRun, modelError, codexError }) {
  const mailboxEmail = normalizeText(policy.mailbox_email);
  const projectTerms = (policy.matching?.domain_terms ?? policy.project_identifiers ?? []).map(normalizeText).filter(Boolean);
  const commercialTerms = (policy.matching?.commercial_terms ?? []).map(normalizeText).filter(Boolean);
  const priorityDomains = (policy.matching?.priority_senders ?? []).map(normalizeText).filter(Boolean);
  const opsDomains = (policy.matching?.ops_senders ?? []).map(normalizeText).filter(Boolean);
  const reply = [];
  const waiting = [];
  const opsAlert = [];
  const ignore = [];

  for (const thread of browserSnapshot.threads ?? []) {
    const latest = latestThreadMessage(thread);
    const latestSenderEmail = normalizeText(latest?.sender_email || thread.row_sender_email);
    const senderDomain = extractDomain(latestSenderEmail || thread.row_sender_email);
    const haystack = threadHaystack(thread);
    const subject = normalizeText(thread.subject);
    const latestFromMailbox = latestSenderEmail === mailboxEmail;
    const hasProjectTerm = projectTerms.some((term) => haystack.includes(term));
    const hasCommercialTerm = commercialTerms.some((term) => haystack.includes(term));
    const isPrioritySender = priorityDomains.some((domain) => senderDomain === domain || senderDomain.endsWith(`.${domain}`));
    const isOpsSender = opsDomains.some((domain) => senderDomain === domain || senderDomain.endsWith(`.${domain}`));
    const isGitHubOps =
      senderDomain === 'github.com'
      && /security-brief|verify and deploy|workflow run|run failed/.test(haystack);

    if (isOpsSender || isGitHubOps) {
      opsAlert.push(buildThreadSummary(
        thread,
        'Operational notification matched the project repo and indicates verification or deployment failure.',
        'Inspect the failed workflow run and decide whether the build or deploy needs a manual fix.',
      ));
      continue;
    }

    if ((hasProjectTerm || isPrioritySender) && hasCommercialTerm && !latestFromMailbox) {
      waiting.push(buildThreadSummary(
        thread,
        dryRun
          ? 'Commercially relevant thread matched project or priority-sender heuristics, but no model backend was available to safely draft a response.'
          : 'Commercially relevant thread matched project or priority-sender heuristics, but heuristic mode stayed conservative and did not auto-compose a reply.',
        'Review manually before replying, because automated drafting fallback was unavailable.',
      ));
      continue;
    }

    ignore.push(buildThreadSummary(
      thread,
      'Thread did not match project, partner, or operations heuristics strongly enough to require action.',
      'No action.',
    ));
  }

  const actionCount = reply.length + waiting.length + opsAlert.length;

  return {
    success: true,
    delivery_mode: getDeliveryMode(policy),
    mailbox: browserSnapshot.mailbox_email,
    coverage: {
      recent_days: policy.search_windows?.recent_days ?? 30,
      context_days: policy.search_windows?.context_days ?? 90,
      scope_note: 'Heuristic browser triage completed from the Gmail browser snapshot without external model providers.',
    },
    summary: actionCount > 0
      ? `Heuristic triage completed with ${reply.length} reply, ${waiting.length} waiting, and ${opsAlert.length} ops alert thread${actionCount === 1 ? '' : 's'}.`
      : 'Heuristic triage found no reply-worthy AITHREATBRIEF or partner threads in the scanned browser snapshot.',
    reply,
    waiting,
    ops_alert: opsAlert,
    ignore,
    advice_review: [],
    drafts_created: [],
    replies_sent: [],
    follow_ups: [],
    failures: [],
    notes: [
      'Browser triage used deterministic local heuristics because model-based classification was unavailable.',
      `GitHub Models fallback note: ${truncateMessage(modelError)}`,
      `Codex structured-output fallback note: ${truncateMessage(codexError)}`,
      dryRun
        ? 'Dry run mode was enabled; heuristic triage did not create any reply requests.'
        : 'Heuristic triage stayed conservative and did not auto-compose replies.',
    ],
    reply_requests: [],
  };
}

function buildModelBackedFailClosedResult({
  policy,
  browserSnapshot,
  runStamp,
  preflight,
  preflightFailure,
  modelError,
  codexError,
}) {
  const result = buildFailureResult({
    runStamp,
    mailbox: browserSnapshot.mailbox_email || policy.mailbox_email,
    deliveryMode: getDeliveryMode(policy),
    preflight: preflight.json,
    failure: {
      stage: 'browser-triage',
      message: 'Live run failed closed because model-backed classification was unavailable after browser mailbox fallback succeeded.',
      retryable: true,
    },
    notes: [
      `Gmail connector preflight failed: ${preflightFailure.message}`,
      `Browser fallback used Chrome CDP ${browserSnapshot.cdp_url}${browserSnapshot.launched_browser ? ' after launching Chrome' : ''}.`,
      'Live degraded-mode policy is fail_closed, so no drafts or replies were created.',
      `GitHub Models fallback note: ${truncateMessage(modelError)}`,
      `Codex structured-output fallback note: ${truncateMessage(codexError)}`,
    ],
  });

  return {
    ...result,
    coverage: {
      recent_days: policy.search_windows?.recent_days ?? 30,
      context_days: policy.search_windows?.context_days ?? 90,
      scope_note: 'Browser mailbox snapshot completed, but live classification stopped because model-backed triage was unavailable.',
    },
  };
}

async function runBrowserCodexTriage({ policy, memory, context, browserSnapshot, dryRun }) {
  const triage = await runCodexJson({
    prompt: buildBrowserTriagePrompt({
      policy,
      memory,
      context,
      browserSnapshot,
      dryRun,
    }),
    schema: BROWSER_TRIAGE_OUTPUT_SCHEMA,
    timeoutMs: 300000,
  });

  if (!triage.json || triage.code !== 0) {
    throw new Error(triage.stderr || 'Codex browser triage did not return valid structured output.');
  }

  validateBrowserTriageResult(triage.json);

  return {
    ...triage.json,
    delivery_mode: getDeliveryMode(policy),
    coverage: triage.json.coverage?.scope_note ? triage.json.coverage : {
      recent_days: policy.search_windows?.recent_days ?? 30,
      context_days: policy.search_windows?.context_days ?? 90,
      scope_note: 'Browser triage used Codex structured-output fallback.',
    },
    summary: triage.json.summary?.trim()
      || 'No reply-worthy AITHREATBRIEF or affiliate threads were identified in the scanned browser snapshot.',
    notes: [
      ...(triage.json.notes ?? []),
      'Browser triage used Codex structured-output fallback after GitHub Models was unavailable.',
    ],
  };
}

function extractPreflightFailure(preflightResult) {
  if (!preflightResult.json || preflightResult.code !== 0) {
    return classifyFailure(preflightResult.stderr, 'preflight');
  }

  if (preflightResult.json.ok !== true || !preflightResult.json.email) {
    return classifyFailure(preflightResult.stderr, 'preflight');
  }

  return null;
}

async function runBrowserFallback({
  options,
  policy,
  memory,
  context,
  runStamp,
  preflightFailure,
  preflight,
}) {
  let browserSnapshot;

  try {
    browserSnapshot = await collectBrowserMailboxSnapshot(policy, memory);
  } catch (error) {
    return buildFailureResult({
      runStamp,
      mailbox: policy.mailbox_email,
      failure: {
        stage: 'browser-fallback',
        message: error instanceof Error ? error.message : String(error),
        retryable: false,
      },
      preflight: preflight.json,
      notes: [
        `Gmail connector preflight failed: ${preflightFailure.message}`,
        'Browser fallback could not establish Gmail access.',
      ],
    });
  }

  let browserDecision;
  let modelError = null;

  try {
    await ensureGitHubModelsToken();
    browserDecision = await runBrowserModelTriage({
      policy,
      memory,
      context,
      browserSnapshot,
      dryRun: options.dryRun,
    });
  } catch (error) {
    modelError = error;
    try {
      browserDecision = await runBrowserCodexTriage({
        policy,
        memory,
        context,
        browserSnapshot,
        dryRun: options.dryRun,
      });
    } catch (fallbackError) {
      const allowHeuristic =
        options.dryRun
          ? getDegradedDryRunPolicy(policy) === 'heuristic_ok'
          : getDegradedLivePolicy(policy) !== 'fail_closed';

      if (!allowHeuristic) {
        return buildModelBackedFailClosedResult({
          policy,
          browserSnapshot,
          runStamp,
          preflight,
          preflightFailure,
          modelError,
          codexError: fallbackError,
        });
      }

      browserDecision = runBrowserHeuristicTriage({
        policy,
        browserSnapshot,
        dryRun: options.dryRun,
        modelError,
        codexError: fallbackError,
      });
    }
  }

  let draftsCreated = [];
  let repliesSent = [];
  let replyFailures = [];

  if (!options.dryRun && browserDecision.reply_requests.length > 0) {
    try {
      const replyOutcome = await createBrowserReplies(policy, browserSnapshot, browserDecision.reply_requests);
      draftsCreated = replyOutcome.created;
      repliesSent = replyOutcome.sent;
      replyFailures = replyOutcome.failures;
    } catch (error) {
      replyFailures = [
        {
          stage: policy.reply_policy?.mode === 'auto_send' ? 'send' : 'draft',
          message: error instanceof Error ? error.message : String(error),
          retryable: false,
        },
      ];
    }
  }

  return {
    success: browserDecision.success && replyFailures.length === 0,
    delivery_mode: browserDecision.delivery_mode,
    mailbox: browserSnapshot.mailbox_email,
    coverage: browserDecision.coverage,
    summary: browserDecision.summary,
    reply: browserDecision.reply,
    waiting: browserDecision.waiting,
    ops_alert: browserDecision.ops_alert,
    ignore: browserDecision.ignore,
    advice_review: browserDecision.advice_review,
    drafts_created: options.dryRun ? [] : draftsCreated,
    replies_sent: options.dryRun ? [] : repliesSent,
    follow_ups: browserDecision.follow_ups,
    failures: [
      ...browserDecision.failures,
      ...replyFailures,
    ],
    notes: [
      ...browserDecision.notes,
      `Gmail connector preflight failed: ${preflightFailure.message}`,
      `Browser fallback used Chrome CDP ${browserSnapshot.cdp_url}${browserSnapshot.launched_browser ? ' after launching Chrome' : ''}.`,
      options.dryRun
        ? 'Dry run mode was enabled; browser replies were not created.'
        : policy.reply_policy?.mode === 'auto_send'
          ? `Browser fallback sent ${repliesSent.length} Gmail repl${repliesSent.length === 1 ? 'y' : 'ies'}.`
          : `Browser fallback prepared ${draftsCreated.length} Gmail draft${draftsCreated.length === 1 ? '' : 's'}.`,
    ],
  };
}

async function ensureGitHubModelsToken() {
  if (process.env.GITHUB_MODELS_TOKEN?.trim() || process.env.GITHUB_TOKEN?.trim()) {
    return;
  }

  const ghBin = process.env.GH_BIN?.trim() || DEFAULT_GH_BIN;
  const { stdout } = await execFile(ghBin, ['auth', 'token']);
  const token = stdout.trim();

  if (!token) {
    throw new Error('GitHub Models token could not be resolved from gh auth token.');
  }

  process.env.GITHUB_TOKEN = token;
}

async function main() {
  const options = parseCliOptions();
  const runStamp = getRunStamp();

  const [policy, memory, context] = await Promise.all([
    ensureJsonFile(POLICY_PATH, buildDefaultPolicy()),
    ensureJsonFile(MEMORY_PATH, buildDefaultMemory()),
    loadProjectContext(),
  ]);

  const preflight = await runCodexJson({
    prompt: buildProfilePrompt({
      connectorId: policy.connector_id ?? 'connector_2128aebfecb84f64a069897515042a44',
      mailboxEmail: policy.mailbox_email,
    }),
    schema: PROFILE_OUTPUT_SCHEMA,
  });

  const preflightFailure = extractPreflightFailure(preflight);

  if (preflightFailure) {
    const fallbackResult = await runBrowserFallback({
      options,
      policy,
      memory,
      context,
      runStamp,
      preflightFailure,
      preflight,
    });
    const nextMemory = mergeMemory(memory, fallbackResult, runStamp);
    const reportPaths = await writeRunArtifacts({
      runStamp,
      result: fallbackResult,
      memory: nextMemory,
    });

    if (fallbackResult.success) {
      console.log(JSON.stringify({
        success: fallbackResult.success,
        mailbox: fallbackResult.mailbox,
        markdown_report: reportPaths.markdownPath,
        json_report: reportPaths.jsonPath,
        mode: 'browser-fallback',
      }));
    } else {
      console.error(`Inbox triage preflight failed. Report written to ${reportPaths.markdownPath}`);
      process.exitCode = 1;
    }
    return;
  }

  const triage = await runCodexJson({
    prompt: buildTriagePrompt({
      connectorId: policy.connector_id ?? 'connector_2128aebfecb84f64a069897515042a44',
      policy,
      memory,
      context,
      dryRun: options.dryRun,
    }),
    schema: TRIAGE_OUTPUT_SCHEMA,
    timeoutMs: 300000,
  });

  let result;

  if (!triage.json || triage.code !== 0) {
    result = buildFailureResult({
      runStamp,
      mailbox: policy.mailbox_email,
      deliveryMode: getDeliveryMode(policy),
      failure: classifyFailure(triage.stderr, 'triage'),
      preflight: preflight.json,
      notes: [
        options.dryRun
          ? 'Dry run mode was enabled.'
          : policy.reply_policy?.mode === 'auto_send'
            ? 'Reply sending was enabled for reply-worthy threads.'
            : 'Draft creation was enabled for reply-worthy threads.',
        `Mailbox triage used the Gmail connector directly for ${preflight.json.email}.`,
      ],
    });
  } else {
    validateTriageResult(triage.json);
    result = {
      ...triage.json,
      run_at: runStamp.display,
      mailbox: triage.json.mailbox || policy.mailbox_email,
      notes: [
        ...(triage.json.notes ?? []),
        `Mailbox preflight succeeded for ${preflight.json.email}.`,
        `Mailbox triage used the Gmail connector directly for ${preflight.json.email}.`,
        options.dryRun
          ? 'Dry run mode was enabled; no Gmail replies should have been created.'
          : policy.reply_policy?.mode === 'auto_send'
            ? 'Auto-send mode is active for reply-worthy Gmail threads.'
            : 'Draft-only mode is active; auto-send is disabled.',
      ],
    };
  }

  const nextMemory = mergeMemory(memory, result, runStamp);
  const reportPaths = await writeRunArtifacts({
    runStamp,
    result,
    memory: nextMemory,
  });

  console.log(JSON.stringify({
    success: result.success,
    mailbox: result.mailbox,
    markdown_report: reportPaths.markdownPath,
    json_report: reportPaths.jsonPath,
  }));

  if (!result.success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
