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

test('parseArticleSource rejects scalar author values', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'scalar-author.md',
        buildArticleMarkdown({
          slug: 'scalar-author',
          author: 'AI Security Brief',
        }),
      ),
    /author.*object/i,
  );
});

test('parseArticleSource rejects brand-level author names', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'brand-author.md',
        buildArticleMarkdown({
          slug: 'brand-author',
          author: {
            name: 'AI Security Brief',
            role: 'Editor & Publisher',
          },
        }),
      ),
    /named human/i,
  );
});

test('parseArticleSource rejects invalid author profile URLs', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'bad-profile-url.md',
        buildArticleMarkdown({
          slug: 'bad-profile-url',
          author: {
            name: 'Josh Cabana',
            role: 'Editor & Publisher',
            profileUrl: 'mailto:josh@example.com',
          },
        }),
      ),
    /author\.profileUrl/i,
  );
});

test('parseArticleSource rejects missing primary sources', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'missing-primary-sources.md',
        buildArticleMarkdown({
          slug: 'missing-primary-sources',
          primarySources: [],
        }),
      ),
    /primarySources/i,
  );
});

test('parseArticleSource rejects invalid primary source urls', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'bad-primary-source-url.md',
        buildArticleMarkdown({
          slug: 'bad-primary-source-url',
          primarySources: [
            { url: 'https://example.com/one', title: 'One' },
            { url: 'ftp://example.com/two', title: 'Two' },
            { url: 'https://example.com/three', title: 'Three' },
          ],
        }),
      ),
    /primarySources\[1\]\.url/i,
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

test('parseArticleSource rejects unsafe slugs that could break routing and metadata contexts', async () => {
  await assert.rejects(
    () =>
      parseArticleSource(
        'bad-slug.md',
        buildArticleMarkdown({
          slug: 'bad/slug',
        }),
      ),
    /slug/i,
  );
});

test('parseArticleSource strips unsafe HTML from rendered article content and metadata fields', async () => {
  const article = await parseArticleSource(
    'sanitised-article.md',
    buildArticleMarkdown({
      title: '<strong>Example</strong>',
      slug: 'sanitised-article',
      excerpt: '<script>alert(1)</script>Example excerpt',
      meta_title: '<img src=x onerror=alert(1)>Meta title',
      meta_description: '<b>Meta description</b>',
      keywords: ['<em>first</em>', 'second', 'third', 'fourth', 'fifth'],
      category: 'Privacy',
      body: [
        'Safe **bold** text.',
        '',
        '<script>alert(1)</script>',
        '',
        '<a href="javascript:alert(1)" onclick="evil()">bad link</a>',
        '',
        '[insecure link](http://insecure.example/path)',
        '',
        '[internal link](/guides)',
        '',
        '![tracking pixel](https://tracker.example/pixel.png)',
      ].join('\n'),
    }),
  );

  assert.equal(article.title, 'Example');
  assert.equal(article.excerpt, 'Example excerpt');
  assert.equal(article.metaTitle, 'Meta title');
  assert.equal(article.metaDescription, 'Meta description');
  assert.deepEqual(article.keywords, ['first', 'second', 'third', 'fourth', 'fifth']);
  assert.doesNotMatch(article.contentHtml, /<script|onclick=|javascript:|<img/i);
  assert.doesNotMatch(article.contentHtml, /^<h1/i);
  assert.match(article.contentHtml, /<strong>bold<\/strong>/);
  assert.match(article.contentHtml, /href="\/guides"/);
  assert.doesNotMatch(article.contentHtml, /http:\/\/insecure\.example/i);
});
