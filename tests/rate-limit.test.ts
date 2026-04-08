import assert from 'node:assert/strict';
import test from 'node:test';
import { RATE_LIMIT_ANALYTICS_ENABLED } from '../lib/rate-limit';

test('rate limiting disables Upstash analytics collection', () => {
  assert.equal(RATE_LIMIT_ANALYTICS_ENABLED, false);
});
