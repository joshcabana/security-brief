import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface ArticleOverrides {
  title?: string;
  slug?: string;
  date?: string;
  author?: string | {
    name?: string;
    role?: string;
    profileUrl?: string;
    bio?: string;
  };
  excerpt?: string;
  category?: string;
  featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  read_time?: string;
  section?: 'editorial' | 'review';
  monetization?: 'none' | 'affiliate';
  reviewed_by?: string;
  reviewed_at?: string;
  last_substantive_update_at?: string;
  primarySources?: Array<{
    url: string;
    title: string;
    date?: string;
    excerpt?: string;
  }>;
  body?: string;
}

type FrontmatterValue =
  | boolean
  | string
  | string[]
  | Record<string, string | undefined>
  | Array<Record<string, string | undefined>>;

function serialiseFrontmatterValue(value: FrontmatterValue, key: string, indentLevel = 0): string[] {
  const indent = '  '.repeat(indentLevel);
  const nestedIndent = '  '.repeat(indentLevel + 1);

  if (Array.isArray(value)) {
    if (value.length === 0 || typeof value[0] === 'string') {
      return [
        `${indent}${key}:`,
        ...(value as string[]).map((item) => `${nestedIndent}- ${JSON.stringify(item)}`),
      ];
    }

    const lines = [`${indent}${key}:`];

    for (const item of value as Array<Record<string, string | undefined>>) {
      const entries = Object.entries(item).filter(([, entryValue]) => typeof entryValue === 'string');
      const [firstKey, firstValue] = entries[0] ?? [];

      if (!firstKey || !firstValue) {
        continue;
      }

      lines.push(`${nestedIndent}- ${firstKey}: ${JSON.stringify(firstValue)}`);

      for (const [nestedKey, nestedValue] of entries.slice(1)) {
        lines.push(`${nestedIndent}  ${nestedKey}: ${JSON.stringify(nestedValue)}`);
      }
    }

    return lines;
  }

  if (typeof value === 'object' && value !== null) {
    const lines = [`${indent}${key}:`];

    for (const [nestedKey, nestedValue] of Object.entries(value)) {
      if (nestedValue === undefined) {
        continue;
      }

      lines.push(...serialiseFrontmatterValue(nestedValue, nestedKey, indentLevel + 1));
    }

    return lines;
  }

  if (typeof value === 'boolean') {
    return [`${indent}${key}: ${String(value)}`];
  }

  return [`${indent}${key}: ${JSON.stringify(value)}`];
}

export function buildArticleMarkdown(overrides: ArticleOverrides = {}): string {
  const frontmatter = {
    title: overrides.title ?? 'Example article title',
    slug: overrides.slug ?? 'example-article-title',
    date: overrides.date ?? '2026-03-10',
    author: overrides.author ?? {
      name: 'Josh Cabana',
      role: 'Editor & Publisher',
    },
    excerpt: overrides.excerpt ?? 'Example excerpt for testing.',
    category: overrides.category ?? 'AI Threats',
    featured: overrides.featured ?? false,
    meta_title: overrides.meta_title ?? 'Example article title | AI Security Brief',
    meta_description: overrides.meta_description ?? 'Example meta description for testing.',
    keywords: overrides.keywords ?? ['keyword one', 'keyword two', 'keyword three', 'keyword four', 'keyword five'],
    read_time: overrides.read_time ?? '6 min',
    section: overrides.section ?? 'editorial',
    monetization: overrides.monetization ?? 'none',
    reviewed_by: overrides.reviewed_by ?? 'PENDING_HUMAN_REVIEW',
    reviewed_at: overrides.reviewed_at ?? 'PENDING_HUMAN_REVIEW',
    last_substantive_update_at: overrides.last_substantive_update_at ?? (overrides.date ?? '2026-03-10'),
    primarySources: overrides.primarySources ?? [
      {
        url: 'https://example.com/source-one',
        title: 'Primary source one',
      },
      {
        url: 'https://example.com/source-two',
        title: 'Primary source two',
      },
      {
        url: 'https://example.com/source-three',
        title: 'Primary source three',
      },
    ],
  };
  const frontmatterLines = Object.entries(frontmatter).flatMap(([key, value]) => serialiseFrontmatterValue(value, key));

  return [
    '---',
    ...frontmatterLines,
    '---',
    '',
    `# ${frontmatter.title}`,
    '',
    overrides.body ?? 'Example body copy for article testing.',
    '',
  ].join('\n');
}

export async function createWorkspace(files: Array<{ fileName: string; source: string }>) {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), 'ai-security-brief-'));
  const blogDir = path.join(workspaceDir, 'blog');

  await mkdir(blogDir, { recursive: true });
  await mkdir(path.join(workspaceDir, 'reviews'), { recursive: true });
  await mkdir(path.join(workspaceDir, 'harvests'), { recursive: true });
  await mkdir(path.join(workspaceDir, 'drafts'), { recursive: true });

  for (const { fileName, source } of files) {
    await writeFile(path.join(blogDir, fileName), source, 'utf8');
  }

  return {
    workspaceDir,
    blogDir,
    async cleanup() {
      await rm(workspaceDir, { recursive: true, force: true });
    },
  };
}
