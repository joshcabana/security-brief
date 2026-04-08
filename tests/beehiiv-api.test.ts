import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_BEEHIIV_API_BASE_URL,
  resolveBeehiivApiBaseUrl,
} from '../lib/beehiiv-api.mjs';

test('Beehiiv API base URL resolver falls back to the default for empty values', () => {
  assert.equal(resolveBeehiivApiBaseUrl(undefined), DEFAULT_BEEHIIV_API_BASE_URL);
  assert.equal(resolveBeehiivApiBaseUrl('   '), DEFAULT_BEEHIIV_API_BASE_URL);
});

test('Beehiiv API base URL resolver only accepts the official Beehiiv API host or explicit loopback mocks', () => {
  assert.equal(
    resolveBeehiivApiBaseUrl('https://api.beehiiv.com/v2/'),
    'https://api.beehiiv.com/v2',
  );
  assert.equal(
    resolveBeehiivApiBaseUrl('http://127.0.0.1:4011/mock/'),
    'http://127.0.0.1:4011/mock',
  );
  assert.equal(
    resolveBeehiivApiBaseUrl('https://localhost:4011/mock/'),
    'https://localhost:4011/mock',
  );

  assert.equal(resolveBeehiivApiBaseUrl('https://attacker.example/collect'), null);
  assert.equal(resolveBeehiivApiBaseUrl('http://api.beehiiv.com/v2'), null);
  assert.equal(resolveBeehiivApiBaseUrl('https://api.beehiiv.com/v2?token=steal-me'), null);
  assert.equal(resolveBeehiivApiBaseUrl('https://user:pass@api.beehiiv.com/v2'), null);
});
