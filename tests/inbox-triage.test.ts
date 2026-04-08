import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildDefaultMemory,
  buildDefaultPolicy,
  buildBrowserTriagePrompt,
  buildFailureResult,
  buildProfilePrompt,
  buildTriagePrompt,
  getReportPaths,
  getRunStamp,
  mergeMemory,
  renderMarkdownBrief,
} from '../scripts/automation/inbox-triage.mjs';
import {
  buildBrowserSearchQueries,
  DEFAULT_BROWSER_RUNTIME_DIR,
  DEFAULT_CHROME_PROFILE_DIR,
} from '../scripts/automation/gmail-browser.mjs';

test('default inbox triage policy locks the mailbox, connector, and reply-policy guardrails', () => {
  const policy = buildDefaultPolicy();

  assert.equal(policy.mailbox_email, 'cabana.collections2025@gmail.com');
  assert.equal(policy.connector_id, 'connector_2128aebfecb84f64a069897515042a44');
  assert.equal(policy.reply_policy.mode, 'auto_send');
  assert.equal(policy.reply_policy.read_full_thread_context, true);
  assert.equal(policy.reply_policy.avoid_duplicate_replies, true);
  assert.equal(policy.search_windows.recent_days, 30);
  assert.equal(policy.search_windows.context_days, 90);
  assert.equal(policy.browser_fallback.enabled, true);
  assert.equal(policy.browser_fallback.runtime_dir, DEFAULT_BROWSER_RUNTIME_DIR);
  assert.equal(policy.browser_fallback.chrome_profile_dir, DEFAULT_CHROME_PROFILE_DIR);
});

test('profile prompt explicitly uses the Gmail app connector and forbids mailbox mutations', () => {
  const prompt = buildProfilePrompt({
    connectorId: 'connector_123',
    mailboxEmail: 'cabana.collections2025@gmail.com',
  });

  assert.match(prompt, /\[\$gmail\]\(app:\/\/connector_123\)/);
  assert.match(prompt, /Do not send, draft, archive, label, or modify anything\./);
  assert.match(prompt, /Do not try to use MCP resources for Gmail\./);
});

test('triage prompt embeds memory and honors dry-run draft suppression', () => {
  const prompt = buildTriagePrompt({
    connectorId: 'connector_123',
    policy: buildDefaultPolicy(),
    memory: buildDefaultMemory(),
    context: {
      status_excerpt: 'Pinned baseline: origin/main',
      readme_excerpt: 'pnpm automation:inbox-triage',
    },
    dryRun: true,
  });

  assert.match(prompt, /Dry run: do not draft or send Gmail replies\./);
  assert.match(prompt, /Policy JSON:/);
  assert.match(prompt, /Memory JSON:/);
  assert.match(prompt, /Project context:/);
  assert.match(prompt, /take, consider, or push_back/);
});

test('browser triage prompt uses supplied mailbox snapshot data and returns explicit draft requests', () => {
  const prompt = buildBrowserTriagePrompt({
    policy: buildDefaultPolicy(),
    memory: buildDefaultMemory(),
    context: {
      status_excerpt: 'Pinned baseline: origin/main',
      readme_excerpt: 'pnpm automation:inbox-triage',
    },
    browserSnapshot: {
      transport: 'browser_cdp',
      mailbox_email: 'cabana.collections2025@gmail.com',
      cdp_url: 'http://127.0.0.1:9222',
      threads: [
        {
          thread_id: '#thread-f:123',
          subject: 'Surfshark follow-up',
          thread_url: 'https://mail.google.com/mail/u/1/#inbox/FMfcgz',
          messages: [
            {
              sender_name: 'Marija',
              sender_email: 'marija@surfshark.com',
              timestamp: '8 Apr 2026, 07:00',
              body: 'Can you add our visuals to the landing page?',
            },
          ],
        },
      ],
    },
    dryRun: false,
  });

  assert.match(prompt, /Browser mailbox snapshot JSON:/);
  assert.match(prompt, /Prepare reply_requests for reply-worthy threads/);
  assert.match(prompt, /Every supplied thread already includes full-thread context/);
});

