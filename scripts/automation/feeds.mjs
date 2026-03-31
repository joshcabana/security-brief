#!/usr/bin/env node

import { XMLParser } from 'fast-xml-parser';
import sanitizeHtml from 'sanitize-html';
import { getLocalTimeParts, shiftDateString } from './common.mjs';

export const CURATED_FEEDS = [
  { name: 'CISA Advisories', url: 'https://www.cisa.gov/cybersecurity-advisories/all.xml' },
  { name: 'CISA News', url: 'https://www.cisa.gov/news.xml' },
  { name: 'The Hacker News', url: 'https://feeds.feedburner.com/TheHackersNews' },
  { name: 'Help Net Security', url: 'https://www.helpnetsecurity.com/feed/' },
  { name: 'The Register Security', url: 'https://www.theregister.com/security/headlines.atom' },
  { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
  { name: 'Infosecurity Magazine', url: 'https://www.infosecurity-magazine.com/rss/news/' },
  { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
];

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  parseTagValue: false,
  trimValues: true,
  textNodeName: '#text',
});

const AI_PATTERNS = [
  /\bai\b/i,
  /artificial intelligence/i,
  /\bllms?\b/i,
  /large language model/i,
  /prompt injection/i,
  /jailbreak/i,
  /agentic/i,
  /chatgpt/i,
  /openai/i,
  /anthropic/i,
  /gemini/i,
  /copilot/i,
  /deepseek/i,
];

const SECURITY_PATTERNS = [
  /security/i,
  /cyber/i,
  /vulnerab/i,
  /attack/i,
  /breach/i,
  /incident/i,
  /privacy/i,
  /regulat/i,
  /advisory/i,
  /exploit/i,
  /malware/i,
  /phishing/i,
  /poisoning/i,
  /guardrail/i,
  /compliance/i,
  /risk/i,
];

const EXCLUDED_PATTERNS = [
  /\bpodcast\b/i,
  /\bwebinar\b/i,
  /\bevent\b/i,
  /\bsponsored\b/i,
  /\bjobs?\b/i,
];

const FEED_SANITIZE_OPTIONS = Object.freeze({
  allowedTags: [],
  allowedAttributes: {},
  stripComments: true,
});

function ensureArray(value) {
  if (!value) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function decodeEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function normaliseWhitespace(value) {
  return decodeEntities(String(value)).replace(/\s+/g, ' ').trim();
}

function stripMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/`{1,3}([^`]+)`{1,3}/g, '$1')
    .replace(/[*_~]+/g, ' ')
    .replace(/^>\s+/gm, '')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\|/g, ' ');
}

function stripInvisibleCharacters(value) {
  return value.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200D\u2060\uFEFF]/g, ' ');
}

function stripHiddenHtml(value) {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(
      /<[^>]*(?:aria-hidden\s*=\s*["']?true["']?|hidden\b|style\s*=\s*["'][^"']*(?:display\s*:\s*none|visibility\s*:\s*hidden)[^"']*["'])[^>]*>[\s\S]*?<\/[^>]+>/gi,
      ' ',
    );
}

function sanitizeFeedText(value) {
  const withoutCdata = String(value).replace(/<!\[CDATA\[|\]\]>/g, ' ');
  const withoutHiddenHtml = stripHiddenHtml(withoutCdata);

  // Sanitizing feed text to plain text prevents indirect prompt injection before any LLM use.
  const sanitizedHtml = sanitizeHtml(withoutHiddenHtml, FEED_SANITIZE_OPTIONS);

  return normaliseWhitespace(
    stripInvisibleCharacters(stripMarkdown(sanitizedHtml)),
  );
}

function extractText(value) {
  if (typeof value === 'string') {
    return sanitizeFeedText(value);
  }

  if (Array.isArray(value)) {
    return normaliseWhitespace(value.map((entry) => extractText(entry)).join(' '));
  }

  if (value && typeof value === 'object') {
    if (typeof value['#text'] === 'string') {
      return sanitizeFeedText(value['#text']);
    }

    return normaliseWhitespace(Object.values(value).map((entry) => extractText(entry)).join(' '));
  }

  return '';
}

function extractLink(value) {
  if (typeof value === 'string') {
    return value.trim();
  }

  if (Array.isArray(value)) {
    const preferred = value.find((entry) => entry?.['@_rel'] === 'alternate' && entry?.['@_href']);
    return extractLink(preferred ?? value[0]);
  }

  if (value && typeof value === 'object') {
    if (typeof value['@_href'] === 'string') {
      return value['@_href'];
    }

    if (typeof value.href === 'string') {
      return value.href;
    }

    if (typeof value['#text'] === 'string') {
      return value['#text'];
    }
  }

  return null;
}

function normaliseUrl(value) {
  if (!value) {
    return null;
  }

  try {
    const url = new URL(value);

    for (const key of [...url.searchParams.keys()]) {
      if (/^utm_/i.test(key) || ['ref', 'mc_cid', 'mc_eid'].includes(key)) {
        url.searchParams.delete(key);
      }
    }

    url.hash = '';
    return url.toString();
  } catch {
    return null;
  }
}

function truncateSummary(value, maxLength = 320) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 1).trimEnd()}…`;
}

