import assert from 'node:assert/strict';
import { execFile as execFileCallback } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { buildArticleMarkdown, createWorkspace } from './helpers';

const execFile = promisify(execFileCallback);
const manifestScriptPath = path.join(process.cwd(), 'scripts', 'content-manifest.mjs');

async function runManifest(workspaceDir: string, mode: '--write' | '--check') {
  return execFile(process.execPath, [manifestScriptPath, mode], {
    cwd: workspaceDir,
  });
}

function rejectedWithStderr(pattern: RegExp) {
  return (error: { stderr?: string; message?: string }) => {
    assert.match(error.stderr || error.message || '', pattern);
    return true;
  };
}

test('content-manifest writes a sorted manifest for a valid workspace', async () => {
  const workspace = await createWorkspace([
    {
      fileName: 'beta.md',
      source: buildArticleMarkdown({
        slug: 'beta',
        title: 'Beta',
        category: 'Privacy',
        date: '2026-03-11',
      }),
    },
    {
      fileName: 'alpha.md',
      source: buildArticleMarkdown({
        slug: 'alpha',
        title: 'Alpha',
        category: 'AI Threats',
        date: '2026-03-12',
      }),
    },
  ]);

  try {
    await runManifest(workspace.workspaceDir, '--write');
    const manifest = JSON.parse(
      await readFile(path.join(workspace.workspaceDir, 'content-manifest.json'), 'utf8'),
    ) as { articleCount: number; categories: string[]; articles: Array<{ slug: string }> };

    assert.equal(manifest.articleCount, 2);
    assert.deepEqual(manifest.categories, ['AI Threats', 'Privacy']);
    assert.deepEqual(
      manifest.articles.map((article) => article.slug),
      ['alpha', 'beta'],
    );
  } finally {
    await workspace.cleanup();
  }
});

test('content-manifest rejects duplicate slugs', async () => {
  const workspace = await createWorkspace([
    {
      fileName: 'first.md',
      source: buildArticleMarkdown({
        slug: 'duplicate-slug',
        title: 'First',
      }),
    },
    {
      fileName: 'second.md',
      source: buildArticleMarkdown({
        slug: 'duplicate-slug',
        title: 'Second',
      }),
    },
  ]);

  try {
    await assert.rejects(
      () => runManifest(workspace.workspaceDir, '--write'),
      rejectedWithStderr(/Duplicate slug/),
    );
  } finally {
    await workspace.cleanup();
  }
});

test('content-manifest rejects malformed read_time values', async () => {
  const workspace = await createWorkspace([
    {
      fileName: 'bad-read-time.md',
      source: buildArticleMarkdown({
        slug: 'bad-read-time',
        read_time: 'slow read',
      }),
    },
  ]);

  try {
    await assert.rejects(
      () => runManifest(workspace.workspaceDir, '--write'),
      rejectedWithStderr(/read_time/),
    );
  } finally {
    await workspace.cleanup();
  }
});

test('content-manifest rejects invalid dates', async () => {
  const workspace = await createWorkspace([
    {
      fileName: 'bad-date.md',
      source: buildArticleMarkdown({
        slug: 'bad-date',
        date: 'not-a-real-date',
      }),
    },
  ]);

  try {
    await assert.rejects(
      () => runManifest(workspace.workspaceDir, '--write'),
      rejectedWithStderr(/valid date/),
    );
  } finally {
    await workspace.cleanup();
  }
});

test('content-manifest rejects empty category values', async () => {
  const workspace = await createWorkspace([
    {
      fileName: 'empty-category.md',
      source: buildArticleMarkdown({
        slug: 'empty-category',
        category: ' ',
      }),
    },
  ]);

  try {
    await assert.rejects(
      () => runManifest(workspace.workspaceDir, '--write'),
      rejectedWithStderr(/category/),
    );
  } finally {
    await workspace.cleanup();
  }
});