test('browser search queries include recent project, priority, ops, and memory follow-up scans', () => {
  const basePolicy = buildDefaultPolicy();
  const policy = {
    ...basePolicy,
    matching: {
      ...basePolicy.matching,
      ops_senders: ['alerts@example.com'],
    },
  };

  const queries = buildBrowserSearchQueries(policy, {
    ...buildDefaultMemory(),
    open_follow_ups: {
      'thread-1': {
        sender: 'Marija',
        subject: 'Surfshark follow-up',
        status: 'awaiting-review',
        next_action: 'Reply with placement update.',
      },
    },
  });

  const names = queries.map((query) => query.name);

  assert.match(names.join(','), /recent_project_terms/);
  assert.match(names.join(','), /recent_priority_contacts/);
  assert.match(names.join(','), /recent_ops_alerts/);
  assert.match(names.join(','), /memory_follow_up_thread-1/);
});

test('failure result renders as a visible failed operator brief', () => {
  const runStamp = getRunStamp(new Date('2026-04-08T00:00:00Z'));
  const result = buildFailureResult({
    runStamp,
    mailbox: 'cabana.collections2025@gmail.com',
    failure: {
      stage: 'preflight',
      message: 'Codex CLI could not refresh connector authentication.',
      retryable: false,
    },
    notes: ['No mailbox scan was performed.'],
  });

  const markdown = renderMarkdownBrief(result);

  assert.equal(result.success, false);
  assert.match(markdown, /## Failures/);
  assert.match(markdown, /preflight: Codex CLI could not refresh connector authentication\./);
  assert.match(markdown, /No mailbox scan was performed\./);
});

test('memory merge tracks handled threads, drafts, follow-ups, and advice history', () => {
  const runStamp = getRunStamp(new Date('2026-04-08T00:00:00Z'));
  const memory = buildDefaultMemory();
  const result = {
    success: true,
    mailbox: 'cabana.collections2025@gmail.com',
    coverage: {
      recent_days: 30,
      context_days: 90,
      scope_note: 'Scanned recent project mail plus older unresolved human threads.',
    },
    summary: 'One partner thread needs a reply.',
    reply: [
      {
        thread_id: 'thread-1',
        sender: 'Shoaib Usman',
        subject: 'PureVPN follow-up',
        latest_message_date: '2026-04-08T08:00:00Z',
        why: 'Direct question waiting on us.',
        next_action: 'Review and send the prepared draft.',
        draft_needed: true,
      },
    ],
    waiting: [],
    ops_alert: [],
    ignore: [],
    advice_review: [
      {
        thread_id: 'thread-1',
        sender: 'Shoaib Usman',
        subject: 'PureVPN follow-up',
        recommendation: 'consider',
        rationale: 'Placement advice may help conversion but needs validation.',
        suggested_stance: 'Acknowledge and test after more traffic data.',
      },
    ],
    drafts_created: [
      {
        thread_id: 'thread-1',
        sender: 'Shoaib Usman',
        subject: 'PureVPN follow-up',
        draft_id: 'draft-1',
      },
    ],
    follow_ups: [
      {
        thread_id: 'thread-1',
        sender: 'Shoaib Usman',
        subject: 'PureVPN follow-up',
        status: 'awaiting-review',
        next_action: 'Approve or edit the draft.',
      },
    ],
    failures: [],
    notes: [],
  };

  const merged = mergeMemory(memory, result, runStamp);

  assert.equal(merged.last_run_at, runStamp.display);
  assert.equal(merged.last_successful_run_at, runStamp.display);
  assert.equal(merged.handled_threads['thread-1'].bucket, 'reply');
  assert.equal(merged.advice_history['thread-1'].recommendation, 'consider');
  assert.equal(merged.draft_history['thread-1'].draft_id, 'draft-1');
  assert.equal(merged.open_follow_ups['thread-1'].status, 'awaiting-review');
});

test('report paths use the dated timestamp under the gmail-triage reports directory', () => {
  const runStamp = getRunStamp(new Date('2026-04-08T00:00:00Z'));
  const reportPaths = getReportPaths(runStamp);

  assert.match(reportPaths.jsonPath, /gmail-triage\/reports\/2026-04-08T10-00-00\.json$/);
  assert.match(reportPaths.markdownPath, /gmail-triage\/reports\/2026-04-08T10-00-00\.md$/);
});
