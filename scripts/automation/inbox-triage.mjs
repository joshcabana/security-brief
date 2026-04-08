#!/usr/bin/env node

import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { homedir, tmpdir } from 'node:os';
import path from 'node:path';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { TIME_ZONE, REPO_ROOT, getLocalTimeParts, writeText } from './common.mjs';

export const GMAIL_CONNECTOR_ID = 'connector_2128aebfecb84f64a069897515042a44';
export const AUTOMATION_ROOT = path.join(homedir(), '.codex', 'automations', 'gmail-triage');
export const POLICY_PATH = path.join(AUTOMATION_ROOT, 'policy.json');
export const MEMORY_PATH = path.join(AUTOMATION_ROOT, 'memory.json');
export const REPORTS_DIR = path.join(AUTOMATION_ROOT, 'reports');
export const LOG_DIR = path.join(homedir(), '.codex', 'log');
export const DEFAULT_CODEX_BIN = '/Users/castillo/.antigravity/extensions/openai.chatgpt-26.325.31654-darwin-arm64/bin/macos-aarch64/codex';

export const PROFILE_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    ok: { type: 'boolean' },
    email: { type: 'string' },
    error: { type: 'string' },
  },
  required: ['ok', 'email'],
  additionalProperties: false,
};

export const TRIAGE_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    delivery_mode: {
      type: 'string',
      enum: ['draft_only', 'auto_send'],
    },
    mailbox: { type: 'string' },
    coverage: {
      type: 'object',
      properties: {
        recent_days: { type: 'number' },
        context_days: { type: 'number' },
        scope_note: { type: 'string' },
      },
      required: ['recent_days', 'context_days', 'scope_note'],
      additionalProperties: false,
    },
    summary: { type: 'string' },
    reply: {
      type: 'array',
      items: { $ref: '#/$defs/threadSummary' },
    },
    waiting: {
      type: 'array',
      items: { $ref: '#/$defs/threadSummary' },
    },
    ops_alert: {
      type: 'array',
      items: { $ref: '#/$defs/threadSummary' },
    },
    ignore: {
      type: 'array',
      items: { $ref: '#/$defs/threadSummary' },
    },
    advice_review: {
      type: 'array',
      items: { $ref: '#/$defs/adviceReview' },
    },
    drafts_created: {
      type: 'array',
      items: { $ref: '#/$defs/draftSummary' },
    },
    replies_sent: {
      type: 'array',
      items: { $ref: '#/$defs/replySummary' },
    },
    follow_ups: {
      type: 'array',
      items: { $ref: '#/$defs/followUpSummary' },
    },
    failures: {
      type: 'array',
      items: { $ref: '#/$defs/failureSummary' },
    },
    notes: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: [
    'success',
    'delivery_mode',
    'mailbox',
    'coverage',
    'summary',
    'reply',
    'waiting',
    'ops_alert',
    'ignore',
    'advice_review',
    'drafts_created',
    'replies_sent',
    'follow_ups',
    'failures',
    'notes',
  ],
  additionalProperties: false,
  $defs: {
    threadSummary: {
      type: 'object',
      properties: {
        thread_id: { type: 'string' },
        sender: { type: 'string' },
        subject: { type: 'string' },
        latest_message_date: { type: 'string' },
        why: { type: 'string' },
        next_action: { type: 'string' },
        draft_needed: { type: 'boolean' },
      },
      required: [
        'thread_id',
        'sender',
        'subject',
        'latest_message_date',
        'why',
        'next_action',
        'draft_needed',
      ],
      additionalProperties: false,
    },
    adviceReview: {
      type: 'object',
      properties: {
        thread_id: { type: 'string' },
        sender: { type: 'string' },
        subject: { type: 'string' },
        recommendation: {
          type: 'string',
          enum: ['take', 'consider', 'push_back'],
        },
        rationale: { type: 'string' },
        suggested_stance: { type: 'string' },
      },
      required: ['thread_id', 'sender', 'subject', 'recommendation', 'rationale', 'suggested_stance'],
      additionalProperties: false,
    },
    draftSummary: {
      type: 'object',
      properties: {
        thread_id: { type: 'string' },
        sender: { type: 'string' },
        subject: { type: 'string' },
        draft_id: { type: 'string' },
      },
      required: ['thread_id', 'sender', 'subject', 'draft_id'],
      additionalProperties: false,
    },
    replySummary: {
      type: 'object',
      properties: {
        thread_id: { type: 'string' },
        sender: { type: 'string' },
        subject: { type: 'string' },
        reply_id: { type: 'string' },
      },
      required: ['thread_id', 'sender', 'subject', 'reply_id'],
      additionalProperties: false,
    },
    followUpSummary: {
      type: 'object',
      properties: {
        thread_id: { type: 'string' },
        sender: { type: 'string' },
        subject: { type: 'string' },
        status: { type: 'string' },
        next_action: { type: 'string' },
      },
      required: ['thread_id', 'sender', 'subject', 'status', 'next_action'],
      additionalProperties: false,
    },
    failureSummary: {
      type: 'object',
      properties: {
        stage: { type: 'string' },
        message: { type: 'string' },
        retryable: { type: 'boolean' },
      },
      required: ['stage', 'message', 'retryable'],
      additionalProperties: false,
    },
  },
};

