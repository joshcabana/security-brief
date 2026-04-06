import assert from 'node:assert/strict';
import test from 'node:test';
import { POST } from '../app/api/subscribe/route';
import { ratelimit } from '../lib/rate-limit';

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;
const originalMathRandom = Math.random;
const originalSetTimeout = globalThis.setTimeout;
const originalClearTimeout = globalThis.clearTimeout;
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

  return new Request('http://localhost/api/subscribe', {
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
  Math.random = originalMathRandom;
  globalThis.setTimeout = originalSetTimeout;
  globalThis.clearTimeout = originalClearTimeout;
  ratelimit.limit = originalRateLimit;
}

test.afterEach(() => {
  restoreEnvironment();
});

test('subscribe route returns 503 when Beehiiv is not configured', async () => {
  setUpstashEnv();
  allowRateLimit();
  delete process.env.BEEHIIV_API_KEY;
  delete process.env.BEEHIIV_PUBLICATION_ID;

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'reader@example.com' })));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    message: 'Newsletter signup is not configured yet. Add BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID first.',
  });
});

test('subscribe route returns 503 when Upstash rate limiting is unreachable', async () => {
  setBeehiivEnv();
  setUpstashEnv();

  ratelimit.limit = (async () => {
    throw new Error('upstash unavailable');
  }) as typeof ratelimit.limit;

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'reader@example.com' })));

  assert.equal(response.status, 503);
  assert.deepEqual(await response.json(), {
    ok: false,
    message:
      'Newsletter signup is temporarily unavailable. Check rate limiting service connectivity and try again.',
  });
});

test('subscribe route returns 400 for invalid JSON payloads', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  const response = await POST(createSameSiteRequest('{"email"'));

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'The signup request body was invalid JSON.');
});

test('subscribe route returns 400 for invalid JSON payloads before service configuration checks', async () => {
  delete process.env.BEEHIIV_API_KEY;
  delete process.env.BEEHIIV_PUBLICATION_ID;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const response = await POST(createSameSiteRequest('{"email"'));

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'The signup request body was invalid JSON.');
});

test('subscribe route returns 400 for invalid email addresses', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'not-an-email' })));

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'Enter a valid email address to subscribe.');
});

test('subscribe route returns 400 for invalid email addresses before rate limiting runs', async () => {
  setBeehiivEnv();
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'not-an-email' })));

  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'Enter a valid email address to subscribe.');
});

test('subscribe route enforces rate limits before Beehiiv configuration checks', async () => {
  setUpstashEnv();
  delete process.env.BEEHIIV_API_KEY;
  delete process.env.BEEHIIV_PUBLICATION_ID;

  ratelimit.limit = (async () =>
    createRateLimitResult(false, Date.now() + 60_000, 0)) as unknown as typeof ratelimit.limit;

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'reader@example.com' })));
  const retryAfter = Number(response.headers.get('retry-after'));

  assert.equal(response.status, 429);
  assert.equal(Number.isFinite(retryAfter), true);
  assert.equal(retryAfter >= 1 && retryAfter <= 60, true);
  assert.deepEqual(await response.json(), {
    ok: false,
    message: 'Too many signup attempts. Please try again in a minute.',
  });
});

test('subscribe route returns 403 for off-site requests', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  const response = await POST(
    new Request('http://localhost/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://attacker.example',
      },
      body: JSON.stringify({ email: 'reader@example.com' }),
    }),
  );

  assert.equal(response.status, 403);
  assert.equal((await response.json()).message, 'This signup request could not be verified. Refresh the page and try again.');
});

test('subscribe route accepts same-site referer headers when origin is absent', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { id: 'sub_referer' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  const response = await POST(
    new Request('http://localhost/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        referer: 'http://localhost/newsletter',
      },
      body: JSON.stringify({ email: 'reader@example.com' }),
    }),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    message: "You're in. Check your inbox for Beehiiv's confirmation email.",
  });
});

