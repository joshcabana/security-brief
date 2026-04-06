import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';

const root = process.cwd();
const blogDir = path.join(root, 'blog');
const manifestPath = path.join(root, 'content-manifest.json');
const requiredFields = [
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
];
const readTimePattern = /^\d+\s+min$/;

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNonEmptyString(value, field, fileName) {
  assert(typeof value === 'string' && value.trim().length > 0, `Expected "${field}" to be a non-empty string in ${fileName}.`);
  return value.trim();
}

function assertValidDate(value, field, fileName) {
  const normalisedValue = assertNonEmptyString(value, field, fileName);
  assert(!Number.isNaN(Date.parse(normalisedValue)), `Expected "${field}" to be a valid date in ${fileName}.`);
  return normalisedValue;
}

async function buildManifest() {
  const entries = (await fs.readdir(blogDir))
    .filter((entry) => entry.endsWith('.md'))
    .sort();

  const articles = [];
  const seenSlugs = new Set();

  for (const fileName of entries) {
    const source = await fs.readFile(path.join(blogDir, fileName), 'utf8');
    const { data, content } = matter(source);

    for (const field of requiredFields) {
      assert(field in data, `Missing "${field}" in ${fileName}.`);
    }

    const slug = assertNonEmptyString(data.slug, 'slug', fileName);
    assert(!seenSlugs.has(slug), `Duplicate slug "${slug}" detected in ${fileName}.`);
    seenSlugs.add(slug);
    assert(typeof data.featured === 'boolean', `Expected featured to be a boolean in ${fileName}.`);
    assert(
      Array.isArray(data.keywords) && data.keywords.length === 5 && data.keywords.every((item) => typeof item === 'string' && item.trim().length > 0),
      `Expected exactly 5 keywords in ${fileName}.`,
    );
    assert(readTimePattern.test(assertNonEmptyString(data.read_time, 'read_time', fileName)), `Expected "read_time" to match "<minutes> min" in ${fileName}.`);
    assert(content.trim().length > 0, `Expected markdown body content in ${fileName}.`);

    articles.push({
      title: assertNonEmptyString(data.title, 'title', fileName),
      slug,
      date: assertValidDate(data.date, 'date', fileName),
      author: assertNonEmptyString(data.author, 'author', fileName),
      excerpt: assertNonEmptyString(data.excerpt, 'excerpt', fileName),
      category: assertNonEmptyString(data.category, 'category', fileName),
      featured: data.featured,
      metaTitle: assertNonEmptyString(data.meta_title, 'meta_title', fileName),
      metaDescription: assertNonEmptyString(data.meta_description, 'meta_description', fileName),
      keywords: data.keywords.map((item) => item.trim()),
      readTime: data.read_time.trim(),
      fileName,
    });
  }

  articles.sort((left, right) => {
    const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
    return dateDiff !== 0 ? dateDiff : left.slug.localeCompare(right.slug);
  });

  for (const requiredDir of ['harvests', 'drafts']) {
    const stats = await fs.stat(path.join(root, requiredDir));
    assert(stats.isDirectory(), `Expected ${requiredDir}/ to exist.`);
  }

  return {
    articleCount: articles.length,
    categories: Array.from(new Set(articles.map((article) => article.category))).sort(),
    articles,
  };
}

async function main() {
  const mode = process.argv[2];
  const manifest = await buildManifest();
  const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`;

  if (mode === '--write') {
    await fs.writeFile(manifestPath, manifestJson, 'utf8');
    console.log(`Wrote ${path.relative(root, manifestPath)}.`);
    return;
  }

  if (mode === '--check') {
    const existing = await fs.readFile(manifestPath, 'utf8');
    assert(existing === manifestJson, 'content-manifest.json is out of date. Run `pnpm content:manifest`.');
    console.log('Content manifest is in sync.');
    return;
  }

  throw new Error('Usage: node scripts/content-manifest.mjs --write|--check');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
