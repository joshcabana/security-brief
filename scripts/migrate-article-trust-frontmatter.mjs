#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import {
  PENDING_HUMAN_REVIEW,
  dedupePrimarySources,
  extractPrimarySourcesFromReferences,
  normaliseExistingAuthor,
  normaliseExistingPrimarySources,
  renderYamlFrontmatter,
} from './article-trust.mjs';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');
const REVIEWS_DIR = path.join(ROOT, 'reviews');
const ORDERED_FIELDS = [
  'title',
  'slug',
  'date',
  'author',
  'excerpt',
  'category',
  'featured',
  'meta_title',
  'meta_description',
  'keywords',
  'read_time',
  'primarySources',
  'section',
  'monetization',
  'reviewed_by',
  'reviewed_at',
  'last_substantive_update_at',
];

function resolveSectionDefaults(section, data) {
  return {
    section,
    monetization: data.monetization ?? (section === 'review' ? 'affiliate' : 'none'),
  };
}

function buildOrderedFrontmatter(data, body, fileName, section) {
  const existingPrimarySources = normaliseExistingPrimarySources(data.primarySources, fileName);
  const harvestedPrimarySources = extractPrimarySourcesFromReferences(body);
  const primarySources = dedupePrimarySources([...existingPrimarySources, ...harvestedPrimarySources]);
  const sectionDefaults = resolveSectionDefaults(section, data);
  const lastSubstantiveUpdateAt = data.last_substantive_update_at ?? data.date;

  const orderedFrontmatter = {
    title: data.title,
    slug: data.slug,
    date: data.date,
    author: normaliseExistingAuthor(data.author, fileName),
    excerpt: data.excerpt,
    category: data.category,
    featured: data.featured,
    meta_title: data.meta_title,
    meta_description: data.meta_description,
    keywords: data.keywords,
    read_time: data.read_time,
    primarySources,
    section: sectionDefaults.section,
    monetization: sectionDefaults.monetization,
    reviewed_by: data.reviewed_by ?? PENDING_HUMAN_REVIEW,
    reviewed_at: data.reviewed_at ?? PENDING_HUMAN_REVIEW,
    last_substantive_update_at: lastSubstantiveUpdateAt,
  };

  for (const [key, value] of Object.entries(data)) {
    if (ORDERED_FIELDS.includes(key)) {
      continue;
    }

    orderedFrontmatter[key] = value;
  }

  return orderedFrontmatter;
}

async function migrateArticle(directory, fileName, section) {
  const filePath = path.join(directory, fileName);
  const source = await fs.readFile(filePath, 'utf8');
  const nextSource = migrateArticleSource(source, fileName, section);
  const frontmatter = matter(nextSource).data;
  const primarySourceCount = Array.isArray(frontmatter.primarySources)
    ? frontmatter.primarySources.length
    : 0;

  if (nextSource === source) {
    return { fileName, changed: false, primarySourceCount };
  }

  await fs.writeFile(filePath, nextSource, 'utf8');
  return { fileName, changed: true, primarySourceCount };
}

export function migrateArticleSource(source, fileName, section = 'editorial') {
  const parsed = matter(source);
  const body = parsed.content.replace(/^\n+/, '');
  const frontmatter = buildOrderedFrontmatter(parsed.data, body, fileName, section);

  return `${renderYamlFrontmatter(frontmatter)}${body.replace(/\s+$/, '')}\n`;
}

async function readMarkdownEntries(directory) {
  try {
    return (await fs.readdir(directory))
      .filter((entry) => entry.endsWith('.md'))
      .sort((left, right) => left.localeCompare(right));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function main() {
  const results = [];
  const directories = [
    { directory: BLOG_DIR, section: 'editorial' },
    { directory: REVIEWS_DIR, section: 'review' },
  ];

  for (const { directory, section } of directories) {
    const fileNames = await readMarkdownEntries(directory);

    for (const fileName of fileNames) {
      results.push(await migrateArticle(directory, fileName, section));
    }
  }

  const changedCount = results.filter((result) => result.changed).length;

  console.log(JSON.stringify({
    checkedAt: new Date().toISOString(),
    articleCount: results.length,
    changedCount,
    results,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
