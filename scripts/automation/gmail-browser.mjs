#!/usr/bin/env node

import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';
import { createRequire } from 'node:module';

export const DEFAULT_BROWSER_RUNTIME_DIR = path.join(homedir(), '.codex', 'automations', 'gmail-triage-runtime');
export const DEFAULT_CDP_URL = 'http://127.0.0.1:9222';
export const DEFAULT_CHROME_BINARY = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
export const DEFAULT_CHROME_PROFILE_DIR = path.join(homedir(), '.gemini', 'antigravity-browser-profile');
export const DEFAULT_SEARCH_RESULT_LIMIT = 20;
export const DEFAULT_THREAD_LIMIT = 12;
export const GMAIL_INBOX_URL = 'https://mail.google.com/mail/u/1/#inbox';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function compactWhitespace(value) {
  return String(value ?? '').replace(/\s+/g, ' ').trim();
}

function phrase(value) {
  const normalized = compactWhitespace(value).replace(/"/g, '');
  if (!normalized) {
    return '';
  }

  return /\s/.test(normalized) ? `"${normalized}"` : normalized;
}

function orClause(parts) {
  const filtered = [...new Set(parts.map((part) => compactWhitespace(part)).filter(Boolean))];

  if (!filtered.length) {
    return '';
  }

  if (filtered.length === 1) {
    return filtered[0];
  }

  return `{${filtered.join(' ')}}`;
}

export function buildBrowserSearchQueries(policy, memory) {
  const recentDays = policy.search_windows?.recent_days ?? 30;
  const contextDays = policy.search_windows?.context_days ?? 90;
  const projectTerms = policy.matching?.domain_terms ?? policy.project_identifiers ?? [];
  const commercialTerms = policy.matching?.commercial_terms ?? [];
  const prioritySenders = policy.matching?.priority_senders ?? policy.priority_senders ?? [];
  const opsSenders = policy.matching?.ops_senders ?? policy.ops_senders ?? [];
  const projectClause = orClause(projectTerms.map(phrase));
  const commercialClause = orClause(commercialTerms.map(phrase));
  const priorityClause = orClause(prioritySenders.map((sender) => `from:${sender}`));
  const opsClause = orClause(opsSenders.map((sender) => `from:${sender}`));
  const queries = [];

  if (projectClause) {
    queries.push({
      name: 'recent_project_terms',
      query: `in:inbox newer_than:${recentDays}d ${projectClause}`,
    });
  }

  if (priorityClause) {
    queries.push({
      name: 'recent_priority_contacts',
      query: `in:inbox newer_than:${recentDays}d ${priorityClause}`,
    });
    queries.push({
      name: 'older_priority_contacts',
      query: `in:inbox newer_than:${contextDays}d older_than:7d ${priorityClause}`,
    });
  }

  if (commercialClause && priorityClause) {
    queries.push({
      name: 'recent_priority_affiliate_terms',
      query: `in:inbox newer_than:${recentDays}d ${priorityClause} ${commercialClause}`,
    });
  }

  if (commercialClause && projectClause) {
    queries.push({
      name: 'recent_project_affiliate_terms',
      query: `in:inbox newer_than:${recentDays}d ${projectClause} ${commercialClause}`,
    });
  }

  if (opsClause) {
    queries.push({
      name: 'recent_ops_alerts',
      query: `in:inbox newer_than:${recentDays}d ${opsClause}`,
    });
  }

  for (const [threadId, followUp] of Object.entries(memory?.open_follow_ups ?? {}).slice(0, 5)) {
    const subject = phrase(followUp.subject);

    if (!subject) {
      continue;
    }

    queries.push({
      name: `memory_follow_up_${threadId}`,
      query: `in:anywhere subject:${subject}`,
    });
  }

  return queries;
}

function trimThreadMessages(messages, policy) {
  const maxMessages = policy.browser_fallback?.max_messages_per_thread ?? 4;
  const maxMessageChars = policy.browser_fallback?.max_message_chars ?? 1200;
  const maxThreadChars = policy.browser_fallback?.max_thread_chars ?? 3600;
  const trimmed = [];
  let consumed = 0;

  for (const message of messages.slice(0, maxMessages)) {
    const remaining = maxThreadChars - consumed;

    if (remaining <= 0) {
      break;
    }

    const maxBodyChars = Math.min(maxMessageChars, remaining);
    const body = compactWhitespace(message.body).slice(0, maxBodyChars);
    consumed += body.length;
    trimmed.push({
      sender_name: message.sender_name,
      sender_email: message.sender_email,
      timestamp: message.timestamp,
      body,
    });
  }

  return trimmed;
}

export function resolveBrowserRuntimeDir(policy = {}) {
  return process.env.GMAIL_TRIAGE_BROWSER_RUNTIME_DIR?.trim()
    || policy.browser_fallback?.runtime_dir
    || DEFAULT_BROWSER_RUNTIME_DIR;
}

export function resolveBrowserCdpUrl(policy = {}) {
  return process.env.GMAIL_TRIAGE_CDP_URL?.trim()
    || policy.browser_fallback?.cdp_url
    || DEFAULT_CDP_URL;
}

export function resolveChromeBinary(policy = {}) {
  return process.env.GMAIL_TRIAGE_CHROME_BIN?.trim()
    || policy.browser_fallback?.chrome_binary
    || DEFAULT_CHROME_BINARY;
}

export function resolveChromeProfileDir(policy = {}) {
  return process.env.GMAIL_TRIAGE_CHROME_PROFILE_DIR?.trim()
    || policy.browser_fallback?.chrome_profile_dir
    || DEFAULT_CHROME_PROFILE_DIR;
}

export function loadBrowserRuntime(policy = {}) {
  const runtimeDir = resolveBrowserRuntimeDir(policy);
  const packageJsonPath = path.join(runtimeDir, 'package.json');

  if (!existsSync(packageJsonPath)) {
    throw new Error(`Browser runtime package.json was not found at ${packageJsonPath}.`);
  }

  const requireFromRuntime = createRequire(packageJsonPath);

  try {
    return requireFromRuntime('playwright-core');
  } catch (error) {
    throw new Error(`Browser runtime could not load playwright-core from ${runtimeDir}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function probeChromeDebugger(cdpUrl = DEFAULT_CDP_URL, fetchImpl = globalThis.fetch) {
  if (typeof fetchImpl !== 'function') {
    return null;
  }

  try {
    const response = await fetchImpl(`${cdpUrl}/json/version`);

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

export async function ensureChromeDebugger(policy = {}, {
  fetchImpl = globalThis.fetch,
  timeoutMs = 20000,
  pollMs = 500,
} = {}) {
  const cdpUrl = resolveBrowserCdpUrl(policy);
  const existing = await probeChromeDebugger(cdpUrl, fetchImpl);

  if (existing) {
    return {
      cdpUrl,
      launched: false,
      browserVersion: existing.Browser ?? 'unknown',
    };
  }

  const chromeBinary = resolveChromeBinary(policy);
  const chromeProfileDir = resolveChromeProfileDir(policy);

  if (!existsSync(chromeBinary)) {
    throw new Error(`Chrome binary was not found at ${chromeBinary}.`);
  }

  if (!existsSync(chromeProfileDir)) {
    throw new Error(`Chrome profile directory was not found at ${chromeProfileDir}.`);
  }

  const launchArgs = [
    '--remote-debugging-port=9222',
    `--user-data-dir=${chromeProfileDir}`,
    '--disable-fre',
    '--no-default-browser-check',
    '--no-first-run',
    '--auto-accept-browser-signin-for-tests',
    '--ash-no-nudges',
    '--disable-features=OfferMigrationToDiceUsers,OptGuideOnDeviceModel',
    GMAIL_INBOX_URL,
  ];

  const child = spawn(chromeBinary, launchArgs, {
    detached: true,
    stdio: 'ignore',
  });

  child.unref();

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const version = await probeChromeDebugger(cdpUrl, fetchImpl);

    if (version) {
      return {
        cdpUrl,
        launched: true,
        browserVersion: version.Browser ?? 'unknown',
      };
    }

    await sleep(pollMs);
  }

  throw new Error(`Chrome debugger at ${cdpUrl} did not become available within ${timeoutMs}ms.`);
}

async function waitForRows(page) {
  await page.waitForFunction(() => {
    const rowCount = document.querySelectorAll('tr.zA').length;
    const bodyText = document.body?.innerText ?? '';
    return rowCount > 0 || bodyText.includes('No messages matched your search');
  }, null, { timeout: 20000 });
  await page.waitForTimeout(1200);
}

function candidateKey(candidate) {
  return candidate.thread_id
    || candidate.legacy_thread_id
    || `${candidate.sender}|${candidate.subject}`;
}

async function extractMailboxIdentity(page) {
  const details = await page.evaluate(() => {
    const title = document.title;
    const titleMatch = title.match(/- ([^@\\s]+@[^\\s]+) - Gmail$/);
    const accountNode = document.querySelector('a[aria-label*="@"][href*="SignOutOptions"], a[aria-label*="Google Account"]');
    const label = accountNode?.getAttribute('aria-label') ?? '';
    const labelMatch = label.match(/([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})/i);

    return {
      title,
      email: titleMatch?.[1] ?? labelMatch?.[1] ?? null,
    };
  });

  return details;
}

async function getOrCreateGmailPage(browser, mailboxEmail) {
  const pages = browser.contexts().flatMap((context) => context.pages());
  let page = pages.find((entry) => entry.url().includes('mail.google.com'));

  if (!page) {
    const context = browser.contexts()[0];

    if (!context) {
      throw new Error('Chrome debugger is available but no browser context was exposed over CDP.');
    }

    page = await context.newPage();
    await page.goto(GMAIL_INBOX_URL, { waitUntil: 'domcontentloaded' });
  }

  page.setDefaultTimeout(20000);
  await page.goto(GMAIL_INBOX_URL, { waitUntil: 'domcontentloaded' });
  await waitForRows(page);

  const identity = await extractMailboxIdentity(page);

  if (!identity.email) {
    throw new Error('Gmail loaded in Chrome CDP, but the active mailbox email could not be determined.');
  }

  if (mailboxEmail && identity.email !== mailboxEmail) {
    throw new Error(`Chrome CDP is authenticated to ${identity.email}, not ${mailboxEmail}.`);
  }

  return {
    page,
    identity,
  };
}

async function searchRows(page, query, limit) {
  await page.goto(`https://mail.google.com/mail/u/1/#search/${encodeURIComponent(query)}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForRows(page);

  return await page.evaluate((maxRows) => {
    const rows = [...document.querySelectorAll('tr.zA')];

    return rows.slice(0, maxRows).map((row) => {
      const subjectNode = row.querySelector('.bog');
      const threadNode = row.querySelector('.bqe');
      const senderNode = row.querySelector('.yP, .zF, .yW .bA4 span[email]');
      const dateNode = row.querySelector('td.xW span[title], td.xW span');
      const starNode = row.querySelector('.apU .T-KT');

      return {
        row_id: row.id || null,
        thread_id: threadNode?.getAttribute('data-thread-id') || null,
        legacy_thread_id: threadNode?.getAttribute('data-legacy-thread-id') || null,
        legacy_last_message_id: threadNode?.getAttribute('data-legacy-last-message-id') || null,
        subject: subjectNode?.textContent?.trim() || threadNode?.textContent?.trim() || null,
        sender: senderNode?.textContent?.trim() || null,
        sender_email: senderNode?.getAttribute('email') || null,
        snippet: row.querySelector('.y2')?.textContent?.trim() || null,
        date_label: dateNode?.getAttribute('title') || dateNode?.textContent?.trim() || null,
        unread: row.classList.contains('zE'),
        starred: /starred/i.test(starNode?.getAttribute('aria-label') || ''),
        row_text: row.innerText.trim().slice(0, 800),
      };
    });
  }, limit);
}

async function openThreadFromCandidate(page, candidate) {
  const clicked = await page.evaluate((match) => {
    const rows = [...document.querySelectorAll('tr.zA')];

    const row = rows.find((entry) => {
      const threadNode = entry.querySelector('.bqe');
      const threadId = threadNode?.getAttribute('data-thread-id');
      const legacyThreadId = threadNode?.getAttribute('data-legacy-thread-id');
      const subject = threadNode?.textContent?.trim() || entry.querySelector('.bog')?.textContent?.trim() || '';

      return (match.thread_id && threadId === match.thread_id)
        || (match.legacy_thread_id && legacyThreadId === match.legacy_thread_id)
        || (match.subject && subject === match.subject);
    });

    if (!row) {
      return false;
    }

    row.click();
    return true;
  }, {
    thread_id: candidate.thread_id,
    legacy_thread_id: candidate.legacy_thread_id,
    subject: candidate.subject,
  });

  if (!clicked) {
    throw new Error(`Thread row could not be opened for "${candidate.subject}".`);
  }

  await page.waitForFunction(() => Boolean(document.querySelector('h2.hP')), null, { timeout: 20000 });
  await page.waitForTimeout(1200);
}

async function readThread(page, candidate) {
  await page.goto(`https://mail.google.com/mail/u/1/#search/${encodeURIComponent(candidate.search_query)}`, {
    waitUntil: 'domcontentloaded',
  });
  await waitForRows(page);
  await openThreadFromCandidate(page, candidate);

  return await page.evaluate((source) => {
    const subject = document.querySelector('h2.hP')?.textContent?.trim() || source.subject || null;
    const messageBodies = [...document.querySelectorAll('div.adn.ads')];

    return {
      source_query_name: source.query_name,
      source_query: source.search_query,
      thread_id: source.thread_id || source.legacy_thread_id || source.subject,
      legacy_thread_id: source.legacy_thread_id,
      thread_url: location.href,
      subject,
      row_date_label: source.date_label || null,
      row_sender: source.sender || null,
      row_sender_email: source.sender_email || null,
      messages: messageBodies.map((bodyNode) => {
        const root = bodyNode.closest('div.hx') || bodyNode.parentElement;
        const senderNode = root?.querySelector('.gD') || root?.querySelector('span[email]');
        const timestampNode = root?.querySelector('span.g3');

        return {
          sender_name: senderNode?.getAttribute('name') || senderNode?.textContent?.trim() || null,
          sender_email: senderNode?.getAttribute('email') || null,
          timestamp: timestampNode?.getAttribute('title') || timestampNode?.textContent?.trim() || null,
          body: (bodyNode.querySelector('.ii')?.innerText || bodyNode.innerText || '').trim().slice(0, 8000),
        };
      }),
    };
  }, candidate);
}

export async function collectBrowserMailboxSnapshot(policy, memory, {
  searchResultLimit = policy.browser_fallback?.search_result_limit ?? DEFAULT_SEARCH_RESULT_LIMIT,
  threadLimit = policy.browser_fallback?.thread_limit ?? DEFAULT_THREAD_LIMIT,
} = {}) {
  const { chromium } = loadBrowserRuntime(policy);
  const debuggerState = await ensureChromeDebugger(policy);
  const browser = await chromium.connectOverCDP(debuggerState.cdpUrl);

  try {
    const { page, identity } = await getOrCreateGmailPage(browser, policy.mailbox_email);
    const queries = buildBrowserSearchQueries(policy, memory);
    const candidateMap = new Map();
    const searchRuns = [];

    for (const query of queries) {
      const rows = await searchRows(page, query.query, searchResultLimit);
      searchRuns.push({
        name: query.name,
        query: query.query,
        row_count: rows.length,
      });

      for (const row of rows) {
        const candidate = {
          ...row,
          query_name: query.name,
          search_query: query.query,
        };
        const key = candidateKey(candidate);

        if (!candidate.subject || candidateMap.has(key)) {
          continue;
        }

        candidateMap.set(key, candidate);
      }
    }

    const selectedCandidates = [...candidateMap.values()].slice(0, threadLimit);
    const threads = [];

    for (const candidate of selectedCandidates) {
      const thread = await readThread(page, candidate);
      threads.push({
        ...thread,
        messages: trimThreadMessages(thread.messages, policy),
      });
    }

    await page.goto(GMAIL_INBOX_URL, { waitUntil: 'domcontentloaded' });
    await waitForRows(page);

    return {
      transport: 'browser_cdp',
      mailbox_email: identity.email,
      title: identity.title,
      cdp_url: debuggerState.cdpUrl,
      launched_browser: debuggerState.launched,
      browser_version: debuggerState.browserVersion,
      search_runs: searchRuns,
      candidates: selectedCandidates,
      threads,
    };
  } finally {
    await browser.close();
  }
}

async function openThreadUrl(page, threadUrl) {
  await page.goto(threadUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => Boolean(document.querySelector('h2.hP')), null, { timeout: 20000 });
  await page.waitForTimeout(1200);
}

async function ensureReplyEditor(page, replyAll) {
  const existingEditor = await page.locator('[aria-label="Message Body"]').count();

  if (existingEditor > 0) {
    return;
  }

  const clicked = await page.evaluate((useReplyAll) => {
    const buttons = [...document.querySelectorAll('span[role="button"], div[role="button"], button')];
    const matcher = useReplyAll ? /reply all/i : /(^|\\b)reply(?! all)/i;
    const target = buttons.find((entry) => {
      const text = (entry.textContent || '').trim();
      const aria = entry.getAttribute('aria-label') || '';
      return matcher.test(text) || matcher.test(aria);
    });

    if (!target) {
      return false;
    }

    target.click();
    return true;
  }, replyAll);

  if (!clicked) {
    throw new Error(`Reply${replyAll ? '-all' : ''} button was not available in Gmail.`);
  }

  await page.waitForFunction(() => Boolean(document.querySelector('[aria-label="Message Body"]')), null, {
    timeout: 15000,
  });
  await page.waitForTimeout(800);
}

async function fillDraftBody(page, body) {
  const editor = page.locator('[aria-label="Message Body"]').first();
  await editor.click();
  await page.keyboard.press(process.platform === 'darwin' ? 'Meta+A' : 'Control+A');
  await page.keyboard.type(body, { delay: 5 });
  await page.waitForTimeout(2500);
}

async function clickSend(page) {
  const clicked = await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('div[role="button"], button')];
    const target = buttons.find((entry) => {
      const aria = entry.getAttribute('aria-label') || '';
      const text = (entry.textContent || '').trim();
      return /^send\b/i.test(aria) || /^send$/i.test(text);
    });

    if (!target) {
      return false;
    }

    target.click();
    return true;
  });

  if (!clicked) {
    throw new Error('Send button was not available in Gmail.');
  }

  await page.waitForTimeout(2500);
}