export const BROWSER_TRIAGE_OUTPUT_SCHEMA = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    delivery_mode: TRIAGE_OUTPUT_SCHEMA.properties.delivery_mode,
    mailbox: { type: 'string' },
    coverage: TRIAGE_OUTPUT_SCHEMA.properties.coverage,
    summary: { type: 'string' },
    reply: TRIAGE_OUTPUT_SCHEMA.properties.reply,
    waiting: TRIAGE_OUTPUT_SCHEMA.properties.waiting,
    ops_alert: TRIAGE_OUTPUT_SCHEMA.properties.ops_alert,
    ignore: TRIAGE_OUTPUT_SCHEMA.properties.ignore,
    advice_review: TRIAGE_OUTPUT_SCHEMA.properties.advice_review,
    drafts_created: TRIAGE_OUTPUT_SCHEMA.properties.drafts_created,
    replies_sent: TRIAGE_OUTPUT_SCHEMA.properties.replies_sent,
    follow_ups: TRIAGE_OUTPUT_SCHEMA.properties.follow_ups,
    failures: TRIAGE_OUTPUT_SCHEMA.properties.failures,
    notes: TRIAGE_OUTPUT_SCHEMA.properties.notes,
    reply_requests: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          thread_id: { type: 'string' },
          sender: { type: 'string' },
          subject: { type: 'string' },
          reply_all: { type: 'boolean' },
          body: { type: 'string' },
        },
        required: ['thread_id', 'sender', 'subject', 'reply_all', 'body'],
        additionalProperties: false,
      },
    },
  },
  required: [
    'success',
    'delivery_mode',
    'mailbox',
    'coverage',
    'summary',
    'reply',
    'waiting',
    'ops_alert',
    'ignore',
    'advice_review',
    'drafts_created',
    'replies_sent',
    'follow_ups',
    'failures',
    'notes',
    'reply_requests',
  ],
  additionalProperties: false,
  $defs: TRIAGE_OUTPUT_SCHEMA.$defs,
};

export function buildDefaultPolicy() {
  return {
    version: 2,
    connector_id: GMAIL_CONNECTOR_ID,
    mailbox_email: 'cabana.collections2025@gmail.com',
    project_name: 'AI Security Brief',
    project_identifiers: [
      'AI Security Brief',
      'AITHREATBRIEF.com',
      'aithreatbrief',
      'aithreatbrief.com',
    ],
    search_windows: {
      recent_days: 30,
      context_days: 90,
    },
    matching: {
      mode: 'broad',
      domain_terms: [
        'AI Security Brief',
        'AITHREATBRIEF.com',
        'aithreatbrief',
        'aithreatbrief.com',
      ],
      commercial_terms: [
        'affiliate',
        'affiliates',
        'referral',
        'referrals',
        'partner',
        'partnership',
        'partner program',
        'commission',
        'collaboration',
        'sponsor',
        'sponsorship',
        'newsletter swap',
        'media buy',
        'paid placement',
        'promo',
        'promotion',
      ],
      priority_senders: [
        'puresquare.com',
        'partnerize.com',
        'impact.com',
        'surfshark.com',
        'proton.ch',
        'proton.me',
      ],
      ops_senders: [],
    },
    tone: {
      style: 'direct, credible, concise, commercially aware',
      avoid: [
        'overstating metrics',
        'sounding late or underprepared',
        'agreeing automatically with self-serving advice',
      ],
      preserve: [
        'project-owner voice',
        'polite firmness',
        'clear next steps',
      ],
    },
    reply_policy: {
      mode: 'auto_send',
      read_full_thread_context: true,
      skip_if_last_message_from_mailbox: true,
      skip_if_recent_substantive_reply: true,
      recent_reply_window_hours: 72,
      avoid_duplicate_replies: true,
      sensitive_topics: ['legal', 'commercial terms', 'pricing', 'contracts', 'conflict'],
    },
    degraded_mode: {
      dry_run_policy: 'heuristic_ok',
      live_policy: 'fail_closed',
    },
    browser_fallback: {
      enabled: true,
      cdp_url: 'http://127.0.0.1:9222',
      chrome_binary: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      chrome_profile_dir: path.join(homedir(), '.gemini', 'antigravity-browser-profile'),
      runtime_dir: path.join(homedir(), '.codex', 'automations', 'gmail-triage-runtime'),
      search_result_limit: 8,
      thread_limit: 4,
      triage_chunk_size: 1,
      max_messages_per_thread: 3,
      max_message_chars: 500,
      max_thread_chars: 1400,
    },
    advice_heuristics: {
      take: 'Improves conversion, trust, operations, or partnership quality with low downside.',
      consider: 'Potentially useful but unvalidated, incomplete, or non-urgent.',
      push_back: 'Self-serving, weak, off-strategy, risky, or not supported by current project goals.',
    },
  };
}