test('subscribe route returns 400 when the honeypot field is filled', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  let fetchCalled = false;
  globalThis.fetch = async () => {
    fetchCalled = true;
    return new Response(null, { status: 201 });
  };

  const response = await POST(
    createSameSiteRequest(JSON.stringify({ email: 'reader@example.com', website: 'https://spam.example' })),
  );

  assert.equal(fetchCalled, false);
  assert.equal(response.status, 400);
  assert.equal((await response.json()).message, 'This signup request could not be verified. Refresh the page and try again.');
});

test('subscribe route surfaces upstream Beehiiv errors', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  globalThis.fetch = async () =>
    new Response(
      JSON.stringify({ errors: [{ message: 'Mock Beehiiv rejected the signup request.' }] }),
      {
        status: 422,
        headers: { 'Content-Type': 'application/json' },
      },
    );

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'reader@example.com' })));

  assert.equal(response.status, 422);
  assert.equal((await response.json()).message, 'Mock Beehiiv rejected the signup request.');
});

test('subscribe route returns 502 when Beehiiv cannot be reached', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  globalThis.fetch = async () => {
    throw new Error('network down');
  };

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'reader@example.com' })));

  assert.equal(response.status, 502);
  assert.equal(
    (await response.json()).message,
    'Beehiiv could not be reached. Check network access and publication settings, then try again.',
  );
});

test('subscribe route retries once when Beehiiv responds with 429 before succeeding', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();
  Math.random = () => 0;

  let attemptCount = 0;
  globalThis.fetch = async () => {
    attemptCount += 1;

    if (attemptCount === 1) {
      return new Response(JSON.stringify({ errors: [{ message: 'Rate limited.' }] }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': '0',
        },
      });
    }

    return new Response(JSON.stringify({ data: { id: 'sub_retry' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await POST(
    createSameSiteRequest(JSON.stringify({ email: 'reader@example.com', source: 'homepage-hero' })),
  );

  assert.equal(attemptCount, 2);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    message: "You're in. Check your inbox for Beehiiv's confirmation email.",
  });
});

test('subscribe route uses the first forwarded IP for distributed rate limiting', async () => {
  setBeehiivEnv();
  setUpstashEnv();

  let capturedIdentifier = '';
  ratelimit.limit = (async (identifier: string) => {
    capturedIdentifier = identifier;

    return createRateLimitResult(true, Date.now() + 60_000, 4);
  }) as unknown as typeof ratelimit.limit;

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { id: 'sub_forwarded' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  const response = await POST(
    createSameSiteRequest(
      JSON.stringify({ email: 'reader@example.com' }),
      { 'x-forwarded-for': '198.51.100.10, 10.0.0.1' },
    ),
  );

  assert.equal(response.status, 200);
  assert.equal(capturedIdentifier, '198.51.100.10');
});

test('subscribe route returns 429 after five rapid requests from the same IP', async () => {
  setBeehiivEnv();
  setUpstashEnv();

  const requestCounts = new Map<string, number>();
  ratelimit.limit = (async (identifier: string) => {
    const nextCount = (requestCounts.get(identifier) ?? 0) + 1;
    requestCounts.set(identifier, nextCount);

    return createRateLimitResult(nextCount <= 5, Date.now() + 60_000, Math.max(5 - nextCount, 0));
  }) as unknown as typeof ratelimit.limit;

  globalThis.fetch = async () =>
    new Response(JSON.stringify({ data: { id: 'sub_rate_limited' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });

  for (let attemptNumber = 1; attemptNumber <= 5; attemptNumber += 1) {
    const response = await POST(
      createSameSiteRequest(
        JSON.stringify({ email: `reader+${attemptNumber}@example.com` }),
        { 'x-forwarded-for': '198.51.100.10' },
      ),
    );

    assert.equal(response.status, 200);
  }

  const limitedResponse = await POST(
    createSameSiteRequest(
      JSON.stringify({ email: 'reader+6@example.com' }),
      { 'x-forwarded-for': '198.51.100.10' },
    ),
  );
  const retryAfter = Number(limitedResponse.headers.get('retry-after'));

  assert.equal(limitedResponse.status, 429);
  assert.equal(Number.isFinite(retryAfter), true);
  assert.equal(retryAfter >= 1 && retryAfter <= 60, true);
  assert.equal((await limitedResponse.json()).message, 'Too many signup attempts. Please try again in a minute.');
});

test('subscribe route returns 504 when Beehiiv times out', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  globalThis.setTimeout = ((handler: TimerHandler) => {
    queueMicrotask(() => {
      if (typeof handler === 'function') {
        handler();
      }
    });
    return 0 as unknown as ReturnType<typeof setTimeout>;
  }) as unknown as typeof globalThis.setTimeout;
  globalThis.clearTimeout = (() => undefined) as typeof globalThis.clearTimeout;
  globalThis.fetch = async (_input, init) =>
    await new Promise<Response>((_resolve, reject) => {
      const signal = init?.signal;

      if (!(signal instanceof AbortSignal)) {
        reject(new Error('Missing abort signal.'));
        return;
      }

      signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    });

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'reader@example.com' })));

  assert.equal(response.status, 504);
  assert.equal(
    (await response.json()).message,
    'Beehiiv did not respond before the signup request timed out. Wait a moment and try again. If the delay continues, check Beehiiv API availability and publication settings.',
  );
});

