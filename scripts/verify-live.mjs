#!/usr/bin/env node

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { dirname, isAbsolute, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import {
  evaluatePrivacyAnalyticsContract,
  resolveAnalyticsState,
} from '../lib/analytics-config.mjs';
import { normalizeApprovedAffiliateUrl } from '../lib/affiliate-url-policy.mjs';
import { SECURITY_HEADERS, getExpectedSecurityHeaderValue } from '../lib/security-headers.mjs';
import { VERIFIED_PAGE_METADATA } from '../lib/page-metadata.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const WORKDIR = process.cwd();
const DEFAULT_BASE_URL = 'https://aithreatbrief.com';
const REQUEST_TIMEOUT_MS = 20000;
const TOOLS_AFFILIATE_LINK_EXPECTATIONS = [
  {
    name: 'NordVPN',
    affiliateCode: 'NORDVPN',
    fallbackUrl: 'https://nordvpn.com',
    anchorText: 'Visit vendor site',
    ariaLabel: 'Visit NordVPN vendor site (opens in new tab)',
  },
  {
    name: 'Proton VPN',
    affiliateCode: 'PROTON_VPN',
    fallbackUrl: 'https://protonvpn.com',
    anchorText: 'Visit vendor site',
    ariaLabel: 'Visit Proton VPN vendor site (opens in new tab)',
  },
  {
    name: 'Proton Mail',
    affiliateCode: 'PROTON_MAIL',
    fallbackUrl: 'https://proton.me/mail',
    anchorText: 'Visit vendor site',
    ariaLabel: 'Visit Proton Mail vendor site (opens in new tab)',
  },
  {
    name: 'PureVPN',
    affiliateCode: 'PUREVPN',
    fallbackUrl: 'https://www.purevpn.com',
    anchorText: 'Visit vendor site',
    ariaLabel: 'Visit PureVPN vendor site (opens in new tab)',
  },
];

// Domains that must redirect to DEFAULT_BASE_URL (apex)
const REDIRECT_DOMAINS = [
  { name: 'www-redirect', from: 'https://www.aithreatbrief.com', expectedApex: DEFAULT_BASE_URL },
  { name: 'alias-redirect', from: 'https://aisecbrief.com', expectedApex: DEFAULT_BASE_URL },
];

function getArgValue(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);

  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1];
}

