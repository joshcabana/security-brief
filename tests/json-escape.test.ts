import assert from 'node:assert/strict';
import test from 'node:test';
import { serializeJsonForHtml } from '../lib/json-escape.mjs';

test('serializeJsonForHtml escapes script-breaking and parser-breaking characters', () => {
  const serialized = serializeJsonForHtml({
    headline: '</script><script>alert(1)</script>',
    marker: '&\u2028\u2029',
  });

  assert.doesNotMatch(serialized, /<\/script>/i);
  assert.match(serialized, /\\u003c\/script\\u003e\\u003cscript\\u003ealert\(1\)\\u003c\/script\\u003e/);
  assert.match(serialized, /\\u0026\\u2028\\u2029/);
});
