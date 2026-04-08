import assert from 'node:assert/strict';
import { Buffer } from 'node:buffer';
import test from 'node:test';
import { POST } from '../app/api/lead-capture/route';
import { ratelimit } from '../lib/rate-limit';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalRateLimit = ratelimit.limit.bind(ratelimit);

type MockRateLimitResult = Awaited<ReturnType<typeof ratelimit.limit>>;

function createSameSiteRequest(body: string, extraHeaders: HeadersInit = {}): Request {
  const headers = new Headers({
    'Content-Type': 'application/json',
    origin: 'http://localhost',
  });

  const normalizedExtraHeaders = new Headers(extraHeaders);

  for (const [key, value] of normalizedExtraHeaders.entries()) {
    if (value !== 'undefined') {
      headers.set(key, value);
    }
  }

  return new Request('http://localhost/api/lead-capture', {
    method: 'POST',
    headers,
    body,
  });
}

function setBeehiivEnv(): void {
  process.env.BEEHIIV_API_KEY = 'test-key';
  process.env.BEEHIIV_PUBLICATION_ID = 'test-publication';
}

function setUpstashEnv(): void {
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'test-upstash-token';
}

function createRateLimitResult(success: boolean, reset: number, remaining: number): MockRateLimitResult {
  return {
    success,
    limit: 5,
    remaining,
    reset,
    pending: Promise.resolve(),
  };
}

function allowRateLimit(): void {
  ratelimit.limit = (async () =>
    createRateLimitResult(true, Date.now() + 60_000, 4)) as unknown as typeof ratelimit.limit;
}

function restoreEnvironment() {
  process.env = { ...originalEnv };
  globalThis.fetch = originalFetch;
  ratelimit.limit = originalRateLimit;
}

test.afterEach(() => {
  restoreEnvironment();
});

test('lead capture rejects off-site requests', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  const response = await POST(
    new Request('http://localhost/api/lead-capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://attacker.example',
      },
      body: JSON.stringify({ email: 'worker@example.com', jobTitle: 'Security Engineer' }),
    }),
  );

  assert.equal(response.status, 403);
  assert.equal((await response.json()).message, 'This request could not be verified. Refresh the page and try again.');
});

test('lead capture rejects non-json content types, oversized bodies, and non-object json payloads', async () => {
  const unsupportedMediaTypeResponse = await POST(
    new Request('http://localhost/api/lead-capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        origin: 'http://localhost',
      },
      body: '{"email":"worker@example.com","jobTitle":"Security Engineer"}',
    }),
  );
  const oversizedBody = JSON.stringify({
    email: 'worker@example.com',
    jobTitle: 'Security Engineer',
    source: 'x'.repeat(5000),
  });
  const oversizedResponse = await POST(
    new Request('http://localhost/api/lead-capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'http://localhost',
        'Content-Length': String(Buffer.byteLength(oversizedBody, 'utf8')),
      },
      body: oversizedBody,
    }),
  );
  const invalidShapeResponse = await POST(
    new Request('http://localhost/api/lead-capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'http://localhost',
      },
      body: '[]',
    }),
  );

  assert.equal(unsupportedMediaTypeResponse.status, 415);
  assert.equal(
    (await unsupportedMediaTypeResponse.json()).message,
    'This endpoint only accepts application/json payloads.',
  );
  assert.equal(oversizedResponse.status, 413);
  assert.equal((await oversizedResponse.json()).message, 'The request body is too large.');
  assert.equal(invalidShapeResponse.status, 400);
  assert.equal((await invalidShapeResponse.json()).message, 'Request body must be a JSON object.');
});

test('lead capture sanitises source and asset fields before sending them upstream', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  globalThis.fetch = async (_input, init) => {
    assert.ok(init?.body);
    assert.deepEqual(JSON.parse(String(init.body)), {
      email: 'worker@example.com',
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: 'website',
      utm_medium: 'lead-capture',
      utm_campaign: 'report:unknown',
      utm_content: 'lead-capture',
      custom_fields: [
        { name: 'job_title', value: 'Security Engineer' },
        { name: 'lead_source', value: 'lead-capture' },
        { name: 'asset_requested', value: 'unknown' },
      ],
      referring_site: 'http://localhost',
    });

    return new Response(JSON.stringify({ data: { id: 'lead_123' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await POST(
    createSameSiteRequest(
      JSON.stringify({
        email: 'worker@example.com',
        jobTitle: 'Security Engineer',
        source: 'Bad Source',
        asset: '../../matrix',
      }),
    ),
  );

  assert.equal(response.status, 200);
});

test('lead capture preserves valid assessment campaign source fields', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  globalThis.fetch = async (_input, init) => {
    assert.ok(init?.body);
    assert.deepEqual(JSON.parse(String(init.body)), {
      email: 'worker@example.com',
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: 'website',
      utm_medium: 'lead-capture',
      utm_campaign: 'report:report-teaser',
      utm_content: 'linkedin-document-ad',
      custom_fields: [
        { name: 'job_title', value: 'Security Engineer' },
        { name: 'lead_source', value: 'linkedin-document-ad' },
        { name: 'asset_requested', value: 'report-teaser' },
      ],
      referring_site: 'http://localhost',
    });

    return new Response(JSON.stringify({ data: { id: 'lead_456' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await POST(
    createSameSiteRequest(
      JSON.stringify({
        email: 'worker@example.com',
        jobTitle: 'Security Engineer',
        source: 'linkedin-document-ad',
        asset: 'report-teaser',
      }),
    ),
  );

  assert.equal(response.status, 200);
});

test('lead capture does not expose upstream Beehiiv errors to clients', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ errors: [{ message: 'Mock Beehiiv lead rejection.' }] }),
      {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      },
    );

  const response = await POST(
    createSameSiteRequest(
      JSON.stringify({
        email: 'worker@example.com',
        jobTitle: 'Security Engineer',
      }),
    ),
  );

  assert.equal(response.status, 422);
  assert.equal(
    (await response.json()).message,
    'The report request was rejected. Double-check the submitted details and try again.',
  );
});

test('lead capture rejects invalid Beehiiv API base URLs before making an upstream request', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();
  process.env.BEEHIIV_API_BASE_URL = 'http://127.0.0.1:8080';

  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response(null, { status: 201 });
  };

  const response = await POST(
    createSameSiteRequest(
      JSON.stringify({
        email: 'worker@example.com',
        jobTitle: 'Security Engineer',
      }),
    ),
  );

  assert.equal(fetchCalled, false);
  assert.equal(response.status, 503);
  assert.equal(
    (await response.json()).message,
    'Could not process your request right now. Try again in a moment.',
  );
});
