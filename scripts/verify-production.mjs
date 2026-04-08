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
const DEFAULT_ASSESSMENT_LINKEDIN_URL = 'https://www.linkedin.com/in/josh-cabana-351631393/';
const ASSESSMENT_CONTACT_EMAIL = 'hello@aisecuritybrief.com';
const ASSESSMENT_CONTACT_HREF = `mailto:${ASSESSMENT_CONTACT_EMAIL}?subject=AI%20Agent%20Security%20Readiness%20Review`;

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

function parseEnvFile(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const separatorIndex = line.indexOf('=');

      if (separatorIndex === -1) {
        return null;
      }

      const key = line.slice(0, separatorIndex).trim();
      let value = line.slice(separatorIndex + 1).trim();

      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      return key ? { key, value } : null;
    })
    .filter(Boolean);
}

function loadEnvLocal() {
  const envLocalPath = resolve(REPO_ROOT, '.env.local');

  if (!fs.existsSync(envLocalPath)) {
    return;
  }

  for (const entry of parseEnvFile(fs.readFileSync(envLocalPath, 'utf8'))) {
    if (!process.env[entry.key]) {
      process.env[entry.key] = entry.value;
    }
  }
}

function resolvePublicHttpsUrl(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmedValue = rawValue.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmedValue);

    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export function getAssessmentVerificationConfig(env = process.env) {
  return {
    bookingUrl: resolvePublicHttpsUrl(env.NEXT_PUBLIC_ASSESSMENT_BOOKING_URL),
    paymentUrl: resolvePublicHttpsUrl(env.NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL),
    linkedInUrl:
      resolvePublicHttpsUrl(env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL) ?? DEFAULT_ASSESSMENT_LINKEDIN_URL,
    contactEmail: ASSESSMENT_CONTACT_EMAIL,
    contactHref: ASSESSMENT_CONTACT_HREF,
  };
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

function assertHtmlIncludes(html, expected, message) {
  if (!html.includes(expected)) {
    throw new Error(message);
  }
}

function assertHtmlExcludes(html, unexpected, message) {
  if (html.includes(unexpected)) {
    throw new Error(message);
  }
}

export function assertAssessmentRuntimeState(html, assessmentConfig) {
  assertHtmlIncludes(
    html,
    'Free path for teams still qualifying the review',
    'Assessment page is missing the free qualification block.',
  );
  assertHtmlIncludes(
    html,
    'Ready to move now?',
    'Assessment page is missing the direct-contact readiness block.',
  );
  assertHtmlIncludes(
    html,
    'Start with the report preview',
    'Assessment page is missing the free preview CTA.',
  );

  if (assessmentConfig.bookingUrl) {
    assertHtmlIncludes(
      html,
      'Book the 15-minute fit call',
      'Assessment page did not render the live fit-call CTA label.',
    );
    assertHtmlIncludes(
      html,
      assessmentConfig.bookingUrl,
      `Assessment page is missing the configured booking URL: ${assessmentConfig.bookingUrl}`,
    );
    assertHtmlExcludes(
      html,
      'Message Josh on LinkedIn',
      'Assessment page still renders the LinkedIn fallback CTA even though a booking URL is configured.',
    );
    assertHtmlExcludes(
      html,
      'Live scheduling is not configured yet.',
      'Assessment page still renders the top-level scheduling fallback copy even though a booking URL is configured.',
    );
  } else {
    assertHtmlIncludes(
      html,
      'Message Josh on LinkedIn',
      'Assessment page did not render the LinkedIn fallback CTA label.',
    );
    assertHtmlIncludes(
      html,
      assessmentConfig.linkedInUrl,
      `Assessment page is missing the fallback LinkedIn URL: ${assessmentConfig.linkedInUrl}`,
    );
    assertHtmlIncludes(
      html,
      'Live scheduling is not configured yet.',
      'Assessment page is missing the top-level scheduling fallback copy.',
    );
    assertHtmlIncludes(
      html,
      assessmentConfig.contactEmail,
      `Assessment page is missing the public contact email: ${assessmentConfig.contactEmail}`,
    );
    assertHtmlIncludes(
      html,
      assessmentConfig.contactHref,
      `Assessment page is missing the mailto fallback: ${assessmentConfig.contactHref}`,
    );
    assertHtmlExcludes(
      html,
      'Book the 15-minute fit call',
      'Assessment page rendered the live fit-call CTA label without a booking URL.',
    );
  }

  if (assessmentConfig.paymentUrl) {
    assertHtmlIncludes(
      html,
      'Secure the review',
      'Assessment page did not render the live payment CTA label.',
    );
    assertHtmlIncludes(
      html,
      assessmentConfig.paymentUrl,
      `Assessment page is missing the configured payment URL: ${assessmentConfig.paymentUrl}`,
    );
    assertHtmlExcludes(
      html,
      'Payment links are issued after the fit call and expire after 7 days.',
      'Assessment page still renders the manual-payment fallback copy even though a payment URL is configured.',
    );
  } else {
    assertHtmlExcludes(
      html,
      'Secure the review',
      'Assessment page rendered the live payment CTA without a payment URL.',
    );
    assertHtmlIncludes(
      html,
      'Payment links are issued after the fit call and expire after 7 days.',
      'Assessment page is missing the manual-payment fallback copy.',
    );
  }
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

export async function runProductionVerification(
  baseUrl,
  assessmentConfig = getAssessmentVerificationConfig(),
) {
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
    {
      name: 'assessment-funnel-runtime',
      path: '/assessment',
      assert: async (response) => {
        const html = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        assertAssessmentRuntimeState(html, assessmentConfig);
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
  loadEnvLocal();
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