export function buildDefaultMemory() {
  return {
    version: 2,
    last_run_at: null,
    last_successful_run_at: null,
    handled_threads: {},
    reply_history: {},
    open_follow_ups: {},
    advice_history: {},
    draft_history: {},
    notes: [],
  };
}

function getPrioritySenders(policy) {
  return policy.matching?.priority_senders ?? policy.priority_senders ?? [];
}

function getOpsSenders(policy) {
  return policy.matching?.ops_senders ?? policy.ops_senders ?? [];
}

function getCommercialTerms(policy) {
  return policy.matching?.commercial_terms ?? [];
}

function getReplyMode(policy) {
  return policy.reply_policy?.mode === 'draft_only' ? 'draft_only' : 'auto_send';
}

function getMemorySnapshot(memory) {
  const handledEntries = Object.entries(memory?.handled_threads ?? {})
    .slice(-12)
    .map(([threadId, value]) => [threadId, value]);
  const replyEntries = Object.entries(memory?.reply_history ?? {})
    .slice(-12)
    .map(([threadId, value]) => [threadId, value]);
  const followUpEntries = Object.entries(memory?.open_follow_ups ?? {})
    .slice(0, 8)
    .map(([threadId, value]) => [threadId, value]);

  return {
    last_run_at: memory?.last_run_at ?? null,
    last_successful_run_at: memory?.last_successful_run_at ?? null,
    handled_threads: Object.fromEntries(handledEntries),
    reply_history: Object.fromEntries(replyEntries),
    open_follow_ups: Object.fromEntries(followUpEntries),
    notes: Array.isArray(memory?.notes) ? memory.notes.slice(-6) : [],
  };
}

function getPolicySnapshot(policy) {
  return {
    mailbox_email: policy.mailbox_email,
    project_name: policy.project_name,
    project_identifiers: policy.project_identifiers,
    search_windows: policy.search_windows,
    matching: {
      mode: policy.matching?.mode,
      domain_terms: policy.matching?.domain_terms ?? [],
      commercial_terms: policy.matching?.commercial_terms ?? [],
      priority_senders: getPrioritySenders(policy),
    },
    reply_policy: policy.reply_policy,
    degraded_mode: policy.degraded_mode ?? null,
    tone: policy.tone,
    advice_heuristics: policy.advice_heuristics,
  };
}

function getProjectContextSnapshot(context) {
  return {
    status_excerpt: trimContext(context?.status_excerpt ?? '', 1400),
    readme_excerpt: trimContext(context?.readme_excerpt ?? '', 600),
  };
}

function getBrowserSnapshotForPrompt(browserSnapshot) {
  return {
    transport: browserSnapshot.transport,
    mailbox_email: browserSnapshot.mailbox_email,
    threads: (browserSnapshot.threads ?? []).map((thread) => ({
      thread_id: thread.thread_id,
      subject: thread.subject,
      row_date_label: thread.row_date_label,
      row_sender: thread.row_sender,
      row_sender_email: thread.row_sender_email,
      thread_url: thread.thread_url,
      messages: (thread.messages ?? []).map((message) => ({
        sender_name: message.sender_name,
        sender_email: message.sender_email,
        timestamp: message.timestamp,
        body: message.body,
      })),
    })),
  };
}