function buildFeedItem(raw, source) {
  const headline = extractText(raw.title);
  const sourceUrl = normaliseUrl(extractLink(raw.link) ?? extractText(raw.id));
  const summary = truncateSummary(
    extractText(raw.description) ||
      extractText(raw.summary) ||
      extractText(raw['content:encoded']) ||
      extractText(raw.content) ||
      headline,
  );
  const publishedRaw = raw.pubDate ?? raw.published ?? raw.updated ?? raw['dc:date'];
  const publishedAt = publishedRaw ? new Date(String(publishedRaw)) : null;

  if (!headline || !sourceUrl || !publishedAt || Number.isNaN(publishedAt.getTime())) {
    return null;
  }

  return {
    headline,
    summary,
    source_name: source.name,
    source_url: sourceUrl,
    published_at: publishedAt.toISOString(),
    published_local_date: getLocalTimeParts(publishedAt).date,
  };
}

export function parseFeedDocument(xml, source) {
  const parsed = parser.parse(xml);
  const rssItems = ensureArray(parsed?.rss?.channel?.item);
  const atomItems = ensureArray(parsed?.feed?.entry);
  const rawItems = [...rssItems, ...atomItems];

  return rawItems
    .map((item) => buildFeedItem(item, source))
    .filter(Boolean);
}

function countMatches(patterns, value) {
  return patterns.reduce((count, pattern) => count + (pattern.test(value) ? 1 : 0), 0);
}

export function scoreFeedItem(item) {
  const title = item.headline.toLowerCase();
  const summary = item.summary.toLowerCase();
  const combined = `${title} ${summary}`;
  const aiTitle = countMatches(AI_PATTERNS, title);
  const aiSummary = countMatches(AI_PATTERNS, summary);
  const securityTitle = countMatches(SECURITY_PATTERNS, title);
  const securitySummary = countMatches(SECURITY_PATTERNS, summary);
  let score = (aiTitle * 5) + (aiSummary * 2) + (securityTitle * 4) + (securitySummary * 2);

  if ((aiTitle + aiSummary) > 0 && (securityTitle + securitySummary) > 0) {
    score += 6;
  }

  if (/australia|australian|oaic|eu|european union|uk|united states/i.test(combined) && /privacy|regulat/i.test(combined)) {
    score += 2;
  }

  if (/prompt injection|jailbreak|model poisoning|agentic/i.test(combined)) {
    score += 2;
  }

  return {
    score,
    aiMatches: aiTitle + aiSummary,
    securityMatches: securityTitle + securitySummary,
  };
}

export function selectRelevantFeedItems(items, { limit = 14 } = {}) {
  const unique = [];
  const seenUrls = new Set();
  const seenHeadlines = new Set();

  for (const item of items) {
    const headlineKey = item.headline.toLowerCase();
    if (seenUrls.has(item.source_url) || seenHeadlines.has(headlineKey)) {
      continue;
    }

    seenUrls.add(item.source_url);
    seenHeadlines.add(headlineKey);
    unique.push(item);
  }

  const scored = unique
    .filter((item) => !EXCLUDED_PATTERNS.some((pattern) => pattern.test(item.headline)))
    .map((item) => ({
      ...item,
      ...scoreFeedItem(item),
    }))
    .filter((item) => item.score >= 4)
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      return right.published_at.localeCompare(left.published_at);
    });

  const strongMatches = scored.filter((item) => item.aiMatches > 0 && item.securityMatches > 0);
  const fallback = scored.filter((item) => !(item.aiMatches > 0 && item.securityMatches > 0));
  return [...strongMatches, ...fallback].slice(0, limit);
}

export async function collectCandidateFeedItems({
  effectiveDate,
  fetchImpl = fetch,
  limit = 14,
}) {
  const windowStart = shiftDateString(effectiveDate, -6);
  const settled = await Promise.allSettled(
    CURATED_FEEDS.map(async (source) => {
      const response = await fetchImpl(source.url, {
        headers: {
          'User-Agent': 'ai-security-brief-automation',
        },
      });

      if (!response.ok) {
        throw new Error(`${source.name} returned ${response.status}`);
      }

      const xml = await response.text();
      return parseFeedDocument(xml, source);
    }),
  );

  const notes = [];
  const items = [];

  for (let index = 0; index < settled.length; index += 1) {
    const result = settled[index];
    if (result.status === 'fulfilled') {
      items.push(
        ...result.value.filter(
          (item) => item.published_local_date >= windowStart && item.published_local_date <= effectiveDate,
        ),
      );
      continue;
    }

    notes.push(`Feed unavailable: ${CURATED_FEEDS[index].name} (${result.reason instanceof Error ? result.reason.message : String(result.reason)})`);
  }

  return {
    items: selectRelevantFeedItems(items, { limit }),
    notes,
    windowStart,
  };
}

export function buildHarvestCandidateDigest(items) {
  return items
    .map(
      (item, index) => [
        `${index + 1}. ${item.headline}`,
        `Source: ${item.source_name}`,
        `Published: ${item.published_local_date}`,
        `URL: ${item.source_url}`,
        `Summary: ${item.summary}`,
      ].join('\n'),
    )
    .join('\n\n');
}
