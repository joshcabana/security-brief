import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

interface ArticleOverrides {
  title?: string;
  slug?: string;
  date?: string;
  author?: string;
  excerpt?: string;
  category?: string;
  featured?: boolean;
  meta_title?: string;
  meta_description?: string;
  keywords?: string[];
  read_time?: string;
  body?: string;
}

function serialiseFrontmatterValue(value: boolean | string | string[]): string | string[] {
  if (Array.isArray(value)) {
    return value.map((item) => `  - ${JSON.stringify(item)}`);
  }

  if (typeof value === 'boolean') {
    return String(value);
  }

  return JSON.stringify(value);
}

export function buildArticleMarkdown(overrides: ArticleOverrides = {}): string {
  const frontmatter = {
    title: overrides.title ?? 'Example article title',
    slug: overrides.slug ?? 'example-article-title',
    date: overrides.date ?? '2026-03-10',
    author: overrides.author ?? 'AI Security Brief',
    excerpt: overrides.excerpt ?? 'Example excerpt for testing.',
    category: overrides.category ?? 'AI Threats',
    featured: overrides.featured ?? false,
    meta_title: overrides.meta_title ?? 'Example article title | AI Security Brief',
    meta_description: overrides.meta_description ?? 'Example meta description for testing.',
    keywords: overrides.keywords ?? ['keyword one', 'keyword two', 'keyword three', 'keyword four', 'keyword five'],
    read_time: overrides.read_time ?? '6 min',
  };
  const frontmatterLines = Object.entries(frontmatter).flatMap(([key, value]) => {
    const serialisedValue = serialiseFrontmatterValue(value);
    return Array.isArray(serialisedValue)
      ? [`${key}:`, ...serialisedValue]
      : [`${key}: ${serialisedValue}`];
  });

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
