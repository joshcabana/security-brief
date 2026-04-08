import assert from 'node:assert/strict';
import test from 'node:test';
import {
  DEFAULT_JSON_BODY_LIMIT_BYTES,
  MAX_MARKETING_FIELD_LENGTH,
  REQUEST_IP_FALLBACK,
  getRequestIp,
  parseJsonRequestBody,
  sanitizeMarketingField,
} from '../lib/request-security.mjs';

function createRequest(headers: HeadersInit = {}): Request {
  return new Request('http://localhost/api/test', {
    headers,
  });
}

test('getRequestIp prefers x-vercel-forwarded-for over other proxy headers', () => {
  const request = createRequest({
    'x-vercel-forwarded-for': '203.0.113.11',
    'x-real-ip': '198.51.100.5',
    'x-forwarded-for': '192.0.2.9, 10.0.0.1',
  });

  assert.equal(getRequestIp(request), '203.0.113.11');
});

test('getRequestIp falls back to the next valid proxy header when earlier values are malformed', () => {
  const request = createRequest({
    'x-vercel-forwarded-for': 'bad-value',
    'x-real-ip': '198.51.100.5',
    'x-forwarded-for': 'not-an-ip',
  });

  assert.equal(getRequestIp(request), '198.51.100.5');
});

test('getRequestIp returns the anonymous fallback when no valid proxy headers are present', () => {
  const request = createRequest({
    'x-forwarded-for': 'garbage',
  });

  assert.equal(getRequestIp(request), REQUEST_IP_FALLBACK);
});

test('sanitizeMarketingField lowercases valid values and falls back for invalid tokens', () => {
  assert.equal(sanitizeMarketingField('Matrix-PDF', 'unknown'), 'matrix-pdf');
  assert.equal(sanitizeMarketingField('LinkedIn-Document-Ad', 'unknown'), 'linkedin-document-ad');
  assert.equal(sanitizeMarketingField('Assessment-Page', 'unknown'), 'assessment-page');
  assert.equal(sanitizeMarketingField('Bad Source', 'lead-capture'), 'lead-capture');
  assert.equal(sanitizeMarketingField('a'.repeat(MAX_MARKETING_FIELD_LENGTH + 1), 'unknown'), 'unknown');
});

test('parseJsonRequestBody rejects non-json content types, oversized bodies, and non-object payloads', async () => {
  const unsupportedMediaTypeResult = await parseJsonRequestBody(
    new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: '{"email":"reader@example.com"}',
    }),
  );
  const oversizedResult = await parseJsonRequestBody(
    new Request('http://localhost/api/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(DEFAULT_JSON_BODY_LIMIT_BYTES + 1),
      },
      body: JSON.stringify({ payload: 'x' }),
    }),
  );
  const invalidShapeResult = await parseJsonRequestBody(
    new Request('http://localhost/api/test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '[]',
    }),
  );

  assert.deepEqual(unsupportedMediaTypeResult, {
    ok: false,
    status: 415,
    message: 'This endpoint only accepts application/json payloads.',
  });
  assert.deepEqual(oversizedResult, {
    ok: false,
    status: 413,
    message: 'The request body is too large.',
  });
  assert.deepEqual(invalidShapeResult, {
    ok: false,
    status: 400,
    message: 'The request body must be a JSON object.',
  });
});