function loadManifest() {
  const manifestPath = resolve(REPO_ROOT, 'content-manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));

  if (!manifest?.articles || !Array.isArray(manifest.articles) || manifest.articles.length === 0) {
    throw new Error('content-manifest.json does not contain any articles.');
  }

  return manifest;
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

  if (!existsSync(envLocalPath)) {
    return;
  }

  for (const entry of parseEnvFile(readFileSync(envLocalPath, 'utf8'))) {
    if (!process.env[entry.key]) {
      process.env[entry.key] = entry.value;
    }
  }
}

function resolveOutputPath(outputPath) {
  if (isAbsolute(outputPath)) {
    return outputPath;
  }

  return resolve(WORKDIR, outputPath);
}

export function getDeploymentProtectionHeaders(
  secret = process.env.VERCEL_PROTECTION_BYPASS?.trim() || process.env.VERCEL_AUTOMATION_BYPASS_SECRET?.trim() || '',
) {
  if (!secret) {
    return {};
  }

  return {
    'x-vercel-protection-bypass': secret,
  };
}

export function mergeRequestHeaders(additionalHeaders, protectionHeaders) {
  return {
    ...(protectionHeaders ?? {}),
    ...(additionalHeaders ?? {}),
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const protectionHeaders = getDeploymentProtectionHeaders();
    return await fetch(url, {
      ...options,
      headers: mergeRequestHeaders(options.headers, protectionHeaders),
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchNoFollow(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const protectionHeaders = getDeploymentProtectionHeaders();
    return await fetch(url, {
      headers: protectionHeaders,
      redirect: 'manual',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

function getSameSiteHeaders(baseUrl) {
  return {
    'content-type': 'application/json',
    origin: baseUrl,
    referer: `${baseUrl}/newsletter`,
  };
}

export function resolveCanonicalBaseUrl(baseUrl, overrideCanonicalBaseUrl) {
  return (overrideCanonicalBaseUrl || baseUrl).replace(/\/$/, '');
}

function toAbsoluteCanonical(baseUrl, canonicalPath) {
  if (canonicalPath === '/') {
    return baseUrl;
  }

  return `${baseUrl}${canonicalPath}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildUrlAssertionSnippets(url) {
  const parsedUrl = new URL(url);
  const searchEntries = [...parsedUrl.searchParams.entries()];
  const normalizedPathname = parsedUrl.pathname === '/' ? '' : parsedUrl.pathname;
  const baseSnippet = `${parsedUrl.origin}${normalizedPathname}${searchEntries.length > 0 ? '?' : ''}`;

  return [baseSnippet, ...searchEntries.map(([key, value]) => `${key}=${value}`)];
}

export function assertBodyIncludesAll(body, snippets, context) {
  for (const snippet of snippets) {
    if (!body.includes(snippet)) {
      throw new Error(`${context} is missing expected snippet: ${snippet}`);
    }
  }
}

export function assertAffiliateAnchor(body, label, hrefSnippets, context, anchorOptions) {
  const anchorText = anchorOptions?.anchorText ?? label;
  const ariaLabel = anchorOptions?.ariaLabel;
  const matchedAnchor = getAffiliateAnchorHref(body, label, context, {
    anchorText,
    ariaLabel,
  });

  assertBodyIncludesAll(matchedAnchor, hrefSnippets, `${context} href`);
}

export function getAffiliateAnchorHref(body, label, context, anchorOptions) {
  const anchorText = anchorOptions?.anchorText ?? label;
  const ariaLabel = anchorOptions?.ariaLabel;
  const anchorPattern = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let matchedAnchor = null;
  let mismatchMessage = null;

  for (const anchorMatch of body.matchAll(anchorPattern)) {
    const anchorAttributes = anchorMatch[1];
    const innerHtml = anchorMatch[2];
    const visibleText = innerHtml
      .replace(/<[^>]*>/g, ' ')
      .replace(/&nbsp;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (visibleText !== anchorText) {
      continue;
    }

    const hrefMatch = anchorAttributes.match(/href="([^"]+)"/i);

    if (!hrefMatch) {
      mismatchMessage = `${context} affiliate anchor for ${label} is missing an href attribute.`;
      continue;
    }

    if (ariaLabel !== undefined) {
      const ariaLabelMatch = anchorAttributes.match(/aria-label="([^"]+)"/i);

      if (!ariaLabelMatch) {
        mismatchMessage = `${context} affiliate anchor for ${label} is missing aria-label ${ariaLabel}.`;
        continue;
      }

      if (ariaLabelMatch[1] !== ariaLabel) {
        mismatchMessage = `${context} affiliate anchor for ${label} has aria-label ${ariaLabelMatch[1]}, expected ${ariaLabel}.`;
        continue;
      }
    }

    matchedAnchor = hrefMatch[1];
    break;
  }

  if (matchedAnchor === null) {
    if (mismatchMessage !== null) {
      throw new Error(mismatchMessage);
    }

    throw new Error(`${context} is missing a rendered affiliate anchor for ${label} with text ${anchorText}.`);
  }

  return matchedAnchor;
}

export function assertToolsAffiliateAnchor(body, expectation, configuredAffiliateUrl, context) {
  const renderedHref = getAffiliateAnchorHref(body, expectation.name, context, {
    anchorText: expectation.anchorText,
    ariaLabel: expectation.ariaLabel,
  });

  if (configuredAffiliateUrl) {
    assertBodyIncludesAll(
      renderedHref,
      buildUrlAssertionSnippets(configuredAffiliateUrl),
      `${context} href`,
    );
    return;
  }

  const normalizedRenderedAffiliateUrl = normalizeApprovedAffiliateUrl(
    expectation.affiliateCode,
    renderedHref,
  );

  if (normalizedRenderedAffiliateUrl) {
    return;
  }

  assertBodyIncludesAll(
    renderedHref,
    buildUrlAssertionSnippets(expectation.fallbackUrl),
    `${context} href`,
  );
}

function assertPlainTextAffiliateLabel(body, label, context) {
  if (!body.includes(label)) {
    throw new Error(`${context} is missing the expected plain-text label ${label}.`);
  }

  const bodyWithoutAnchors = body.replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, ' ');

  if (!bodyWithoutAnchors.includes(label)) {
    throw new Error(`${context} is missing a non-linked plain-text label ${label}.`);
  }
}

export function getTokenizedAffiliateArticleChecks(articles, tokenCode, label, hrefSnippets, readMarkdown) {
  const tokenMarker = `[AFFILIATE:${tokenCode}]`;
  const checks = [];

  for (const article of articles) {
    const markdown = readMarkdown(article);

    if (!markdown.includes(tokenMarker)) {
      continue;
    }

    checks.push({
      name: `article-affiliate-link:${article.slug}`,
      path: article.routePath ?? `/blog/${article.slug}`,
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        if (hrefSnippets.length === 0) {
          assertPlainTextAffiliateLabel(body, label, article.routePath ?? `/blog/${article.slug}`);
          return;
        }

        assertAffiliateAnchor(body, label, hrefSnippets, article.routePath ?? `/blog/${article.slug}`);
      },
    });
  }

  if (checks.length === 0) {
    throw new Error(`No published articles in content-manifest.json reference ${tokenMarker}.`);
  }

  return checks;
}

function extractCanonicalHref(body) {
  const match = body.match(/<link rel="canonical" href="([^"]+)"/i);
  return match?.[1] ?? null;
}

function extractMetaPropertyContent(body, property) {
  const escapedProperty = escapeRegExp(property);
  const propertyFirst = new RegExp(
    `<meta[^>]+property="${escapedProperty}"[^>]+content="([^"]+)"`,
    'i',
  );
  const contentFirst = new RegExp(
    `<meta[^>]+content="([^"]+)"[^>]+property="${escapedProperty}"`,
    'i',
  );
  const match = body.match(propertyFirst) ?? body.match(contentFirst);
  return match?.[1] ?? null;
}

function assertSecurityHeaders(headers) {
  for (const header of SECURITY_HEADERS) {
    const actualValue = headers.get(header.key);

    if (header.key === 'Content-Security-Policy') {
      if (typeof actualValue !== 'string') {
        throw new Error(
          `Expected ${header.key} to be ${getExpectedSecurityHeaderValue(header.key)}, received ${actualValue ?? 'null'}`,
        );
      }

      const escapedExpectedValue = header.value
        .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        .replace(escapeRegExp('__CSP_NONCE__'), "[^']+");
      const expectedPattern = new RegExp(`^${escapedExpectedValue}$`);

      if (!expectedPattern.test(actualValue)) {
        throw new Error(
          `Expected ${header.key} to be ${getExpectedSecurityHeaderValue(header.key)}, received ${actualValue ?? 'null'}`,
        );
      }

      continue;
    }

    if (actualValue !== header.value) {
      throw new Error(
        `Expected ${header.key} to be ${getExpectedSecurityHeaderValue(header.key)}, received ${actualValue ?? 'null'}`,
      );
    }
  }
}

function toSummary(results, baseUrl) {
  const lines = [
    '## verify:live',
    '',
    `Base URL: \`${baseUrl}\``,
    '',
  ];

  for (const result of results) {
    const prefix = result.ok ? '- PASS' : '- FAIL';
    lines.push(`${prefix}: \`${result.name}\` — ${result.message}`);
  }

  return lines.join('\n') + '\n';
}

async function runRedirectChecks() {
  const results = [];

  for (const { name, from, expectedApex } of REDIRECT_DOMAINS) {
    try {
      const response = await fetchNoFollow(from);
      const status = response.status;
      const location = response.headers.get('location') || '';

      // Accept 301 or 308 redirects pointing to the apex (with or without trailing slash)
      const isRedirect = status === 301 || status === 308;
      const pointsToApex = location.startsWith(expectedApex);

      if (!isRedirect) {
        throw new Error(`Expected 301 or 308 redirect from ${from}, received ${status}`);
      }
      if (!pointsToApex) {
        throw new Error(`Redirect location ${location} does not point to apex ${expectedApex}`);
      }

      results.push({
        name,
        ok: true,
        path: from,
        status,
        message: `${from} → ${location} (${status})`,
      });
    } catch (error) {
      results.push({
        name,
        ok: false,
        path: from,
        status: null,
        message: error instanceof Error ? error.message : 'Unknown redirect check error.',
      });
    }
  }

  return results;
}

async function run() {
  loadEnvLocal();

  const baseUrl = (getArgValue('base-url') || process.env.VERIFY_LIVE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const canonicalBaseUrl = resolveCanonicalBaseUrl(baseUrl, getArgValue('canonical-base-url'));
  const outputPath = getArgValue('output');
  const manifest = loadManifest();
  const featuredEditorialArticle = manifest.articles.find((article) => article.section === 'editorial') ?? null;
  const featuredReviewArticle = manifest.articles.find((article) => article.section === 'review') ?? null;
  const analyticsState = resolveAnalyticsState(
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
  );
  const nordVpnHrefSnippets = (() => {
    const affiliateUrl = normalizeApprovedAffiliateUrl('NORDVPN', process.env.AFFILIATE_NORDVPN);
    return affiliateUrl ? buildUrlAssertionSnippets(affiliateUrl) : [];
  })();
  const nordVpnArticleChecks = getTokenizedAffiliateArticleChecks(
    manifest.articles,
    'NORDVPN',
    'NordVPN',
    nordVpnHrefSnippets,
    (article) => readFileSync(resolve(REPO_ROOT, article.section === 'review' ? 'reviews' : 'blog', article.fileName), 'utf8'),
  );

  const routeChecks = [
    {
      name: 'homepage',
      path: '/',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (!body.includes('AI Security Brief')) {
          throw new Error('Homepage is missing the site title marker.');
        }
      },
    },
    {
      name: 'homepage-navigation',
      path: '/',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        for (const requiredPath of ['/about', '/archive', '/methodology', '/pro']) {
          if (!body.includes(`href="${requiredPath}"`)) {
            throw new Error(`Homepage is missing the expected internal navigation link ${requiredPath}.`);
          }
        }

        if (body.includes('/go/')) {
          throw new Error('Homepage still renders stale /go/* internal links.');
        }
      },
    },
    ...VERIFIED_PAGE_METADATA.map((pageMetadata) => ({
      name: `metadata:${pageMetadata.path === '/' ? 'home' : pageMetadata.path.slice(1).replace(/\//g, '-')}`,
      path: pageMetadata.path,
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        const expectedCanonical = toAbsoluteCanonical(canonicalBaseUrl, pageMetadata.canonicalPath);
        const actualCanonical = extractCanonicalHref(body);

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (actualCanonical !== expectedCanonical) {
          throw new Error(`Expected canonical ${expectedCanonical}, received ${actualCanonical ?? 'null'}`);
        }

        if (pageMetadata.ogDescription) {
          const actualOgDescription = extractMetaPropertyContent(body, 'og:description');

          if (actualOgDescription !== pageMetadata.ogDescription) {
            throw new Error(
              `Expected og:description for ${pageMetadata.path} to be "${pageMetadata.ogDescription}", received ${actualOgDescription ?? 'null'}`,
            );
          }
        }

        if (pageMetadata.path === '/privacy') {
          const analyticsContract = evaluatePrivacyAnalyticsContract({
            plausibleEnabled: analyticsState.plausibleEnabled,
            linkedInInsightEnabled: analyticsState.linkedInInsightEnabled,
            html: body,
          });

          if (!analyticsContract.ok) {
            throw new Error(analyticsContract.message);
          }
        }
      },
    })),
    {
      name: 'security-headers',
      path: '/',
      method: 'GET',
      assert: async (response) => {
        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        assertSecurityHeaders(response.headers);
        await response.arrayBuffer();
      },
    },
    {
      name: 'blog-index',
      path: '/blog',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (!featuredEditorialArticle) {
          throw new Error('Unable to verify from available data: content-manifest.json does not include an editorial article.');
        }
        if (!body.includes(featuredEditorialArticle.routePath)) {
          throw new Error(`Blog index is missing expected article path ${featuredEditorialArticle.routePath}.`);
        }
      },
    },
    {
      name: 'reviews-index',
      path: '/reviews',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (!featuredReviewArticle) {
          throw new Error('Unable to verify from available data: content-manifest.json does not include a review article.');
        }
        if (!body.includes(featuredReviewArticle.routePath)) {
          throw new Error(`Reviews index is missing expected article path ${featuredReviewArticle.routePath}.`);
        }
      },
    },
    {
      name: 'tools-page-affiliates',
      path: '/tools',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        for (const expectation of TOOLS_AFFILIATE_LINK_EXPECTATIONS) {
          const affiliateUrl = normalizeApprovedAffiliateUrl(
            expectation.affiliateCode,
            process.env[`AFFILIATE_${expectation.affiliateCode}`],
          );
          assertToolsAffiliateAnchor(
            body,
            expectation,
            affiliateUrl,
            `/tools ${expectation.name} affiliate link`,
          );
        }

        if (!body.includes('data-newsletter-source="tools-footer"')) {
          throw new Error('Tools page is missing the inline newsletter signup form.');
        }
      },
    },
    {
      name: 'newsletter-page',
      path: '/newsletter?source=tools-footer',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (!body.includes('Subscribe')) {
          throw new Error('Newsletter page is missing the subscribe marker.');
        }
        if (!body.includes('data-newsletter-source="tools-footer"')) {
          throw new Error('Newsletter page did not preserve the tagged source from the query string.');
        }
      },
    },
    {
      name: 'editorial-article-page',
      path: featuredEditorialArticle?.routePath ?? '/blog',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        if (!featuredEditorialArticle) {
          throw new Error('Unable to verify from available data: content-manifest.json does not include an editorial article.');
        }
        const expectedCanonical = toAbsoluteCanonical(canonicalBaseUrl, featuredEditorialArticle.routePath);
        const actualCanonical = extractCanonicalHref(body);

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (!body.includes(featuredEditorialArticle.title)) {
          throw new Error(`Article page is missing expected title: ${featuredEditorialArticle.title}`);
        }
        if (actualCanonical !== expectedCanonical) {
          throw new Error(`Expected article canonical ${expectedCanonical}, received ${actualCanonical ?? 'null'}`);
        }
      },
    },
    {
      name: 'review-article-page',
      path: featuredReviewArticle?.routePath ?? '/reviews',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        if (!featuredReviewArticle) {
          throw new Error('Unable to verify from available data: content-manifest.json does not include a review article.');
        }
        const expectedCanonical = toAbsoluteCanonical(canonicalBaseUrl, featuredReviewArticle.routePath);
        const actualCanonical = extractCanonicalHref(body);

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (!body.includes(featuredReviewArticle.title)) {
          throw new Error(`Review page is missing expected title: ${featuredReviewArticle.title}`);
        }
        if (actualCanonical !== expectedCanonical) {
          throw new Error(`Expected article canonical ${expectedCanonical}, received ${actualCanonical ?? 'null'}`);
        }
      },
    },
    ...nordVpnArticleChecks,
    {
      name: 'subscribe-endpoint',
      path: '/api/subscribe',
      method: 'POST',
      body: JSON.stringify({ email: 'not-an-email' }),
      headers: getSameSiteHeaders(baseUrl),
      assert: async (response) => {
        const payload = await response.json();
        if (response.status !== 400) {
          throw new Error(`Expected HTTP 400, received ${response.status}`);
        }
        if (payload?.ok !== false) {
          throw new Error('Subscribe endpoint did not return ok:false for invalid input.');
        }
      },
    },
  ];

  const routeResults = [];

  for (const check of routeChecks) {
    const targetUrl = `${baseUrl}${check.path}`;
    try {
      const response = await fetchWithTimeout(targetUrl, {
        method: check.method,
        headers: check.headers,
        body: check.body,
      });
      await check.assert(response);
      routeResults.push({
        name: check.name,
        ok: true,
        path: check.path,
        status: response.status,
        message: `${check.method} ${check.path} returned ${response.status}`,
      });
    } catch (error) {
      routeResults.push({
        name: check.name,
        ok: false,
        path: check.path,
        status: null,
        message: error instanceof Error ? error.message : 'Unknown verification error.',
      });
    }
  }

  // Run redirect checks only when hitting the real production apex
  const isProductionRun = baseUrl === DEFAULT_BASE_URL;
  const redirectResults = isProductionRun ? await runRedirectChecks() : [];

  const results = [...routeResults, ...redirectResults];

  const report = {
    checkedAt: new Date().toISOString(),
    baseUrl,
    canonicalBaseUrl,
    ok: results.every((result) => result.ok),
    results,
  };

  if (outputPath) {
    writeFileSync(resolveOutputPath(outputPath), `${JSON.stringify(report, null, 2)}\n`);
  }

  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, toSummary(results, baseUrl), { flag: 'a' });
  }

  console.log(JSON.stringify(report, null, 2));

  if (!report.ok) {
    process.exitCode = 1;
  }
}

export async function main() {
  await run();
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : 'Unknown top-level verify-live failure.';
    const report = {
      checkedAt: new Date().toISOString(),
      baseUrl: getArgValue('base-url') || process.env.VERIFY_LIVE_BASE_URL || DEFAULT_BASE_URL,
      ok: false,
      results: [
        {
          name: 'verify-live',
          ok: false,
          path: null,
          status: null,
          message,
        },
      ],
    };

    console.log(JSON.stringify(report, null, 2));
    if (process.env.GITHUB_STEP_SUMMARY) {
      writeFileSync(process.env.GITHUB_STEP_SUMMARY, toSummary(report.results, report.baseUrl), { flag: 'a' });
    }
    process.exit(1);
  });
}