test('subscribe route returns 200 on a successful Beehiiv response', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();

  globalThis.fetch = async (input, init) => {
    assert.ok(init?.body);
    assert.deepEqual(JSON.parse(String(init.body)), {
      email: 'reader@example.com',
      reactivate_existing: false,
      referring_site: 'http://localhost',
      send_welcome_email: true,
      utm_source: 'website',
      utm_medium: 'organic',
      utm_campaign: 'site-signup',
      utm_content: 'homepage-hero',
    });
    assert.equal(String(input), 'https://api.beehiiv.com/v2/publications/test-publication/subscriptions');
    assert.equal(init?.method, 'POST');
    assert.equal(init?.headers && (init.headers as Record<string, string>).Authorization, 'Bearer test-key');
    return new Response(JSON.stringify({ data: { id: 'sub_123' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await POST(
    createSameSiteRequest(JSON.stringify({ email: 'reader@example.com', source: 'homepage-hero' })),
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    message: "You're in. Check your inbox for Beehiiv's confirmation email.",
  });
});

test('subscribe route defaults the placement source to unknown when omitted', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();
  process.env.NEXT_PUBLIC_SITE_URL = 'https://aithreatbrief.com';

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://api.beehiiv.com/v2/publications/test-publication/subscriptions');
    assert.ok(init?.body);
    assert.deepEqual(JSON.parse(String(init.body)), {
      email: 'reader@example.com',
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: 'website',
      utm_medium: 'organic',
      utm_campaign: 'site-signup',
      utm_content: 'unknown',
      referring_site: 'http://localhost',
    });
    return new Response(JSON.stringify({ data: { id: 'sub_456' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'reader@example.com' })));

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), {
    ok: true,
    message: "You're in. Check your inbox for Beehiiv's confirmation email.",
  });
});

test('subscribe route enrolls the Beehiiv welcome automation when configured', async () => {
  setBeehiivEnv();
  setUpstashEnv();
  allowRateLimit();
  process.env.BEEHIIV_WELCOME_AUTOMATION_ID = 'aut_welcome_123';

  globalThis.fetch = async (input, init) => {
    assert.equal(String(input), 'https://api.beehiiv.com/v2/publications/test-publication/subscriptions');
    assert.ok(init?.body);
    assert.deepEqual(JSON.parse(String(init.body)), {
      email: 'reader@example.com',
      reactivate_existing: false,
      referring_site: 'http://localhost',
      send_welcome_email: false,
      automation_ids: ['aut_welcome_123'],
      utm_source: 'website',
      utm_medium: 'organic',
      utm_campaign: 'site-signup',
      utm_content: 'unknown',
    });
    return new Response(JSON.stringify({ data: { id: 'sub_automation' } }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  };

  const response = await POST(createSameSiteRequest(JSON.stringify({ email: 'reader@example.com' })));

  assert.equal(response.status, 200);
});
