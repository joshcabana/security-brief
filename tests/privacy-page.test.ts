import assert from 'node:assert/strict';
import test from 'node:test';
import { renderToStaticMarkup } from 'react-dom/server';
import PrivacyPage from '../app/privacy/page';

const originalEnv = { ...process.env };

test.afterEach(() => {
  process.env = { ...originalEnv };
});

test('privacy page discloses Upstash abuse-prevention handling', () => {
  delete process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN;
  delete process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID;

  const html = renderToStaticMarkup(PrivacyPage());

  assert.match(html, /Upstash Redis/i);
  assert.match(html, /IP-derived rate-limit identifiers/i);
  assert.match(html, /do not use Upstash for audience analytics/i);
});
