import { unstable_cache } from 'next/cache';
import { cache } from 'react';
import { createHash } from 'node:crypto';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { remark } from 'remark';
import remarkGfm from 'remark-gfm';
import remarkHtml from 'remark-html';
import sanitizeHtml from 'sanitize-html';
import { replaceAffiliateTokens } from './affiliate-links';
import { getArticleTrustEntryMap, type TrustLevel } from './article-trust';
import { normalizeLinkTarget } from './url-safety.mjs';

export const BLOG_DIR = path.join(process.cwd(), 'blog');
export const REVIEWS_DIR = path.join(process.cwd(), 'reviews');
export const READ_TIME_PATTERN = /^\d+\s+min$/;
export const BRAND_AUTHOR_NAME = 'AI Security Brief';
export const ARTICLE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
export const CONTENT_SECTION_VALUES = ['editorial', 'review'] as const;
export const MONETIZATION_VALUES = ['none', 'affiliate'] as const;
export const PENDING_HUMAN_REVIEW = 'PENDING_HUMAN_REVIEW';

type ContentSection = (typeof CONTENT_SECTION_VALUES)[number];
type MonetizationMode = (typeof MONETIZATION_VALUES)[number];
type ArticleEnvironment = Readonly<Record<string, string | undefined>>;

export type ArticleCacheSignature = Readonly<{
  sourceKey: string;
  affiliateKey: string;
}>;

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
  section: ContentSection;
  monetization: MonetizationMode;
  reviewedBy: string;
  reviewedAt: string;
  lastSubstantiveUpdateAt: string;
  routePath: string;
  trustScore?: number;
  trustLevel?: TrustLevel;
}

export interface ArticleDocument extends ArticleSummary {
  body: string;
  contentHtml: string;
  isPaywalled: boolean;
}

function assertDateString(value: unknown, field: string, fileName: string): string {
  const normalisedValue = assertString(value, field, fileName);

  if (Number.isNaN(Date.parse(normalisedValue))) {
    throw new Error(`Expected "${field}" to be a valid date in ${fileName}.`);
  }

  return normalisedValue;
}

function assertDateOrPending(value: unknown, field: string, fileName: string): string {
  const normalisedValue = assertString(value, field, fileName);

  if (normalisedValue === PENDING_HUMAN_REVIEW) {
    return normalisedValue;
  }

  if (Number.isNaN(Date.parse(normalisedValue))) {
    throw new Error(`Expected "${field}" to be an ISO timestamp or ${PENDING_HUMAN_REVIEW} in ${fileName}.`);
  }

  return normalisedValue;
}

