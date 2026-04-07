#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import {
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
  createBrowserDrafts,
} from './gmail-browser.mjs';
import { parseCliOptions } from './common.mjs';

const execFile = promisify(execFileCallback);
const DEFAULT_GH_BIN = '/opt/homebrew/bin/gh';

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

  try {
    await ensureGitHubModelsToken();
    browserDecision = await requestJsonFromGitHubModels({
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
        browserSnapshot,
        dryRun: options.dryRun,
      }),
      validate: validateBrowserTriageResult,
      maxTokens: 4000,
      temperature: 0.2,
    });
  } catch (error) {
    return buildFailureResult({
      runStamp,
      mailbox: browserSnapshot.mailbox_email,
      failure: {
        stage: 'browser-triage',
        message: error instanceof Error ? error.message : String(error),
        retryable: false,
      },
      preflight: preflight.json,
      notes: [
        `Gmail connector preflight failed: ${preflightFailure.message}`,
        `Browser fallback reached ${browserSnapshot.mailbox_email} through Chrome CDP ${browserSnapshot.cdp_url}.`,
      ],
    });
  }

  let draftsCreated = [];
  let draftFailures = [];

  if (!options.dryRun && browserDecision.draft_requests.length > 0) {
    try {
      const draftOutcome = await createBrowserDrafts(policy, browserSnapshot, browserDecision.draft_requests);
      draftsCreated = draftOutcome.created;
      draftFailures = draftOutcome.failures;
    } catch (error) {
      draftFailures = [
        {
          stage: 'draft',
          message: error instanceof Error ? error.message : String(error),
          retryable: false,
        },
      ];
    }
  }

  return {
    success: browserDecision.success && draftFailures.length === 0,
    mailbox: browserSnapshot.mailbox_email,
    coverage: browserDecision.coverage,
    summary: browserDecision.summary,
    reply: browserDecision.reply,
    waiting: browserDecision.waiting,
    ops_alert: browserDecision.ops_alert,
    ignore: browserDecision.ignore,
    advice_review: browserDecision.advice_review,
    drafts_created: options.dryRun ? [] : draftsCreated,
    follow_ups: browserDecision.follow_ups,
    failures: [
      ...browserDecision.failures,
      ...draftFailures,
    ],
    notes: [
      ...browserDecision.notes,
      `Gmail connector preflight failed: ${preflightFailure.message}`,
      `Browser fallback used Chrome CDP ${browserSnapshot.cdp_url}${browserSnapshot.launched_browser ? ' after launching Chrome' : ''}.`,
      options.dryRun
        ? 'Dry run mode was enabled; browser drafts were not created.'
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
      failure: classifyFailure(triage.stderr, 'triage'),
      preflight: preflight.json,
      notes: [
        options.dryRun ? 'Dry run mode was enabled.' : 'Draft creation was enabled for reply-worthy threads.',
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
        options.dryRun ? 'Dry run mode was enabled; no Gmail drafts should have been created.' : 'Draft-only mode is active; auto-send is disabled.',
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
