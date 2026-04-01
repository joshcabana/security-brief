import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildNewsletterPath,
  coerceSingleSearchParamValue,
  resolveNewsletterSource,
  sanitizeNewsletterSource,
} from '../lib/newsletter-source.mjs';

test('newsletter source sanitization accepts only lowercase letters digits and hyphens', () => {
  assert.equal(sanitizeNewsletterSource('homepage-hero'), 'homepage-hero');
  assert.equal(sanitizeNewsletterSource('tools-footer-archive'), 'tools-footer-archive');
  assert.equal(sanitizeNewsletterSource('Headline CTA'), null);
  assert.equal(sanitizeNewsletterSource('bad_source'), null);
  assert.equal(sanitizeNewsletterSource('UPPERCASE'), null);
});

test('newsletter source resolution falls back to the page default when query values are invalid', () => {
  assert.equal(resolveNewsletterSource('tools-footer', 'newsletter-hero'), 'tools-footer');
  assert.equal(resolveNewsletterSource('bad source', 'newsletter-hero'), 'newsletter-hero');
  assert.equal(resolveNewsletterSource(undefined, 'newsletter-cta'), 'newsletter-cta');
});

test('search param coercion keeps a single string value from App Router search params', () => {
  assert.equal(coerceSingleSearchParamValue('tools-footer'), 'tools-footer');
  assert.equal(coerceSingleSearchParamValue(['tools-footer', 'newsletter-hero']), 'tools-footer');
  assert.equal(coerceSingleSearchParamValue(undefined), null);
});

test('newsletter path builder encodes tagged entry points', () => {
  assert.equal(buildNewsletterPath('tools-footer'), '/newsletter?source=tools-footer');
});
