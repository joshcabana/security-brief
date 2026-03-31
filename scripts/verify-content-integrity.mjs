#!/usr/bin/env node

import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { extractNewsletterIssueNumber } from './automation/renderers.mjs';

const ROOT = process.cwd();
const MANIFEST_PATH = path.join(ROOT, 'content-manifest.json');
const DRAFTS_DIR = path.join(ROOT, 'drafts');
const AFFILIATE_STATUS_PATH = path.join(ROOT, 'ops', 'affiliate-status.md');
const AFFILIATE_INTAKE_PATH = path.join(ROOT, 'ops', 'affiliate-intake.md');

function normalizeProgramName(value) {
  return value.trim().toLowerCase();
}

function parseLiveProgramsFromStatusDoc(markdown) {
  const livePrograms = new Set();

  for (const line of markdown.split('\n')) {
    if (!line.startsWith('|') || line.includes('Programme') || line.includes('---')) {
      continue;
    }

    const cells = line
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (cells.length < 2) {
      continue;
    }

    if (cells[1].includes('Live')) {
      livePrograms.add(normalizeProgramName(cells[0]));
    }
  }

  return livePrograms;
}

function parseLiveProgramsFromIntakeDoc(markdown) {
  const livePrograms = new Set();

  for (const line of markdown.split('\n')) {
    const match = line.match(/^- (.+?): (.+)$/);

    if (!match) {
      continue;
    }

    const statusText = match[2].split('—')[0]?.trim() ?? match[2].trim();

    if (statusText.includes('Live')) {
      livePrograms.add(normalizeProgramName(match[1]));
    }
  }

  return livePrograms;
}

function getSortedSetDifference(left, right) {
  return [...left].filter((value) => !right.has(value)).sort((a, b) => a.localeCompare(b));
}

function extractDraftArticleLinks(markdown) {
  const links = [];
  const pattern = /\]\(\/blog\/([^)]+)\)/g;
  let match = pattern.exec(markdown);

  while (match) {
    links.push(match[1]);
    match = pattern.exec(markdown);
  }

  return links;
}

async function main() {
  const manifest = JSON.parse(await readFile(MANIFEST_PATH, 'utf8'));
  const articleSlugs = new Set(manifest.articles.map((article) => article.slug));
  const draftEntries = (await readdir(DRAFTS_DIR))
    .filter((entry) => entry.startsWith('newsletter-') && entry.endsWith('.md'))
    .sort((left, right) => left.localeCompare(right));
  const issueNumbers = new Map();
  const missingDraftLinks = [];

  for (const draftEntry of draftEntries) {
    const draftPath = path.join(DRAFTS_DIR, draftEntry);
    const draftMarkdown = await readFile(draftPath, 'utf8');
    const issueNumber = extractNewsletterIssueNumber(draftMarkdown);

    if (!issueNumber) {
      throw new Error(`Missing newsletter issue number in drafts/${draftEntry}.`);
    }

    const matchingDrafts = issueNumbers.get(issueNumber) ?? [];
    matchingDrafts.push(`drafts/${draftEntry}`);
    issueNumbers.set(issueNumber, matchingDrafts);

    for (const articleSlug of extractDraftArticleLinks(draftMarkdown)) {
      if (!articleSlugs.has(articleSlug)) {
        missingDraftLinks.push(`drafts/${draftEntry} → /blog/${articleSlug}`);
      }
    }
  }

  const duplicateIssueNumbers = [...issueNumbers.entries()]
    .filter(([, files]) => files.length > 1)
    .map(([issueNumber, files]) => `Issue #${issueNumber}: ${files.join(', ')}`);

  if (duplicateIssueNumbers.length > 0) {
    throw new Error(`Duplicate newsletter issue numbers detected.\n${duplicateIssueNumbers.join('\n')}`);
  }

  if (missingDraftLinks.length > 0) {
    throw new Error(`Newsletter drafts reference missing article slugs.\n${missingDraftLinks.join('\n')}`);
  }

  const affiliateStatusMarkdown = await readFile(AFFILIATE_STATUS_PATH, 'utf8');
  const affiliateIntakeMarkdown = await readFile(AFFILIATE_INTAKE_PATH, 'utf8');
  const liveProgramsInStatusDoc = parseLiveProgramsFromStatusDoc(affiliateStatusMarkdown);
  const liveProgramsInIntakeDoc = parseLiveProgramsFromIntakeDoc(affiliateIntakeMarkdown);
  const missingFromIntake = getSortedSetDifference(liveProgramsInStatusDoc, liveProgramsInIntakeDoc);
  const missingFromStatus = getSortedSetDifference(liveProgramsInIntakeDoc, liveProgramsInStatusDoc);

  if (missingFromIntake.length > 0 || missingFromStatus.length > 0) {
    const issues = [];

    if (missingFromIntake.length > 0) {
      issues.push(`Live in status doc only: ${missingFromIntake.join(', ')}`);
    }

    if (missingFromStatus.length > 0) {
      issues.push(`Live in intake doc only: ${missingFromStatus.join(', ')}`);
    }

    throw new Error(`Affiliate live-status drift detected between ops docs.\n${issues.join('\n')}`);
  }

  console.log('Content integrity checks passed.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
