#!/usr/bin/env node

import { readdirSync, readFileSync, statSync, writeFileSync } from 'fs';
import { dirname, isAbsolute, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { SECURITY_HEADERS, getExpectedSecurityHeaderValue } from '../lib/security-headers.mjs';
import {
  ANALYTICS_INTEGRATION_MARKERS,
  PRIVACY_ANALYTICS_DECLARATION,
  VERIFIED_PAGE_METADATA,
} from '../lib/page-metadata.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const WORKDIR = process.cwd();
const DEFAULT_BASE_URL = 'https://aithreatbrief.com';
const REQUEST_TIMEOUT_MS = 20000;
const TOOLS_AFFILIATE_LINK_EXPECTATIONS = [
  {
    name: 'NordVPN',
    anchorText: 'Visit vendor site',
    ariaLabel: 'Visit NordVPN vendor site (opens in new tab)',
    snippets: ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
  },
  {
    name: 'Proton VPN',
    anchorText: 'Visit vendor site',
    ariaLabel: 'Visit Proton VPN vendor site (opens in new tab)',
    snippets: ['https://go.getproton.me/aff_c?', 'url_id=471'],
  },
  {
    name: 'Proton Mail',
    anchorText: 'Visit vendor site',
    ariaLabel: 'Visit Proton Mail vendor site (opens in new tab)',
    snippets: ['https://go.getproton.me/aff_c?', 'url_id=921'],
  },
  {
    name: 'PureVPN',
    anchorText: 'Visit vendor site',
    ariaLabel: 'Visit PureVPN vendor site (opens in new tab)',
    snippets: ['https://www.purevpn.com/order-now.php?', 'affiliate_id=49384204'],
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

  assertBodyIncludesAll(matchedAnchor, hrefSnippets, `${context} href`);
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
      path: `/blog/${article.slug}`,
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }

        assertAffiliateAnchor(body, label, hrefSnippets, `/blog/${article.slug}`);
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

function collectSourceFiles(directoryPath) {
  const entries = readdirSync(directoryPath, { withFileTypes: true });
  const filePaths = [];

  for (const entry of entries) {
    const entryPath = resolve(directoryPath, entry.name);

    if (entry.isDirectory()) {
      filePaths.push(...collectSourceFiles(entryPath));
      continue;
    }

    if (entry.isFile()) {
      filePaths.push(entryPath);
    }
  }

  return filePaths;
}

function codebaseHasAnalyticsIntegration() {
  const excludedPaths = new Set([
    resolve(REPO_ROOT, 'app/privacy/page.tsx'),
    resolve(REPO_ROOT, 'lib/page-metadata.mjs'),
  ]);
  const sourceDirectories = [
    resolve(REPO_ROOT, 'app'),
    resolve(REPO_ROOT, 'components'),
    resolve(REPO_ROOT, 'lib'),
  ];

  for (const directoryPath of sourceDirectories) {
    if (!statSync(directoryPath).isDirectory()) {
      continue;
    }

    const sourceFiles = collectSourceFiles(directoryPath).filter((filePath) => {
      if (excludedPaths.has(filePath)) {
        return false;
      }

      return /\.(?:[cm]?js|tsx?)$/.test(filePath);
    });

    for (const filePath of sourceFiles) {
      const contents = readFileSync(filePath, 'utf8').toLowerCase();
      if (ANALYTICS_INTEGRATION_MARKERS.some((marker) => contents.includes(marker))) {
        return true;
      }
    }
  }

  return false;
}

function assertSecurityHeaders(headers) {
  for (const header of SECURITY_HEADERS) {
    const actualValue = headers.get(header.key);

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
  const baseUrl = (getArgValue('base-url') || process.env.VERIFY_LIVE_BASE_URL || DEFAULT_BASE_URL).replace(/\/$/, '');
  const canonicalBaseUrl = resolveCanonicalBaseUrl(baseUrl, getArgValue('canonical-base-url'));
  const outputPath = getArgValue('output');
  const manifest = loadManifest();
  const featuredArticle = manifest.articles[0];
  const articlePath = `/blog/${featuredArticle.slug}`;
  const analyticsIntegrationEnabled = codebaseHasAnalyticsIntegration();
  const nordVpnArticleChecks = getTokenizedAffiliateArticleChecks(
    manifest.articles,
    'NORDVPN',
    'NordVPN',
    ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
    (article) => readFileSync(resolve(REPO_ROOT, 'blog', article.fileName), 'utf8'),
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
          const declaresNoClientSideAnalytics = body.includes(PRIVACY_ANALYTICS_DECLARATION);

          if (analyticsIntegrationEnabled && declaresNoClientSideAnalytics) {
            throw new Error('Privacy policy still declares no client-side analytics while analytics integration markers exist in source.');
          }

          if (!analyticsIntegrationEnabled && !declaresNoClientSideAnalytics) {
            throw new Error('Privacy policy no longer states that no client-side analytics service is deployed.');
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
        if (!body.includes(articlePath)) {
          throw new Error(`Blog index is missing expected article path ${articlePath}.`);
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
          assertAffiliateAnchor(
            body,
            expectation.name,
            expectation.snippets,
            `/tools ${expectation.name} affiliate link`,
            {
              anchorText: expectation.anchorText,
              ariaLabel: expectation.ariaLabel,
            },
          );
        }
      },
    },
    {
      name: 'newsletter-page',
      path: '/newsletter',
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (!body.includes('Subscribe')) {
          throw new Error('Newsletter page is missing the subscribe marker.');
        }
      },
    },
    {
      name: 'article-page',
      path: articlePath,
      method: 'GET',
      assert: async (response) => {
        const body = await response.text();
        const expectedCanonical = toAbsoluteCanonical(canonicalBaseUrl, articlePath);
        const actualCanonical = extractCanonicalHref(body);

        if (response.status !== 200) {
          throw new Error(`Expected HTTP 200, received ${response.status}`);
        }
        if (!body.includes(featuredArticle.title)) {
          throw new Error(`Article page is missing expected title: ${featuredArticle.title}`);
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
