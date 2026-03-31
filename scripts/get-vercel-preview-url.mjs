#!/usr/bin/env node

import { writeFileSync } from 'node:fs';
import { isAbsolute, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_REPO = process.env.GITHUB_REPOSITORY?.trim() || 'joshcabana/ai-security-brief';
const DEFAULT_PROJECT_NAME = 'ai-security-brief';
const DEFAULT_TIMEOUT_MS = 180000;
const DEFAULT_POLL_INTERVAL_MS = 10000;
const DEFAULT_API_BASE_URL = process.env.GITHUB_API_URL?.trim() || 'https://api.github.com';
const REQUEST_TIMEOUT_MS = 15000;
const VERCEL_BOT_LOGIN = 'vercel[bot]';

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function parseCliOptions(argv = process.argv.slice(2)) {
  const options = {
    repo: DEFAULT_REPO,
    pullRequestNumber: null,
    projectName: DEFAULT_PROJECT_NAME,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    pollIntervalMs: DEFAULT_POLL_INTERVAL_MS,
    outputPath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--') {
      continue;
    }

    if (value === '--repo' && argv[index + 1]) {
      options.repo = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === '--pr' && argv[index + 1]) {
      options.pullRequestNumber = Number.parseInt(argv[index + 1], 10);
      index += 1;
      continue;
    }

    if (value === '--project' && argv[index + 1]) {
      options.projectName = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === '--timeout-ms' && argv[index + 1]) {
      options.timeoutMs = Number.parseInt(argv[index + 1], 10);
      index += 1;
      continue;
    }

    if (value === '--poll-interval-ms' && argv[index + 1]) {
      options.pollIntervalMs = Number.parseInt(argv[index + 1], 10);
      index += 1;
      continue;
    }

    if (value === '--output' && argv[index + 1]) {
      options.outputPath = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error(
      'Usage: node scripts/get-vercel-preview-url.mjs --pr <number> [--repo owner/repo] [--project name] [--timeout-ms value] [--poll-interval-ms value] [--output path]',
    );
  }

  assert(options.repo.includes('/'), '--repo must be in owner/repo format.');
  assert(Number.isInteger(options.pullRequestNumber) && options.pullRequestNumber > 0, '--pr must be a positive integer.');
  assert(options.projectName.trim().length > 0, '--project must be a non-empty string.');
  assert(Number.isInteger(options.timeoutMs) && options.timeoutMs > 0, '--timeout-ms must be a positive integer.');
  assert(
    Number.isInteger(options.pollIntervalMs) && options.pollIntervalMs > 0,
    '--poll-interval-ms must be a positive integer.',
  );

  return options;
}

export function decodeVercelCommentMetadata(body) {
  const match = String(body).match(/^\[vc\]: #[^:]+:([A-Za-z0-9+/=]+)$/m);

  if (!match) {
    return null;
  }

  try {
    return JSON.parse(Buffer.from(match[1], 'base64').toString('utf8'));
  } catch {
    return null;
  }
}

export function normalisePreviewUrl(value) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim().replace(/\/$/, '');

  if (trimmedValue.length === 0) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue;
  }

  return `https://${trimmedValue}`;
}

function getCommentTimestamp(comment) {
  const timestamp = comment?.updated_at || comment?.created_at || '';
  return Number.isNaN(Date.parse(timestamp)) ? 0 : Date.parse(timestamp);
}

export function extractPreviewUrlFromComments(comments, projectName) {
  const sortedComments = [...comments].sort((left, right) => getCommentTimestamp(right) - getCommentTimestamp(left));

  for (const comment of sortedComments) {
    if (comment?.user?.login !== VERCEL_BOT_LOGIN) {
      continue;
    }

    const metadata = decodeVercelCommentMetadata(comment.body);
    const project = metadata?.projects?.find((candidate) => candidate?.name === projectName) ?? null;

    if (!project) {
      continue;
    }

    if (project.nextCommitStatus !== 'DEPLOYED') {
      return null;
    }

    return normalisePreviewUrl(project.previewUrl);
  }

  return null;
}

async function fetchWithTimeout(url, token) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}

export async function loadIssueComments({ repo, pullRequestNumber, token, apiBaseUrl = DEFAULT_API_BASE_URL }) {
  const comments = [];

  for (let page = 1; page <= 10; page += 1) {
    const url = `${apiBaseUrl}/repos/${repo}/issues/${pullRequestNumber}/comments?per_page=100&page=${page}`;
    const response = await fetchWithTimeout(url, token);

    if (!response.ok) {
      const responseBody = await response.text();
      throw new Error(
        `GitHub issue comments request failed for ${repo} PR #${pullRequestNumber} (page ${page}) with ${response.status}: ${responseBody}`,
      );
    }

    const pageComments = await response.json();

    if (!Array.isArray(pageComments)) {
      throw new Error(`GitHub issue comments response for ${repo} PR #${pullRequestNumber} was not an array.`);
    }

    comments.push(...pageComments);

    if (pageComments.length < 100) {
      break;
    }
  }

  return comments;
}

function resolveOutputPath(outputPath) {
  if (!outputPath) {
    return null;
  }

  if (isAbsolute(outputPath)) {
    return outputPath;
  }

  return resolve(process.cwd(), outputPath);
}

export async function waitForPreviewUrl(
  { repo, pullRequestNumber, projectName, token, timeoutMs, pollIntervalMs, apiBaseUrl = DEFAULT_API_BASE_URL },
  dependencies = {},
) {
  const loadComments = dependencies.loadComments ?? loadIssueComments;
  const sleep = dependencies.sleep ?? ((durationMs) => new Promise((resolveSleep) => setTimeout(resolveSleep, durationMs)));
  const startedAt = Date.now();
  let lastResultMessage = `No Vercel preview metadata found for ${projectName}.`;

  while (Date.now() - startedAt <= timeoutMs) {
    try {
      const comments = await loadComments({
        repo,
        pullRequestNumber,
        token,
        apiBaseUrl,
      });
      const previewUrl = extractPreviewUrlFromComments(comments, projectName);

      if (previewUrl) {
        return previewUrl;
      }

      lastResultMessage = `Latest Vercel preview for project ${projectName} is not deployed yet.`;
    } catch (error) {
      lastResultMessage = error instanceof Error ? error.message : String(error);
    }

    const elapsedMs = Date.now() - startedAt;
    const remainingMs = timeoutMs - elapsedMs;

    if (remainingMs <= 0) {
      break;
    }

    await sleep(Math.min(pollIntervalMs, remainingMs));
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for a deployed Vercel preview URL for ${repo} PR #${pullRequestNumber}. Last result: ${lastResultMessage}`,
  );
}

export async function main() {
  const options = parseCliOptions();
  const token = process.env.GITHUB_TOKEN?.trim() || '';

  assert(token.length > 0, 'GITHUB_TOKEN is required to read Vercel preview metadata from pull request comments.');

  const previewUrl = await waitForPreviewUrl({
    repo: options.repo,
    pullRequestNumber: options.pullRequestNumber,
    projectName: options.projectName,
    token,
    timeoutMs: options.timeoutMs,
    pollIntervalMs: options.pollIntervalMs,
  });

  const outputPath = resolveOutputPath(options.outputPath);

  if (outputPath) {
    writeFileSync(outputPath, `${previewUrl}\n`);
  }

  console.log(previewUrl);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