export async function createBrowserReplies(policy, snapshot, replyRequests) {
  const { chromium } = loadBrowserRuntime(policy);
  const debuggerState = await ensureChromeDebugger(policy);
  const browser = await chromium.connectOverCDP(debuggerState.cdpUrl);
  const created = [];
  const sent = [];
  const failures = [];
  const autoSend = policy.reply_policy?.mode === 'auto_send';

  try {
    const { page } = await getOrCreateGmailPage(browser, policy.mailbox_email);
    const threadMap = new Map(snapshot.threads.map((thread) => [thread.thread_id, thread]));

    for (const request of replyRequests) {
      const thread = threadMap.get(request.thread_id);

      if (!thread?.thread_url) {
        failures.push({
          stage: 'draft',
          message: `Draft request could not be matched to a browser thread URL for "${request.subject}".`,
          retryable: false,
        });
        continue;
      }

      try {
        await openThreadUrl(page, thread.thread_url);
        await ensureReplyEditor(page, request.reply_all === true);
        await fillDraftBody(page, request.body);
        if (autoSend) {
          await clickSend(page);
          sent.push({
            thread_id: request.thread_id,
            sender: request.sender,
            subject: request.subject,
            reply_id: `browser-send:${request.thread_id}`,
          });
        } else {
          created.push({
            thread_id: request.thread_id,
            sender: request.sender,
            subject: request.subject,
            draft_id: `browser-draft:${request.thread_id}`,
          });
        }
      } catch (error) {
        failures.push({
          stage: autoSend ? 'send' : 'draft',
          message: `${autoSend ? 'Reply send' : 'Draft creation'} failed for "${request.subject}": ${error instanceof Error ? error.message : String(error)}`,
          retryable: false,
        });
      }
    }

    await page.goto(GMAIL_INBOX_URL, { waitUntil: 'domcontentloaded' });
    await waitForRows(page);
  } finally {
    await browser.close();
  }

  return { created, sent, failures };
}
