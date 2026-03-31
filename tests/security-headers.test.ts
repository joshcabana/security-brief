import assert from 'node:assert/strict';
import test from 'node:test';
import nextConfig from '../next.config.mjs';
import {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  getExpectedSecurityHeaderValue,
  getSecurityHeaders,
} from '../lib/security-headers.mjs';

test('security headers expose the expected baseline response protections', () => {
  assert.deepEqual(getSecurityHeaders(), SECURITY_HEADERS);
  assert.equal(getExpectedSecurityHeaderValue('X-Frame-Options'), 'DENY');
  assert.equal(getExpectedSecurityHeaderValue('Referrer-Policy'), 'strict-origin-when-cross-origin');
  assert.equal(
    getExpectedSecurityHeaderValue('Strict-Transport-Security'),
    'max-age=63072000; includeSubDomains; preload',
  );
  assert.equal(getExpectedSecurityHeaderValue('Unknown-Header'), null);
});

test('content security policy blocks embedding and unsafe object execution', () => {
  assert.match(CONTENT_SECURITY_POLICY, /frame-ancestors 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /object-src 'none'/);
  assert.match(CONTENT_SECURITY_POLICY, /form-action 'self'/);
});

test('security header helpers return fresh header objects', () => {
  const headers = getSecurityHeaders();
  headers[0].value = 'mutated';

  assert.notDeepEqual(headers, SECURITY_HEADERS);
  assert.deepEqual(getSecurityHeaders(), SECURITY_HEADERS);
});

test('next config applies the baseline security headers to every route', async () => {
  assert.ok(nextConfig.headers, 'Expected next config to define a headers function.');
  const headersResolver = nextConfig.headers;

  const headerRules = await headersResolver();

  assert.deepEqual(headerRules, [
    {
      source: '/:path*',
      headers: SECURITY_HEADERS,
    },
  ]);
});
