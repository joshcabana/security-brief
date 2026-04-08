import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../app/api/health/subscribe/route';
import { ratelimit } from '../lib/rate-limit';

const originalEnv = { ...process.env };
const originalRateLimit = ratelimit.limit.bind(ratelimit);
const mutableEnv = process.env as Record<string, string | undefined>;

test.afterEach(() => {
  process.env = { ...originalEnv };
  ratelimit.limit = originalRateLimit;
});

test('health route requires authentication in production even when no token is configured', async () => {
  mutableEnv.NODE_ENV = 'production';
  delete process.env.HEALTH_CHECK_TOKEN;

  const response = await GET(
    new Request('http://localhost/api/health/subscribe', {
      method: 'GET',
    }),
  );

  assert.equal(response.status, 401);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), {
    status: 'degraded',
    message: 'Authentication required.',
  });
});

test('health route returns detailed checks for authenticated requests', async () => {
  mutableEnv.NODE_ENV = 'production';
  process.env.HEALTH_CHECK_TOKEN = 'health-secret';
  process.env.BEEHIIV_API_KEY = 'beehiiv-key';
  process.env.BEEHIIV_PUBLICATION_ID = 'publication';
  process.env.UPSTASH_REDIS_REST_URL = 'https://example.upstash.io';
  process.env.UPSTASH_REDIS_REST_TOKEN = 'upstash-token';

  ratelimit.limit = (async () => ({
    success: true,
    limit: 5,
    remaining: 4,
    reset: Date.now() + 60_000,
    pending: Promise.resolve(),
  })) as typeof ratelimit.limit;

  const response = await GET(
    new Request('http://localhost/api/health/subscribe', {
      method: 'GET',
      headers: {
        'x-health-token': 'health-secret',
      },
    }),
  );
  const payload = (await response.json()) as {
    status: string;
    checks: {
      beehiiv_env: { configured: boolean };
      upstash_env: { configured: boolean };
      upstash_connectivity: { ok: boolean };
    };
  };

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(payload.status, 'ok');
  assert.equal(payload.checks.beehiiv_env.configured, true);
  assert.equal(payload.checks.upstash_env.configured, true);
  assert.equal(payload.checks.upstash_connectivity.ok, true);
});
