import assert from 'node:assert/strict';
import test from 'node:test';
import { loadArticlesFromDirectory, parseArticleSource } from '../lib/articles';
import { buildArticleMarkdown, createWorkspace } from './helpers';

test('loadArticlesFromDirectory sorts articles by descending date and then slug', async () => {
  const workspace = await createWorkspace([
    {
      fileName: 'zeta.md',
      source: buildArticleMarkdown({
        slug: 'zeta',
        title: 'Zeta',
        date: '2026-03-08',
      }),
    },
    {
      fileName: 'alpha.md',
      source: buildArticleMarkdown({
        slug: 'alpha',
        title: 'Alpha',
        date: '2026-03-10',
      }),
    },
    {
      fileName: 'beta.md',
      source: buildArticleMarkdown({
        slug: 'beta',
        title: 'Beta',
        date: '2026-03-10',
      }),
    },
  ]);

  try {
    const articles = await loadArticlesFromDirectory(workspace.blogDir);
    assert.deepEqual(
      articles.map((article) => article.slug),
      ['alpha', 'beta', 'zeta'],
    );
  } finally {
    await workspace.cleanup();
  }
});

test('parseArticleSource rejects malformed read_time values', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'bad-read-time.md',
        buildArticleMarkdown({
          slug: 'bad-read-time',
          read_time: 'about six minutes',
        }),
      ),
    /read_time/,
  );
});

test('parseArticleSource rejects invalid dates', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'bad-date.md',
        buildArticleMarkdown({
          slug: 'bad-date',
          date: 'not-a-real-date',
        }),
      ),
    /valid date/,
  );
});

test('loadArticlesFromDirectory rejects duplicate slugs', async () => {
  const workspace = await createWorkspace([
    {
      fileName: 'first.md',
      source: buildArticleMarkdown({
        slug: 'shared-slug',
        title: 'First',
      }),
    },
    {
      fileName: 'second.md',
      source: buildArticleMarkdown({
        slug: 'shared-slug',
        title: 'Second',
      }),
    },
  ]);

  try {
    await assert.rejects(
      () => loadArticlesFromDirectory(workspace.blogDir),
      /Duplicate slug/,
    );
  } finally {
    await workspace.cleanup();
  }
});

test('parseArticleSource rejects empty categories', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'empty-category.md',
        buildArticleMarkdown({
          slug: 'empty-category',
          category: '   ',
        }),
      ),
    /category/,
  );
});
