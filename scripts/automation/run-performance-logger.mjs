#!/usr/bin/env node

import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { REPO_ROOT, fileExists, readText, toPercent, writeText } from './common.mjs';
import { upsertPerformanceLog } from './renderers.mjs';
import { finishAutomationRun, prepareAutomationRun, requireEnvVars } from './workflow.mjs';

async function beehiivRequest(endpoint, { allowServerError = false } = {}) {
  const apiKey = process.env.BEEHIIV_API_KEY?.trim();
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID?.trim();

  if (!apiKey || !publicationId) {
    throw new Error('BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID are required for performance logging.');
  }

  const response = await fetch(`https://api.beehiiv.com/v2/publications/${publicationId}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const body = await response.text();
    if (allowServerError && response.status >= 500) {
      return null;
    }
    throw new Error(`Beehiiv API request failed with ${response.status}: ${body}`);
  }

  return response.json();
}

export function countActiveSubscriptions(items) {
  if (!Array.isArray(items)) {
    return 0;
  }

  return items.filter((item) => {
    const status = String(item?.status ?? '').toLowerCase();
    return ['active', 'confirmed', 'validating'].includes(status);
  }).length;
}

async function fetchActiveSubscriberCount() {
  let cursor = null;
  let total = 0;

  while (true) {
    const params = new URLSearchParams({ limit: '100' });
    if (cursor) {
      params.set('cursor', cursor);
    }

    const payload = await beehiivRequest(`/subscriptions?${params.toString()}`);
    total += countActiveSubscriptions(payload?.data);

    const hasMore = payload?.pagination?.has_more ?? payload?.has_more ?? false;
    const nextCursor = payload?.pagination?.next_cursor ?? payload?.next_cursor ?? null;
    if (!hasMore || !nextCursor) {
      return total;
    }

    cursor = nextCursor;
  }
}

function extractTopLink(payload) {
  if (!Array.isArray(payload?.data?.clicks) || payload.data.clicks.length === 0) {
    return '—';
  }

  const sorted = [...payload.data.clicks].sort((left, right) => (right.total_clicks ?? 0) - (left.total_clicks ?? 0));
  return sorted[0]?.url ?? sorted[0]?.base_url ?? '—';
}

function extractRate(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  return toPercent(value);
}

export function derivePerformanceSnapshot({ aggregateStats, hasPosts }) {
  if (!aggregateStats?.data) {
    return {
      openRate: '—',
      clickRate: '—',
      topLink: '—',
      alerts: hasPosts
        ? 'Warning: Beehiiv post stats are unavailable — review API health before relying on metrics.'
        : 'Awaiting first published Beehiiv issue.',
    };
  }

  const openRateRaw = aggregateStats?.data?.email?.open_rate ?? null;
  const clickRateRaw = aggregateStats?.data?.email?.click_rate ?? null;
  const openRate = extractRate(openRateRaw);
  const clickRate = extractRate(clickRateRaw);
  const topLink = extractTopLink(aggregateStats);
  const numericOpenRate =
    typeof openRateRaw === 'number'
      ? (openRateRaw <= 1 ? openRateRaw * 100 : openRateRaw)
      : null;

  return {
    openRate,
    clickRate,
    topLink,
    alerts:
      typeof numericOpenRate === 'number' && numericOpenRate < 35
        ? 'Warning: open rate below 35% — refresh subject lines and intro hooks.'
        : 'OK',
  };
}

async function main() {
  requireEnvVars(['BEEHIIV_API_KEY', 'BEEHIIV_PUBLICATION_ID']);

  const context = await prepareAutomationRun({
    kind: 'performance',
    schedule: { weekday: 'sunday', hour: 20, graceHours: 1 },
  });

  if (context.skipped) {
    return;
  }

  const subscribers = await fetchActiveSubscriberCount();
  const latestPosts = await beehiivRequest('/posts?limit=1', { allowServerError: true });
  const hasPosts = Array.isArray(latestPosts?.data) && latestPosts.data.length > 0;
  const aggregateStats = await beehiivRequest('/posts/aggregate_stats', { allowServerError: true });
  const { openRate, clickRate, topLink, alerts } = derivePerformanceSnapshot({
    aggregateStats,
    hasPosts,
  });

  const performanceLogPath = path.join(REPO_ROOT, 'logs', 'performance-log.md');
  const existing = (await fileExists(performanceLogPath))
    ? await readText(performanceLogPath)
    : '# AI Security Brief — Performance Log\n\n| Date | Subscribers | Open Rate | Click Rate | Top Link | Alerts |\n|------|------------|-----------|------------|----------|--------|\n';

  const next = upsertPerformanceLog(existing, {
    date: context.effectiveDate,
    subscribers,
    openRate,
    clickRate,
    topLink,
    alerts,
  });

  if (next === existing) {
    await finishAutomationRun({
      context,
      commitMessage: `automation: refresh performance log ${context.effectiveDate}`,
      model: null,
      outputs: ['Performance log already reflects the current week metrics.'],
      notes: ['No-op run. Weekly metrics row is unchanged.'],
    });
    return;
  }

  await writeText(performanceLogPath, next);

  await finishAutomationRun({
    context,
    commitMessage: `automation: update performance log ${context.effectiveDate}`,
    model: null,
    outputs: [
      `Performance log updated: \`logs/performance-log.md\``,
      `Subscribers: ${subscribers}`,
      `Open rate: ${openRate}`,
      `Click rate: ${clickRate}`,
      `Top link: ${topLink}`,
    ],
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
