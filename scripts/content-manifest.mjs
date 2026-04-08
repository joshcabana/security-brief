import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import {
  calculateTrustScore,
  deriveTrustLevel,
  loadEditorialAttestationMap,
  MINIMUM_EDITORIAL_TRUST_SCORE,
  PENDING_HUMAN_REVIEW,
  validateAuthorObject,
  validatePrimarySources,
} from './article-trust.mjs';

const root = process.cwd();
const blogDir = path.join(root, 'blog');
const reviewsDir = path.join(root, 'reviews');
const manifestPath = path.join(root, 'content-manifest.json');
const attestationDir = path.join(root, '.editorial', 'reviews');
const articleTrustPath = path.join(root, 'artifacts', 'article-trust.json');
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
  'primarySources',
  'section',
  'monetization',
  'reviewed_by',
  'reviewed_at',
  'last_substantive_update_at',
];
const readTimePattern = /^\d+\s+min$/;
const contentDirectories = [
  { directory: blogDir, section: 'editorial' },
  { directory: reviewsDir, section: 'review' },
];

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

async function readTrustArtifact() {
  try {
    return JSON.parse(await fs.readFile(articleTrustPath, 'utf8'));
  } catch {
    return null;
  }
}

async function readMarkdownEntries(directoryPath) {
  try {
    return (await fs.readdir(directoryPath))
      .filter((entry) => entry.endsWith('.md'))
      .sort();
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

async function buildManifest() {
  const [attestationMap, trustArtifact] = await Promise.all([
    loadEditorialAttestationMap(attestationDir),
    readTrustArtifact(),
  ]);
  const trustEntryMap = new Map((trustArtifact?.entries ?? []).map((entry) => [entry.slug, entry]));
  const articles = [];
  const seenSlugs = new Set();

  for (const { directory, section } of contentDirectories) {
    const entries = await readMarkdownEntries(directory);

    for (const fileName of entries) {
      const source = await fs.readFile(path.join(directory, fileName), 'utf8');
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

      const contentSection = assertNonEmptyString(data.section, 'section', fileName);
      const monetization = assertNonEmptyString(data.monetization, 'monetization', fileName);
      assert(contentSection === section, `Expected "${fileName}" to use section "${section}".`);
      assert(['none', 'affiliate'].includes(monetization), `Expected "monetization" to be "none" or "affiliate" in ${fileName}.`);
      if (section === 'editorial') {
        assert(monetization === 'none', `Expected editorial article ${fileName} to set monetization to "none".`);
      }

      const reviewedBy = assertNonEmptyString(data.reviewed_by, 'reviewed_by', fileName);
      const reviewedAt = assertNonEmptyString(data.reviewed_at, 'reviewed_at', fileName);
      const lastSubstantiveUpdateAt = assertValidDate(
        data.last_substantive_update_at,
        'last_substantive_update_at',
        fileName,
      );

      const attestation = attestationMap.get(slug);
      const trustEntry = trustEntryMap.get(slug);
      const primarySources = validatePrimarySources(data.primarySources, fileName);
      const verifiedPrimarySources = trustEntry?.verifiedPrimarySources ?? primarySources.length;
      const humanAttestationPresent = Boolean(attestation);
      const iocsVerified = trustEntry?.iocsVerified ?? false;
      const correctionsCount = trustEntry?.correctionsCount ?? 0;
      const trustScore = trustEntry?.trustScore ?? calculateTrustScore({
        verifiedPrimarySources,
        primarySources: primarySources.length,
        iocsVerified,
        humanAttestationPresent,
        correctionsCount,
      });
      const blockingFailures = trustEntry?.blockingFailures ?? (
        section === 'editorial' && (
          reviewedBy === PENDING_HUMAN_REVIEW ||
          reviewedAt === PENDING_HUMAN_REVIEW ||
          !humanAttestationPresent ||
          trustScore < MINIMUM_EDITORIAL_TRUST_SCORE
        )
          ? ['Editorial review gate is still pending.']
          : []
      );

      articles.push({
        title: assertNonEmptyString(data.title, 'title', fileName),
        slug,
        date: assertValidDate(data.date, 'date', fileName),
        author: validateAuthorObject(data.author, fileName),
        excerpt: assertNonEmptyString(data.excerpt, 'excerpt', fileName),
        category: assertNonEmptyString(data.category, 'category', fileName),
        featured: data.featured,
        metaTitle: assertNonEmptyString(data.meta_title, 'meta_title', fileName),
        metaDescription: assertNonEmptyString(data.meta_description, 'meta_description', fileName),
        keywords: data.keywords.map((item) => item.trim()),
        readTime: data.read_time.trim(),
        primarySources,
        fileName,
        section,
        monetization,
        reviewedBy,
        reviewedAt,
        lastSubstantiveUpdateAt,
        reviewedAtPending: reviewedAt === PENDING_HUMAN_REVIEW,
        trustScore,
        trustLevel: trustEntry?.trustLevel ?? deriveTrustLevel(trustScore, blockingFailures),
        routePath: section === 'review' ? `/reviews/${slug}` : `/blog/${slug}`,
      });
    }
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
    sections: Array.from(new Set(articles.map((article) => article.section))).sort(),
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
