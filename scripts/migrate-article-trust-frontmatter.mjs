#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import {
  dedupePrimarySources,
  extractPrimarySourcesFromReferences,
  normaliseExistingAuthor,
  normaliseExistingPrimarySources,
  renderYamlFrontmatter,
} from './article-trust.mjs';

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, 'blog');
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
];

function buildOrderedFrontmatter(data, body, fileName) {
  const existingPrimarySources = normaliseExistingPrimarySources(data.primarySources, fileName);
  const harvestedPrimarySources = extractPrimarySourcesFromReferences(body);
  const primarySources = dedupePrimarySources([...existingPrimarySources, ...harvestedPrimarySources]);

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
  };

  for (const [key, value] of Object.entries(data)) {
    if (ORDERED_FIELDS.includes(key)) {
      continue;
    }

    orderedFrontmatter[key] = value;
  }

  return orderedFrontmatter;
}

async function migrateArticle(fileName) {
  const filePath = path.join(BLOG_DIR, fileName);
  const source = await fs.readFile(filePath, 'utf8');
  const nextSource = migrateArticleSource(source, fileName);
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

export function migrateArticleSource(source, fileName) {
  const parsed = matter(source);
  const body = parsed.content.replace(/^\n+/, '');
  const frontmatter = buildOrderedFrontmatter(parsed.data, body, fileName);

  return `${renderYamlFrontmatter(frontmatter)}${body.replace(/\s+$/, '')}\n`;
}

async function main() {
  const fileNames = (await fs.readdir(BLOG_DIR))
    .filter((entry) => entry.endsWith('.md'))
    .sort((left, right) => left.localeCompare(right));
  const results = [];

  for (const fileName of fileNames) {
    results.push(await migrateArticle(fileName));
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
