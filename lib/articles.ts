import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import { replaceAffiliateTokens } from './affiliate-links';

export const BLOG_DIR = path.join(process.cwd(), 'blog');
export const READ_TIME_PATTERN = /^\d+\s+min$/;
export const BRAND_AUTHOR_NAME = 'AI Security Brief';

export interface ArticleAuthor {
  name: string;
  role: string;
  profileUrl?: string;
  bio?: string;
}

export interface PrimarySource {
  url: string;
  title: string;
  date?: string;
  excerpt?: string;
}

export interface ArticleSummary {
  title: string;
  slug: string;
  date: string;
  author: ArticleAuthor;
  excerpt: string;
  category: string;
  featured: boolean;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  readTime: string;
  primarySources: PrimarySource[];
  fileName: string;
}

export interface ArticleDocument extends ArticleSummary {
  body: string;
  contentHtml: string;
  isPaywalled: boolean;
}

type ArticleEnvironment = Readonly<Record<string, string | undefined>>;
export type ArticleCacheSignature = Readonly<{
  sourceKey: string;
  affiliateKey: string;
}>;

function assertDateString(value: unknown, field: string, fileName: string): string {
  const normalisedValue = assertString(value, field, fileName);

  if (Number.isNaN(Date.parse(normalisedValue))) {
    throw new Error(`Expected "${field}" to be a valid date in ${fileName}.`);
  }

  return normalisedValue;
}