export async function ensureJsonFile(filePath, defaultValue) {
  if (!existsSync(filePath)) {
    await writeText(filePath, `${JSON.stringify(defaultValue, null, 2)}\n`);
    return structuredClone(defaultValue);
  }

  const raw = await readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

export function getRunStamp(date = new Date()) {
  const parts = getLocalTimeParts(date, TIME_ZONE);
  const hour = String(parts.hour).padStart(2, '0');
  const minute = String(parts.minute).padStart(2, '0');
  const second = String(parts.second).padStart(2, '0');

  return {
    localDate: parts.date,
    timestamp: `${parts.date}T${hour}-${minute}-${second}`,
    display: `${parts.date} ${hour}:${minute}:${second} ${TIME_ZONE}`,
  };
}

export function getReportPaths(runStamp) {
  return {
    jsonPath: path.join(REPORTS_DIR, `${runStamp.timestamp}.json`),
    markdownPath: path.join(REPORTS_DIR, `${runStamp.timestamp}.md`),
  };
}

export async function loadProjectContext() {
  const statusPath = path.join(REPO_ROOT, 'STATUS.md');
  const readmePath = path.join(REPO_ROOT, 'README.md');

  const [statusSource, readmeSource] = await Promise.all([
    readFile(statusPath, 'utf8').catch(() => ''),
    readFile(readmePath, 'utf8').catch(() => ''),
  ]);

  return {
    status_excerpt: trimContext(statusSource, 5000),
    readme_excerpt: trimContext(readmeSource, 3500),
  };
}

export function trimContext(source, maxLength) {
  const cleaned = String(source).trim();
  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  return `${cleaned.slice(0, maxLength)}\n...[truncated]`;
}

export function buildProfilePrompt({ connectorId, mailboxEmail }) {
  return [
    `Use the Gmail app connector [$gmail](app://${connectorId}).`,
    'Confirm whether the connected mailbox matches the expected mailbox.',
    `Expected mailbox: ${mailboxEmail}.`,
    'Use Gmail connector actions only.',
    'Do not try to use MCP resources for Gmail.',
    'Do not send, draft, archive, label, or modify anything.',
    'Return JSON only using the provided schema.',
  ].join('\n');
}

export function buildTriagePrompt({
  connectorId,
  policy,
  memory,
  context,
  dryRun,
}) {
  return [
    `Use the Gmail app connector [$gmail](app://${connectorId}) and the gmail:gmail + gmail:gmail-inbox-triage skills.`,
    'Use Gmail connector actions only.',
    'Do not attempt MCP resource listing for Gmail.',
    `Mailbox to inspect: ${policy.mailbox_email}.`,
    `Project: ${policy.project_name}.`,
    `Recent search window: ${policy.search_windows.recent_days} days.`,
    `Human context window: ${policy.search_windows.context_days} days.`,
    dryRun
      ? 'Dry run: do not draft or send Gmail replies. Simulate reply-needed decisions in the structured output.'
      : getReplyMode(policy) === 'draft_only'
        ? 'Create Gmail drafts when a reply is clearly needed and confidence is sufficient. Never send email.'
        : 'Send Gmail replies when a reply is clearly needed and confidence is sufficient. Do not leave drafts unless delivery fails.',
    'Classify relevant threads into reply, waiting, ops_alert, or ignore.',
    'For advice from humans or partners, label it as take, consider, or push_back.',
    'Only use push_back when the advice is weak, self-serving, risky, or off-strategy.',
    'Avoid sounding vague, late, inflated, or naive in any draft stance.',
    'Avoid duplicate replies for threads already recorded in memory unless the thread materially changed.',
    'Use the project context and prior memory to keep continuity.',
    '',
    'Policy JSON:',
    JSON.stringify(getPolicySnapshot(policy)),
    '',
    'Memory JSON:',
    JSON.stringify(getMemorySnapshot(memory)),
    '',
    'Project context:',
    JSON.stringify(getProjectContextSnapshot(context)),
    '',
    'Return JSON only using the provided schema.',
  ].join('\n');
}

export function buildBrowserTriagePrompt({
  policy,
  memory,
  context,
  browserSnapshot,
  dryRun,
}) {
  return [
    'You are triaging Gmail data that has already been collected by browser automation from an authenticated Chrome session.',
    'Use only the supplied mailbox snapshot. Do not assume any mail outside this dataset exists.',
    `Expected mailbox: ${policy.mailbox_email}.`,
    `Observed mailbox: ${browserSnapshot.mailbox_email}.`,
    `Project: ${policy.project_name}.`,
    dryRun
      ? 'Dry run: do not request reply creation. Return an empty reply_requests array.'
      : getReplyMode(policy) === 'draft_only'
        ? 'Prepare reply_requests for reply-worthy threads when confidence is sufficient. Gmail drafts will be created.'
        : 'Prepare reply_requests for reply-worthy threads when confidence is sufficient. Gmail replies will be sent automatically.',
    'Every supplied thread already includes full-thread context from Gmail before classification.',
    'Classify each supplied thread into reply, waiting, ops_alert, or ignore.',
    'For advice from humans or partners, label it as take, consider, or push_back.',
    'Only include reply_requests for threads that are in the reply bucket.',
    'Each reply request must include the full reply body and whether reply_all should be used.',
    'If the latest message is already from the mailbox, do not include that thread in reply_requests.',
    'Do not create duplicate replies when memory already records a recent stable reply unless the thread materially changed.',
    '',
    'Policy JSON:',
    JSON.stringify(getPolicySnapshot(policy)),
    '',
    'Memory JSON:',
    JSON.stringify(getMemorySnapshot(memory)),
    '',
    'Project context:',
    JSON.stringify(getProjectContextSnapshot(context)),
    '',
    'Browser mailbox snapshot JSON:',
    JSON.stringify(getBrowserSnapshotForPrompt(browserSnapshot)),
    '',
    'Return JSON only using the provided schema.',
  ].join('\n');
}

export function resolveCodexBinary() {
  if (process.env.CODEX_BIN?.trim()) {
    return process.env.CODEX_BIN.trim();
  }

  if (existsSync(DEFAULT_CODEX_BIN)) {
    return DEFAULT_CODEX_BIN;
  }

  return 'codex';
}

export async function runCodexJson({ prompt, schema, cwd = REPO_ROOT, timeoutMs = 180000 }) {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'gmail-triage-'));
  const schemaPath = path.join(tempDir, 'schema.json');
  const codexBin = resolveCodexBinary();

  await writeFile(schemaPath, JSON.stringify(schema), 'utf8');

  const args = [
    'exec',
    '--skip-git-repo-check',
    '--ephemeral',
    '-C',
    cwd,
    '--output-schema',
    schemaPath,
    '-',
  ];

  try {
    const result = await spawnWithInput(codexBin, args, prompt, {
      cwd,
      env: {
        ...process.env,
      },
      timeoutMs,
    });

    return {
      code: result.code,
      stdout: result.stdout.trim(),
      stderr: result.stderr.trim(),
      json: parseJsonSafe(result.stdout),
      codexBin,
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export function parseJsonSafe(source) {
  try {
    return JSON.parse(source);
  } catch {
    return null;
  }
}

export function classifyFailure(stderr, stage) {
  const combined = String(stderr);

  if (/TokenRefreshFailed|invalid refresh token|invalid_grant/i.test(combined)) {
    return {
      stage,
      message: 'Codex CLI could not refresh connector authentication. Re-authentication is required for scheduled Gmail access.',
      retryable: false,
    };
  }

  if (/unknown MCP server 'Gmail'|unknown MCP server 'gmail'/i.test(combined)) {
    return {
      stage,
      message: 'Codex CLI attempted the wrong Gmail access path and did not reach the app connector.',
      retryable: true,
    };
  }

  return {
    stage,
    message: combined || `${stage} failed without stderr output.`,
    retryable: false,
  };
}

/**
 * @param {{
 *   runStamp: { display: string };
 *   mailbox: string;
 *   failure: { message: string; stage: string; retryable: boolean };
 *   preflight?: { email?: string } | null;
 *   notes?: string[];
 *   deliveryMode?: 'draft_only' | 'auto_send';
 * }} input
 */
export function buildFailureResult({
  runStamp,
  mailbox,
  failure,
  preflight = null,
  notes = [],
  deliveryMode = 'draft_only',
}) {
  return {
    success: false,
    delivery_mode: deliveryMode,
    run_at: runStamp.display,
    mailbox,
    coverage: {
      recent_days: 0,
      context_days: 0,
      scope_note: 'No mailbox scan completed.',
    },
    summary: failure.message,
    reply: [],
    waiting: [],
    ops_alert: [],
    ignore: [],
    advice_review: [],
    drafts_created: [],
    replies_sent: [],
    follow_ups: [],
    failures: [failure],
    notes: [
      ...(preflight?.email ? [`Preflight mailbox: ${preflight.email}`] : []),
      ...notes,
    ],
  };
}

export function mergeMemory(memory, result, runStamp) {
  const next = structuredClone(memory);
  next.reply_history ??= {};
  next.last_run_at = runStamp.display;

  if (result.success) {
    next.last_successful_run_at = runStamp.display;
  }

  for (const thread of [...result.reply, ...result.waiting, ...result.ops_alert]) {
    next.handled_threads[thread.thread_id] = {
      sender: thread.sender,
      subject: thread.subject,
      latest_message_date: thread.latest_message_date,
      bucket: result.reply.some((entry) => entry.thread_id === thread.thread_id)
        ? 'reply'
        : result.waiting.some((entry) => entry.thread_id === thread.thread_id)
          ? 'waiting'
          : 'ops_alert',
      draft_needed: thread.draft_needed,
      last_seen_at: runStamp.display,
    };
  }

  next.open_follow_ups = Object.fromEntries(
    result.follow_ups.map((followUp) => [
      followUp.thread_id,
      {
        sender: followUp.sender,
        subject: followUp.subject,
        status: followUp.status,
        next_action: followUp.next_action,
        last_seen_at: runStamp.display,
      },
    ]),
  );

  for (const advice of result.advice_review) {
    next.advice_history[advice.thread_id] = {
      sender: advice.sender,
      subject: advice.subject,
      recommendation: advice.recommendation,
      rationale: advice.rationale,
      suggested_stance: advice.suggested_stance,
      updated_at: runStamp.display,
    };
  }

  for (const draft of result.drafts_created) {
    next.draft_history[draft.thread_id] = {
      sender: draft.sender,
      subject: draft.subject,
      draft_id: draft.draft_id,
      updated_at: runStamp.display,
    };
  }

  for (const reply of result.replies_sent ?? []) {
    next.reply_history[reply.thread_id] = {
      sender: reply.sender,
      subject: reply.subject,
      reply_id: reply.reply_id,
      updated_at: runStamp.display,
    };
  }

  return next;
}

export function renderMarkdownBrief(result) {
  const lines = [
    `# Gmail Inbox Owner Brief`,
    '',
    `- Run: ${result.run_at ?? 'unknown'}`,
    `- Mailbox: ${result.mailbox || 'unknown'}`,
    `- Success: ${result.success ? 'yes' : 'no'}`,
    `- Coverage: ${result.coverage.scope_note}`,
    '',
    '## Summary',
    '',
    result.summary || 'No summary available.',
    '',
  ];

  appendBucket(lines, 'Needs Reply', result.reply);
  appendBucket(lines, 'Waiting', result.waiting);
  appendBucket(lines, 'Ops Alerts', result.ops_alert);
  appendAdvice(lines, result.advice_review);
  appendReplyActions(lines, result);
  appendFollowUps(lines, result.follow_ups);
  appendFailures(lines, result.failures);

  if (result.notes?.length) {
    lines.push('## Notes', '');
    for (const note of result.notes) {
      lines.push(`- ${note}`);
    }
    lines.push('');
  }

  return `${lines.join('\n').trim()}\n`;
}

function appendBucket(lines, title, items) {
  lines.push(`## ${title}`, '');

  if (!items?.length) {
    lines.push('- None', '');
    return;
  }

  for (const item of items) {
    lines.push(`- ${item.sender} — ${item.subject}`);
    lines.push(`  Why: ${item.why}`);
    lines.push(`  Next: ${item.next_action}`);
  }
  lines.push('');
}

function appendAdvice(lines, items) {
  lines.push('## Advice Review', '');

  if (!items?.length) {
    lines.push('- None', '');
    return;
  }

  for (const item of items) {
    lines.push(`- ${item.sender} — ${item.subject} — ${item.recommendation}`);
    lines.push(`  Why: ${item.rationale}`);
    lines.push(`  Stance: ${item.suggested_stance}`);
  }
  lines.push('');
}

function appendReplyActions(lines, result) {
  const repliesSent = result.replies_sent ?? [];
  const draftsCreated = result.drafts_created ?? [];
  const deliveryMode = result.delivery_mode ?? 'draft_only';

  lines.push(deliveryMode === 'auto_send' ? '## Replies Sent' : '## Drafts Created', '');

  const items = deliveryMode === 'auto_send' ? repliesSent : draftsCreated;

  if (!items.length) {
    lines.push('- None', '');
    return;
  }

  for (const item of items) {
    const identifier = deliveryMode === 'auto_send'
      ? `reply ${item.reply_id}`
      : `draft ${item.draft_id}`;
    lines.push(`- ${item.sender} — ${item.subject} — ${identifier}`);
  }
  lines.push('');
}

function appendFollowUps(lines, items) {
  lines.push('## Follow-ups Still Open', '');

  if (!items?.length) {
    lines.push('- None', '');
    return;
  }

  for (const item of items) {
    lines.push(`- ${item.sender} — ${item.subject} — ${item.status}`);
    lines.push(`  Next: ${item.next_action}`);
  }
  lines.push('');
}

function appendFailures(lines, items) {
  lines.push('## Failures', '');

  if (!items?.length) {
    lines.push('- None', '');
    return;
  }

  for (const item of items) {
    lines.push(`- ${item.stage}: ${item.message} (retryable: ${item.retryable ? 'yes' : 'no'})`);
  }
  lines.push('');
}

async function spawnWithInput(command, args, input, options) {
  const { cwd, env, timeoutMs } = options;

  return await new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let settled = false;

    const timer = setTimeout(() => {
      if (settled) {
        return;
      }

      settled = true;
      child.kill('SIGTERM');
      reject(new Error(`Process timed out after ${timeoutMs}ms: ${command}`));
    }, timeoutMs);

    child.stdout.on('data', (chunk) => {
      stdout += String(chunk);
    });

    child.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });

    child.on('error', (error) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      reject(error);
    });

    child.on('close', (code) => {
      if (settled) {
        return;
      }

      settled = true;
      clearTimeout(timer);
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
      });
    });

    child.stdin.write(input);
    child.stdin.end();
  });
}

