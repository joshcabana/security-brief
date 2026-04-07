#!/usr/bin/env node

import fs from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  detectRenderedAnalyticsState,
  evaluatePrivacyAnalyticsContract,
} from '../lib/analytics-config.mjs';
import { sanitizeNewsletterSource } from '../lib/newsletter-source.mjs';
import {
  getDeploymentProtectionHeaders,
  mergeRequestHeaders,
} from './verify-live.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const REQUEST_TIMEOUT_MS = 20000;

function getArgValue(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);

  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1];
}

function loadManifest() {
  return JSON.parse(fs.readFileSync(resolve(REPO_ROOT, 'content-manifest.json'), 'utf8'));
}

export function resolveVerificationBaseUrl(cliBaseUrl, envBaseUrl) {
  const candidate = cliBaseUrl || envBaseUrl;

  if (!candidate) {
    throw new Error('Missing base URL. Pass --base-url <url> or set NEXT_PUBLIC_BASE_URL.');
  }

  try {
    const parsed = new URL(candidate);

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      throw new Error('Base URL must use http or https.');
    }

    return parsed.toString().replace(/\/$/, '');
  } catch {
    throw new Error(`Invalid base URL: ${String(candidate)}`);
  }
}

export function extractNewsletterSourcesFromHtml(html) {
  const sources = [];
  const hrefPattern = /href="\/newsletter\?source=([^"&]+)"/gi;
  const dataSourcePattern = /data-newsletter-source="([^"]+)"/gi;

  for (const match of html.matchAll(hrefPattern)) {
    sources.push(decodeURIComponent(match[1]));
  }

  for (const match of html.matchAll(dataSourcePattern)) {
    sources.push(match[1]);
  }

  return sources;
}

export function assertSanitizedNewsletterSources(html, context) {
  const sources = extractNewsletterSourcesFromHtml(html);

  if (sources.length === 0) {
    throw new Error(`${context} is missing newsletter CTA source tags.`);
  }

  for (const source of sources) {
    if (sanitizeNewsletterSource(source) === null) {
      throw new Error(`${context} contains an unsanitized newsletter source tag: ${source}`);
    }
  }

  return sources;
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...options,
      headers: mergeRequestHeaders(options.headers, getDeploymentProtectionHeaders()),
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function runProductionVerification(baseUrl) {
  const manifest = loadManifest();
  const featuredArticle = manifest.articles?.[0];

  if (!featuredArticle?.slug) {
    throw new Error('content-manifest.json does not contain a featured article slug.');
  }

  const checks = [
    {
      name: 'privacy-analytics-contract',
      path: '/privacy',
      assert: async (response) => {
        const html = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        const renderedState = detectRenderedAnalyticsState(html);
        const evaluation = evaluatePrivacyAnalyticsContract({
          plausibleEnabled: renderedState.hasPlausibleScript,
          linkedInInsightEnabled: renderedState.hasLinkedInInsightScript,
          html,
        });

        if (!evaluation.ok) {
          throw new Error(evaluation.message);
        }
      },
    },
    {
      name: 'homepage-newsletter-sources',
      path: '/',
      assert: async (response) => {
        const html = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        assertSanitizedNewsletterSources(html, 'Homepage');
      },
    },
    {
      name: 'tools-newsletter-sources',
      path: '/tools',
      assert: async (response) => {
        const html = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        assertSanitizedNewsletterSources(html, 'Tools page');
      },
    },
    {
      name: 'newsletter-newsletter-sources',
      path: '/newsletter?source=tools-footer',
      assert: async (response) => {
        const html = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        const sources = assertSanitizedNewsletterSources(html, 'Newsletter page');

        if (!sources.includes('tools-footer')) {
          throw new Error('Newsletter page did not preserve the tools-footer source tag.');
        }
      },
    },
    {
      name: 'article-newsletter-sources',
      path: `/blog/${featuredArticle.slug}`,
      assert: async (response) => {
        const html = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        const sources = assertSanitizedNewsletterSources(html, 'Article page');

        if (!sources.includes(`article-${featuredArticle.slug}-cta`)) {
          throw new Error(`Article page is missing the slug-specific CTA source article-${featuredArticle.slug}-cta.`);
        }
      },
    },
  ];

  const results = [];

  for (const check of checks) {
    try {
      const response = await fetchWithTimeout(`${baseUrl}${check.path}`);
      await check.assert(response);
      results.push({
        name: check.name,
        ok: true,
        path: check.path,
        message: `Verified ${check.path}`,
      });
    } catch (error) {
      results.push({
        name: check.name,
        ok: false,
        path: check.path,
        message: error instanceof Error ? error.message : 'Unknown production verification error.',
      });
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    baseUrl,
    ok: results.every((result) => result.ok),
    results,
  };
}

export async function main() {
  const baseUrl = resolveVerificationBaseUrl(getArgValue('base-url'), process.env.NEXT_PUBLIC_BASE_URL);
  const report = await runProductionVerification(baseUrl);

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