function assertString(value: unknown, field: string, fileName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Expected "${field}" to be a non-empty string in ${fileName}.`);
  }

  return value.trim();
}

function assertOptionalString(value: unknown, field: string, fileName: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  return assertString(value, field, fileName);
}

function assertBoolean(value: unknown, field: string, fileName: string): boolean {
  if (typeof value !== 'boolean') {
    throw new Error(`Expected "${field}" to be a boolean in ${fileName}.`);
  }

  return value;
}

function assertStringArray(value: unknown, field: string, fileName: string): string[] {
  if (!Array.isArray(value) || value.length === 0 || value.some((item) => typeof item !== 'string' || item.trim().length === 0)) {
    throw new Error(`Expected "${field}" to be a non-empty string array in ${fileName}.`);
  }

  return value.map((item) => item.trim());
}

function assertReadTime(value: unknown, field: string, fileName: string): string {
  const normalisedValue = assertString(value, field, fileName);

  if (!READ_TIME_PATTERN.test(normalisedValue)) {
    throw new Error(`Expected "${field}" to match "<minutes> min" in ${fileName}.`);
  }

  return normalisedValue;
}

function assertRecord(value: unknown, field: string, fileName: string): Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`Expected "${field}" to be an object in ${fileName}.`);
  }

  return value as Record<string, unknown>;
}

function assertHttpUrl(value: unknown, field: string, fileName: string): string {
  const normalisedValue = assertString(value, field, fileName);

  let parsed: URL;

  try {
    parsed = new URL(normalisedValue);
  } catch {
    throw new Error(`Expected "${field}" to be an http or https URL in ${fileName}.`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(`Expected "${field}" to be an http or https URL in ${fileName}.`);
  }

  return normalisedValue;
}

function assertAuthor(value: unknown, fileName: string): ArticleAuthor {
  const authorRecord = assertRecord(value, 'author', fileName);
  const name = assertString(authorRecord.name, 'author.name', fileName);
  const role = assertString(authorRecord.role, 'author.role', fileName);

  if (name === BRAND_AUTHOR_NAME) {
    throw new Error(`Expected "author.name" to be a named human, not ${BRAND_AUTHOR_NAME}, in ${fileName}.`);
  }

  const profileUrl = authorRecord.profileUrl === undefined
    ? undefined
    : assertHttpUrl(authorRecord.profileUrl, 'author.profileUrl', fileName);
  const bio = assertOptionalString(authorRecord.bio, 'author.bio', fileName);

  return {
    name,
    role,
    ...(profileUrl ? { profileUrl } : {}),
    ...(bio ? { bio } : {}),
  };
}

function assertPrimarySource(value: unknown, index: number, fileName: string): PrimarySource {
  const sourceRecord = assertRecord(value, `primarySources[${index}]`, fileName);
  const url = assertHttpUrl(sourceRecord.url, `primarySources[${index}].url`, fileName);
  const title = assertString(sourceRecord.title, `primarySources[${index}].title`, fileName);
  const date = assertOptionalString(sourceRecord.date, `primarySources[${index}].date`, fileName);
  const excerpt = assertOptionalString(sourceRecord.excerpt, `primarySources[${index}].excerpt`, fileName);

  return {
    url,
    title,
    ...(date ? { date } : {}),
    ...(excerpt ? { excerpt } : {}),
  };
}

function assertPrimarySources(value: unknown, fileName: string): PrimarySource[] {
  if (!Array.isArray(value)) {
    throw new Error(`Expected "primarySources" to be an array in ${fileName}.`);
  }

  if (value.length < 3) {
    throw new Error(`Expected "primarySources" to include at least 3 entries in ${fileName}.`);
  }

  return value.map((entry, index) => assertPrimarySource(entry, index, fileName));
}

async function renderMarkdown(markdown: string, title: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(markdown);

  return String(processed).replace(
    new RegExp(`^<h1>${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</h1>\\s*`),
    '',
  );
}

export async function parseArticleSource(fileName: string, source: string): Promise<ArticleDocument> {
  const { data, content } = matter(source);
  const title = assertString(data.title, 'title', fileName);
  const keywords = assertStringArray(data.keywords, 'keywords', fileName);
  const category = assertString(data.category, 'category', fileName);
  const isAffiliateEnabled = category !== 'AI Threats';
  
  const rawBody = content.trim();
  const paywallToken = '[beehiiv:paywall]';
  const isPaywalled = rawBody.includes(paywallToken);
  
  let freeContent = rawBody;
  if (isPaywalled) {
    freeContent = rawBody.split(paywallToken)[0].trim();
  }

  const resolvedBody = replaceAffiliateTokens(freeContent, isAffiliateEnabled ? process.env : {});
  const slug = assertString(data.slug, 'slug', fileName);
  const article = {
    title,
    slug,
    date: assertDateString(data.date, 'date', fileName),
    author: assertAuthor(data.author, fileName),
    excerpt: assertString(data.excerpt, 'excerpt', fileName),
    category,
    featured: assertBoolean(data.featured, 'featured', fileName),
    metaTitle: assertString(data.meta_title, 'meta_title', fileName),
    metaDescription: assertString(data.meta_description, 'meta_description', fileName),
    keywords,
    readTime: assertReadTime(data.read_time, 'read_time', fileName),
    primarySources: assertPrimarySources(data.primarySources, fileName),
    fileName,
    body: resolvedBody,
    contentHtml: await renderMarkdown(resolvedBody, title),
    isPaywalled,
  } satisfies ArticleDocument;

  return article;
}

async function parseArticleFile(blogDir: string, fileName: string): Promise<ArticleDocument> {
  const filePath = path.join(blogDir, fileName);
  const source = await fs.readFile(filePath, 'utf8');
  return parseArticleSource(fileName, source);
}

export async function getArticleSourceCacheKey(blogDir: string): Promise<string> {
  const entries = await fs.readdir(blogDir);
  const articleFiles = entries.filter((entry) => entry.endsWith('.md')).sort();
  const fingerprints = await Promise.all(articleFiles.map(async (fileName) => {
    const filePath = path.join(blogDir, fileName);
    const source = await fs.readFile(filePath, 'utf8');
    const digest = createHash('sha256').update(source).digest('hex');
    return `${fileName}:${digest}`;
  }));

  return fingerprints.join('\u0000');
}

function getAffiliateCacheKey(env: ArticleEnvironment = process.env): string {
  const affiliateEntries = Object.entries(env).reduce<Array<readonly [string, string]>>((entries, [key, value]) => {
    if (!key.startsWith('AFFILIATE_') || typeof value !== 'string') {
      return entries;
    }

    const normalizedValue = value.trim();
    if (normalizedValue.length > 0) {
      entries.push([key, normalizedValue]);
    }

    return entries;
  }, []);

  return affiliateEntries
    .sort(([leftKey], [rightKey]) => leftKey.localeCompare(rightKey))
    .map(([key, value]) => `${key}=${value}`)
    .join('\u0000');
}

export async function getArticleCacheSignature(
  blogDir: string,
  env: ArticleEnvironment = process.env,
): Promise<ArticleCacheSignature> {
  return {
    sourceKey: await getArticleSourceCacheKey(blogDir),
    affiliateKey: getAffiliateCacheKey(env),
  };
}

export function getArticleCacheKey(signature: ArticleCacheSignature): string {
  return `${signature.sourceKey}\u0000${signature.affiliateKey}`;
}

export async function loadArticlesFromDirectory(blogDir: string): Promise<ArticleDocument[]> {
  const entries = await fs.readdir(blogDir);
  const articleFiles = entries.filter((entry) => entry.endsWith('.md')).sort();
  const articles = await Promise.all(articleFiles.map((fileName) => parseArticleFile(blogDir, fileName)));
  const seenSlugs = new Set<string>();

  for (const article of articles) {
    if (seenSlugs.has(article.slug)) {
      throw new Error(`Duplicate slug "${article.slug}" detected in ${blogDir}.`);
    }

    seenSlugs.add(article.slug);
  }

  return articles.sort((left, right) => {
    const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
    return dateDiff !== 0 ? dateDiff : left.slug.localeCompare(right.slug);
  });
}

const getArticleDocuments = unstable_cache(
  async (articleCacheSignature: ArticleCacheSignature): Promise<ArticleDocument[]> => {
    void articleCacheSignature.sourceKey;
    void articleCacheSignature.affiliateKey;
    return loadArticlesFromDirectory(BLOG_DIR);
  },
  ['blog-articles'],
  { revalidate: false },
);

export const getAllArticles = cache(async (): Promise<ArticleSummary[]> => {
  const articleCacheSignature = await getArticleCacheSignature(BLOG_DIR);
  const articles = await getArticleDocuments(articleCacheSignature);
  return articles.map(({ body: _body, contentHtml: _contentHtml, ...summary }) => summary);
});

export const getArticleBySlug = cache(async (slug: string): Promise<ArticleDocument | null> => {
  const articleCacheSignature = await getArticleCacheSignature(BLOG_DIR);
  const articles = await getArticleDocuments(articleCacheSignature);
  return articles.find((article) => article.slug === slug) ?? null;
});

export async function getArticleCategories(): Promise<string[]> {
  const articles = await getAllArticles();
  return Array.from(new Set(articles.map((article) => article.category))).sort((left, right) =>
    left.localeCompare(right),
  );
}