function assertString(value: unknown, field: string, fileName: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Expected "${field}" to be a non-empty string in ${fileName}.`);
  }

  return value.trim();
}

function assertSlug(value: unknown, field: string, fileName: string): string {
  const normalizedValue = assertString(value, field, fileName);

  if (!ARTICLE_SLUG_PATTERN.test(normalizedValue)) {
    throw new Error(`Expected "${field}" to contain only lowercase letters, numbers, and hyphens in ${fileName}.`);
  }

  return normalizedValue;
}

function stripHtmlToPlainText(value: string): string {
  return value
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function assertPlainText(value: unknown, field: string, fileName: string): string {
  const normalizedValue = stripHtmlToPlainText(assertString(value, field, fileName));

  if (!normalizedValue) {
    throw new Error(`Expected "${field}" to contain plain text in ${fileName}.`);
  }

  return normalizedValue;
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

  return value.map((item) => assertPlainText(item, field, fileName));
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

function assertEnum<T extends readonly string[]>(
  value: unknown,
  field: string,
  fileName: string,
  allowedValues: T,
): T[number] {
  const normalisedValue = assertString(value, field, fileName);

  if (!allowedValues.includes(normalisedValue)) {
    throw new Error(`Expected "${field}" to be one of ${allowedValues.join(', ')} in ${fileName}.`);
  }

  return normalisedValue as T[number];
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
  const name = assertPlainText(authorRecord.name, 'author.name', fileName);
  const role = assertPlainText(authorRecord.role, 'author.role', fileName);

  if (name === BRAND_AUTHOR_NAME) {
    throw new Error(`Expected "author.name" to be a named human, not ${BRAND_AUTHOR_NAME}, in ${fileName}.`);
  }

  const profileUrl = authorRecord.profileUrl === undefined
    ? undefined
    : assertHttpUrl(authorRecord.profileUrl, 'author.profileUrl', fileName);
  const bio = authorRecord.bio === undefined
    ? undefined
    : assertPlainText(authorRecord.bio, 'author.bio', fileName);

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
  const title = assertPlainText(sourceRecord.title, `primarySources[${index}].title`, fileName);
  const date = assertOptionalString(sourceRecord.date, `primarySources[${index}].date`, fileName);
  const excerpt = sourceRecord.excerpt === undefined
    ? undefined
    : assertPlainText(sourceRecord.excerpt, `primarySources[${index}].excerpt`, fileName);

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

function getArticleRoutePath(section: ContentSection, slug: string): string {
  return section === 'review' ? `/reviews/${slug}` : `/blog/${slug}`;
}

async function renderMarkdown(markdown: string, title: string): Promise<string> {
  const processed = await remark()
    .use(remarkGfm)
    .use(remarkHtml)
    .process(markdown);

  const sanitizedHtml = sanitizeHtml(String(processed), {
    allowedTags: [
      'a',
      'blockquote',
      'br',
      'code',
      'em',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'hr',
      'li',
      'ol',
      'p',
      'pre',
      'span',
      'strong',
      'table',
      'tbody',
      'td',
      'th',
      'thead',
      'tr',
      'ul',
    ],
    allowedAttributes: {
      a: ['href', 'rel'],
    },
    allowedSchemes: ['http', 'https'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    transformTags: {
      a: (_tagName: string, attribs: Record<string, string>) => {
        const safeHref = normalizeLinkTarget(attribs.href, {
          allowRelative: true,
          requireHttps: true,
        });

        if (!safeHref) {
          return {
            tagName: 'span',
            attribs: {},
          };
        }

        return {
          tagName: 'a',
          attribs: { href: safeHref, rel: 'noopener noreferrer nofollow' },
        };
      },
    },
  });

  void title;

  return sanitizedHtml.replace(/^<h1[^>]*>[\s\S]*?<\/h1>\s*/i, '');
}

function attachTrustMetadata(article: ArticleDocument, trustEntry?: { trustScore: number; trustLevel: TrustLevel }): ArticleDocument {
  if (!trustEntry) {
    return article;
  }

  return {
    ...article,
    trustScore: trustEntry.trustScore,
    trustLevel: trustEntry.trustLevel,
  };
}

export async function parseArticleSource(fileName: string, source: string): Promise<ArticleDocument> {
  const { data, content } = matter(source);
  const title = assertPlainText(data.title, 'title', fileName);
  const keywords = assertStringArray(data.keywords, 'keywords', fileName);
  const category = assertPlainText(data.category, 'category', fileName);
  const section = assertEnum(data.section, 'section', fileName, CONTENT_SECTION_VALUES);
  const monetization = assertEnum(data.monetization, 'monetization', fileName, MONETIZATION_VALUES);
  const reviewedBy = assertPlainText(data.reviewed_by, 'reviewed_by', fileName);
  const reviewedAt = assertDateOrPending(data.reviewed_at, 'reviewed_at', fileName);
  const lastSubstantiveUpdateAt = assertDateString(
    data.last_substantive_update_at,
    'last_substantive_update_at',
    fileName,
  );

  if (section === 'editorial' && monetization !== 'none') {
    throw new Error(`Expected editorial content to use monetization "none" in ${fileName}.`);
  }

  const rawBody = content.trim();
  const paywallToken = '[beehiiv:paywall]';
  const isPaywalled = rawBody.includes(paywallToken);

  let freeContent = rawBody;
  if (isPaywalled) {
    freeContent = rawBody.split(paywallToken)[0].trim();
  }

  const resolvedBody = replaceAffiliateTokens(freeContent, monetization === 'affiliate' ? process.env : {});
  const slug = assertSlug(data.slug, 'slug', fileName);

  return {
    title,
    slug,
    date: assertDateString(data.date, 'date', fileName),
    author: assertAuthor(data.author, fileName),
    excerpt: assertPlainText(data.excerpt, 'excerpt', fileName),
    category,
    featured: assertBoolean(data.featured, 'featured', fileName),
    metaTitle: assertPlainText(data.meta_title, 'meta_title', fileName),
    metaDescription: assertPlainText(data.meta_description, 'meta_description', fileName),
    keywords,
    readTime: assertReadTime(data.read_time, 'read_time', fileName),
    primarySources: assertPrimarySources(data.primarySources, fileName),
    fileName,
    section,
    monetization,
    reviewedBy,
    reviewedAt,
    lastSubstantiveUpdateAt,
    routePath: getArticleRoutePath(section, slug),
    body: resolvedBody,
    contentHtml: await renderMarkdown(resolvedBody, title),
    isPaywalled,
  } satisfies ArticleDocument;
}

async function parseArticleFile(contentDir: string, fileName: string): Promise<ArticleDocument> {
  const filePath = path.join(contentDir, fileName);
  const source = await fs.readFile(filePath, 'utf8');
  return parseArticleSource(fileName, source);
}

async function getDirectorySourceCacheKey(contentDir: string): Promise<string> {
  try {
    const entries = await fs.readdir(contentDir);
    const articleFiles = entries.filter((entry) => entry.endsWith('.md')).sort();
    const fingerprints = await Promise.all(articleFiles.map(async (fileName) => {
      const filePath = path.join(contentDir, fileName);
      const source = await fs.readFile(filePath, 'utf8');
      const digest = createHash('sha256').update(source).digest('hex');
      return `${path.basename(contentDir)}/${fileName}:${digest}`;
    }));

    return fingerprints.join('\u0000');
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return '';
    }

    throw error;
  }
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

export async function getArticleSourceCacheKey(contentDir: string): Promise<string> {
  return getDirectorySourceCacheKey(contentDir);
}

function resolveArticleCacheInputs(
  contentDirOrEnv?: string | readonly string[] | ArticleEnvironment,
  maybeEnv?: ArticleEnvironment,
): Readonly<{
  contentDirs: readonly string[];
  env: ArticleEnvironment;
}> {
  if (typeof contentDirOrEnv === 'string') {
    return {
      contentDirs: [contentDirOrEnv],
      env: maybeEnv ?? process.env,
    };
  }

  if (Array.isArray(contentDirOrEnv)) {
    return {
      contentDirs: contentDirOrEnv,
      env: maybeEnv ?? process.env,
    };
  }

  return {
    contentDirs: [BLOG_DIR, REVIEWS_DIR],
    env: (contentDirOrEnv ?? process.env) as ArticleEnvironment,
  };
}

export async function getArticleCacheSignature(
  contentDirOrEnv?: string | readonly string[] | ArticleEnvironment,
  maybeEnv?: ArticleEnvironment,
): Promise<ArticleCacheSignature> {
  const { contentDirs, env } = resolveArticleCacheInputs(contentDirOrEnv, maybeEnv);

  return {
    sourceKey: (await Promise.all(contentDirs.map((contentDir) => getDirectorySourceCacheKey(contentDir)))).join('\u0000'),
    affiliateKey: getAffiliateCacheKey(env),
  };
}

export function getArticleCacheKey(signature: ArticleCacheSignature): string {
  return `${signature.sourceKey}\u0000${signature.affiliateKey}`;
}

export async function loadArticlesFromDirectory(contentDir: string): Promise<ArticleDocument[]> {
  let entries: string[];

  try {
    entries = await fs.readdir(contentDir);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }

  const articleFiles = entries.filter((entry) => entry.endsWith('.md')).sort();
  const articles = await Promise.all(articleFiles.map((fileName) => parseArticleFile(contentDir, fileName)));
  const seenSlugs = new Set<string>();

  for (const article of articles) {
    if (seenSlugs.has(article.slug)) {
      throw new Error(`Duplicate slug "${article.slug}" detected in ${contentDir}.`);
    }

    seenSlugs.add(article.slug);
  }

  return articles.sort((left, right) => {
    const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
    return dateDiff !== 0 ? dateDiff : left.slug.localeCompare(right.slug);
  });
}

async function loadAllContentDocuments(): Promise<ArticleDocument[]> {
  const [editorialArticles, reviewArticles] = await Promise.all([
    loadArticlesFromDirectory(BLOG_DIR),
    loadArticlesFromDirectory(REVIEWS_DIR),
  ]);
  const seenSlugs = new Set<string>();

  for (const article of [...editorialArticles, ...reviewArticles]) {
    if (seenSlugs.has(article.slug)) {
      throw new Error(`Duplicate slug "${article.slug}" detected across blog/ and reviews/.`);
    }

    seenSlugs.add(article.slug);
  }

  return [...editorialArticles, ...reviewArticles].sort((left, right) => {
    const dateDiff = new Date(right.date).getTime() - new Date(left.date).getTime();
    return dateDiff !== 0 ? dateDiff : left.slug.localeCompare(right.slug);
  });
}

const getArticleDocuments = unstable_cache(
  async (_articleCacheSignature: ArticleCacheSignature): Promise<ArticleDocument[]> => loadAllContentDocuments(),
  ['content-documents'],
  { revalidate: false },
);

async function getDocumentsWithTrust(): Promise<ArticleDocument[]> {
  const [articleCacheSignature, trustEntryMap] = await Promise.all([
    getArticleCacheSignature(),
    getArticleTrustEntryMap(),
  ]);
  const documents = await getArticleDocuments(articleCacheSignature);

  return documents.map((article) => attachTrustMetadata(article, trustEntryMap.get(article.slug)));
}

function stripDocumentContent(article: ArticleDocument): ArticleSummary {
  const { body: _body, contentHtml: _contentHtml, isPaywalled: _isPaywalled, ...summary } = article;
  return summary;
}

export const getAllPublicArticles = cache(async (): Promise<ArticleSummary[]> => {
  const articles = await getDocumentsWithTrust();
  return articles.map(stripDocumentContent);
});

export const getAllArticles = cache(async (): Promise<ArticleSummary[]> => {
  const articles = await getDocumentsWithTrust();
  return articles
    .filter((article) => article.section === 'editorial')
    .map(stripDocumentContent);
});

export const getAllReviewArticles = cache(async (): Promise<ArticleSummary[]> => {
  const articles = await getDocumentsWithTrust();
  return articles
    .filter((article) => article.section === 'review')
    .map(stripDocumentContent);
});

export const getArticleBySlug = cache(async (slug: string): Promise<ArticleDocument | null> => {
  const articles = await getDocumentsWithTrust();
  return articles.find((article) => article.section === 'editorial' && article.slug === slug) ?? null;
});

export const getReviewBySlug = cache(async (slug: string): Promise<ArticleDocument | null> => {
  const articles = await getDocumentsWithTrust();
  return articles.find((article) => article.section === 'review' && article.slug === slug) ?? null;
});

export async function getArticleCategories(section: ContentSection = 'editorial'): Promise<string[]> {
  const articles = section === 'review' ? await getAllReviewArticles() : await getAllArticles();
  return Array.from(new Set(articles.map((article) => article.category))).sort((left, right) =>
    left.localeCompare(right),
  );
}