export async function writeRunArtifacts({ runStamp, result, memory }) {
  const reportPaths = getReportPaths(runStamp);
  const persistedResult = {
    ...result,
    run_at: runStamp.display,
  };

  await writeText(reportPaths.jsonPath, `${JSON.stringify(persistedResult, null, 2)}\n`);
  await writeText(reportPaths.markdownPath, renderMarkdownBrief(persistedResult));
  await writeText(MEMORY_PATH, `${JSON.stringify(memory, null, 2)}\n`);

  return reportPaths;
}

function normalizeTriageResult(result) {
  if (!result || typeof result !== 'object') {
    return result;
  }

  result.delivery_mode ??= 'draft_only';
  result.mailbox ??= '';
  result.summary ??= '';
  result.coverage ??= {
    recent_days: 0,
    context_days: 0,
    scope_note: '',
  };
  result.reply ??= [];
  result.waiting ??= [];
  result.ops_alert ??= [];
  result.ignore ??= [];
  result.advice_review ??= [];
  result.drafts_created ??= [];
  result.replies_sent ??= [];
  result.follow_ups ??= [];
  result.failures ??= [];
  result.notes ??= [];

  if (typeof result.success !== 'boolean') {
    result.success = result.failures.length === 0;
  }

  return result;
}

export function validateTriageResult(result) {
  normalizeTriageResult(result);
  assert.equal(typeof result.success, 'boolean');
  assert.equal(typeof result.delivery_mode, 'string');
  assert.equal(Array.isArray(result.reply), true);
  assert.equal(Array.isArray(result.waiting), true);
  assert.equal(Array.isArray(result.ops_alert), true);
  assert.equal(Array.isArray(result.ignore), true);
  assert.equal(Array.isArray(result.advice_review), true);
  assert.equal(Array.isArray(result.drafts_created), true);
  assert.equal(Array.isArray(result.follow_ups), true);
  assert.equal(Array.isArray(result.failures), true);
  assert.equal(Array.isArray(result.replies_sent ?? []), true);
}

export function validateBrowserTriageResult(result) {
  validateTriageResult(result);
  result.reply_requests ??= [];
  assert.equal(Array.isArray(result.reply_requests), true);
}
