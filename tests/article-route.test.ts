import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const articlePageSource = readFileSync(
  join(process.cwd(), 'app', 'blog', '[slug]', 'page.tsx'),
  'utf8',
);

test('article route stays dynamically rendered so runtime affiliate links are current', () => {
  assert.match(articlePageSource, /export const dynamic = 'force-dynamic';/);
});

test('article route keeps the assessment CTA wired to the shared offer config', () => {
  assert.match(articlePageSource, /const assessment = siteConfig\.offers\.assessment;/);
  assert.match(articlePageSource, /Primary offer/);
  assert.match(articlePageSource, /View the readiness review/);
  assert.match(articlePageSource, /Preview the report first/);
});
