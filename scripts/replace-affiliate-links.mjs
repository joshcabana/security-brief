#!/usr/bin/env node

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

const root = process.cwd();
const blogDir = path.join(root, 'blog');
const draftsDir = path.join(root, 'drafts');
const tokenPattern = /\[AFFILIATE:([A-Z0-9]+)\]/g;
const writeMode = process.argv.includes('--write');
const includeDrafts = process.argv.includes('--include-drafts');
const supportedFlags = new Set(['--write', '--include-drafts']);

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatList(items) {
  return items.length === 0 ? 'none' : items.join(', ');
}

function getMappingCandidates() {
  const envPath = process.env.AFFILIATE_LINKS_PATH?.trim();
  const candidates = [];

  if (envPath) {
    candidates.push({
      absolutePath: path.isAbsolute(envPath) ? envPath : path.resolve(root, envPath),
      displayPath: envPath,
    });
  }

  candidates.push(
    {
      absolutePath: path.join(os.homedir(), '.ai-security-brief', 'affiliate-links.json'),
      displayPath: '~/.ai-security-brief/affiliate-links.json',
    },
    {
      absolutePath: path.join(root, 'ops', 'affiliate-links.json'),
      displayPath: 'ops/affiliate-links.json',
    },
  );

  return candidates;
}

async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
}

async function resolveMappingSource() {
  const candidates = getMappingCandidates();

  for (const candidate of candidates) {
    if (await fileExists(candidate.absolutePath)) {
      return candidate;
    }
  }

  throw new Error(
    `Missing affiliate link mapping. Checked ${candidates.map((candidate) => candidate.displayPath).join(', ')}.`,
  );
}

async function loadMappings() {
  const mappingSource = await resolveMappingSource();
  let raw;

  try {
    raw = await fs.readFile(mappingSource.absolutePath, 'utf8');
  } catch (error) {
    throw error;
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`Invalid ${mappingSource.displayPath}: ${detail}`);
  }

  assert(
    parsed && typeof parsed === 'object' && !Array.isArray(parsed),
    `Invalid ${mappingSource.displayPath}: expected a JSON object mapping affiliate codes to URLs.`,
  );

  for (const [key, value] of Object.entries(parsed)) {
    assert(typeof value === 'string', `Invalid ${mappingSource.displayPath}: expected "${key}" to map to a string.`);
  }

  return {
    mappings: parsed,
    mappingSource,
  };
}

async function loadMarkdownFiles(directoryPath, options = { required: false }) {
  let stats;
  try {
    stats = await fs.stat(directoryPath);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      if (options.required) {
        throw new Error('Missing blog directory. Expected blog/*.md files under the current workspace.');
      }

      return [];
    }

    throw error;
  }

  if (!stats.isDirectory()) {
    if (options.required) {
      throw new Error('Missing blog directory. Expected blog/*.md files under the current workspace.');
    }

    return [];
  }

  const entries = await fs.readdir(directoryPath);
  const relativeDirectory = path.relative(root, directoryPath);

  return entries
    .filter((entry) => entry.endsWith('.md'))
    .sort()
    .map((entry) => ({
      absolutePath: path.join(directoryPath, entry),
      relativePath: path.join(relativeDirectory, entry),
    }));
}

async function loadTargetFiles() {
  const blogFiles = await loadMarkdownFiles(blogDir, { required: true });
  const draftFiles = includeDrafts ? await loadMarkdownFiles(draftsDir, { required: false }) : [];
  return [...blogFiles, ...draftFiles];
}

async function processFile(fileInfo, mappings) {
  const source = await fs.readFile(fileInfo.absolutePath, 'utf8');
  const matches = Array.from(source.matchAll(tokenPattern));

  if (matches.length === 0) {
    return {
      ...fileInfo,
      found: 0,
      replaced: 0,
      skipped: 0,
      tokens: [],
      source,
      nextSource: source,
    };
  }

  let replaced = 0;
  let skipped = 0;
  const tokens = matches.map((match) => match[1]);
  const nextSource = source.replaceAll(tokenPattern, (fullMatch, code) => {
    const replacement = mappings[code];
    if (typeof replacement !== 'string' || replacement.trim() === '') {
      skipped += 1;
      return fullMatch;
    }

    replaced += 1;
    return replacement;
  });

  return {
    ...fileInfo,
    found: matches.length,
    replaced,
    skipped,
    tokens,
    source,
    nextSource,
  };
}

async function main() {
  const unsupportedFlags = process.argv.slice(2).filter((flag) => !supportedFlags.has(flag));
  assert(unsupportedFlags.length === 0, `Usage: node scripts/replace-affiliate-links.mjs [--write] [--include-drafts]\nUnsupported flag(s): ${unsupportedFlags.join(', ')}`);

  const { mappings, mappingSource } = await loadMappings();
  const files = await loadTargetFiles();

  let tokensFound = 0;
  let tokensReplaced = 0;
  let tokensSkipped = 0;

  console.log(writeMode ? 'Affiliate replacement mode: write' : 'Affiliate replacement mode: dry-run');
  console.log(`Affiliate replacement scope: ${includeDrafts ? 'blog + drafts' : 'blog only'}`);
  console.log(`Affiliate mapping source: ${mappingSource.displayPath}`);

  for (const fileInfo of files) {
    const result = await processFile(fileInfo, mappings);
    tokensFound += result.found;
    tokensReplaced += result.replaced;
    tokensSkipped += result.skipped;

    if (result.found === 0) {
      continue;
    }

    console.log(`\n${result.relativePath}`);
    console.log(`  tokens: ${formatList(result.tokens)}`);
    console.log(`  found: ${result.found}`);
    console.log(`  replaceable: ${result.replaced}`);
    console.log(`  skipped: ${result.skipped}`);

    if (writeMode && result.replaced > 0 && result.nextSource !== result.source) {
      await fs.writeFile(result.absolutePath, result.nextSource, 'utf8');
      console.log('  wrote: yes');
    } else {
      console.log(`  wrote: ${writeMode ? 'no' : 'dry-run'}`);
    }
  }

  console.log('\nSummary');
  console.log(`  files scanned: ${files.length}`);
  console.log(`  tokens found: ${tokensFound}`);
  console.log(`  tokens replaced: ${tokensReplaced}`);
  console.log(`  tokens skipped: ${tokensSkipped}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
