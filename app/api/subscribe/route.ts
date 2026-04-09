import { NextResponse } from 'next/server';
import { ratelimit } from '@/lib/rate-limit';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_SOURCE = 'unknown';
const DEFAULT_API_BASE_URL = 'https://api.beehiiv.com';
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 250;
const RETRY_JITTER_MS = 100;
const INVALID_REQUEST_MESSAGE = 'This signup request could not be verified. Refresh the page and try again.';
const RETRYABLE_STATUS_CODES = new Set<number>([429, 503]);

type BeehiivConfig = {
  apiKey: string | undefined;
  publicationId: string | undefined;
  apiBaseUrl: string;
  configured: boolean;
};

type SubscribeRequestPayload = {
  email?: string;
  source?: string;
  website?: string;
};

type BeehiivSubscribeBody = {
  email: string;
  reactivate_existing: boolean;
  send_welcome_email: boolean;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  referring_site?: string;
  automation_ids?: string[];
};

type BeehiivErrorPayload = {
  errors?: Array<{ message?: string }>;
};

type RateLimitResponse = {
  success: boolean;
  reset: number;
};

class BeehiivRequestTimeoutError extends Error {
  constructor(url: string, timeoutMs: number) {
    super(
      `Beehiiv request timed out after ${timeoutMs}ms for ${url}. Try again shortly or verify Beehiiv API availability.`,
    );
    this.name = 'BeehiivRequestTimeoutError';
  }
}

class BeehiivRequestNetworkError extends Error {
  constructor(url: string, cause: unknown) {
    const causeMessage = cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);

    super(
      `Beehiiv request failed before a response was received for ${url}. Cause: ${causeMessage}. Check network access and Beehiiv publication settings.`,
    );
    this.name = 'BeehiivRequestNetworkError';
  }
}

function getBeehiivConfig(): BeehiivConfig {
  const apiKey = process.env.BEEHIIV_API_KEY?.trim();
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID?.trim();
  const apiBaseUrl = (process.env.BEEHIIV_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL).replace(/\/$/, '');

  return {
    apiKey,
    publicationId,
    apiBaseUrl,
    configured: Boolean(apiKey && publicationId),
  };
}

function getRequestIp(request: Request): string {
  const forwardedFor = request.headers.get('x-forwarded-for');

  if (!forwardedFor) {
    return 'anonymous';
  }

  const [requestIp] = forwardedFor.split(',');
  const normalizedRequestIp = requestIp?.trim();

  if (!normalizedRequestIp) {
    return 'anonymous';
  }

  return normalizedRequestIp;
}

function getRetryAfterSeconds(resetAt: number): string {
  const secondsUntilReset = Math.ceil((resetAt - Date.now()) / 1000);

  return String(Math.max(secondsUntilReset, 1));
}

function getAllowedOrigins(request: Request): string[] {
  const allowedOrigins = new Set<string>([new URL(request.url).origin]);
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();

  if (configuredSiteUrl) {
    try {
      allowedOrigins.add(new URL(configuredSiteUrl).origin);
    } catch {
      return Array.from(allowedOrigins);
    }
  }

  return Array.from(allowedOrigins);
}

function getSubmittedOrigin(request: Request): string | null {
  const originHeader = request.headers.get('origin');

  if (originHeader) {
    try {
      return new URL(originHeader).origin;
    } catch {
      return null;
    }
  }

  const refererHeader = request.headers.get('referer');

  if (!refererHeader) {
    return null;
  }

  try {
    return new URL(refererHeader).origin;
  } catch {
    return null;
  }
}

function normalizeSource(source: unknown): string {
  if (typeof source !== 'string') {
    return DEFAULT_SOURCE;
  }

  const normalizedSource = source.trim().toLowerCase();

  if (!normalizedSource) {
    return DEFAULT_SOURCE;
  }

  return normalizedSource.replace(/\s+/g, '-');
}

function getReferringSite(request: Request): string {
  return getSubmittedOrigin(request) ?? getAllowedOrigins(request)[0] ?? '';
}

function getBeehiivWelcomeAutomationIds(): string[] {
  const automationId = process.env.BEEHIIV_WELCOME_AUTOMATION_ID?.trim();

  if (!automationId) {
    return [];
  }

  return [automationId];
}

function isVerifiedSignupRequest(request: Request): boolean {
  const submittedOrigin = getSubmittedOrigin(request);

  if (!submittedOrigin) {
    return false;
  }

  return getAllowedOrigins(request).includes(submittedOrigin);
}

function hasFilledHoneypot(value: unknown): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

function getRetryDelayFromHeaders(headers: Headers): number | null {
  const retryAfter = headers.get('retry-after');

  if (retryAfter) {
    const retryAfterSeconds = Number(retryAfter);

    if (Number.isFinite(retryAfterSeconds) && retryAfterSeconds >= 0) {
      return retryAfterSeconds * 1000;
    }

    const retryAtMs = Date.parse(retryAfter);

    if (Number.isFinite(retryAtMs)) {
      return Math.max(retryAtMs - Date.now(), 0);
    }
  }

  const rateLimitReset = headers.get('ratelimit-reset');

  if (!rateLimitReset) {
    return null;
  }

  const resetSeconds = Number(rateLimitReset);

  if (!Number.isFinite(resetSeconds) || resetSeconds < 0) {
    return null;
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  return Math.max(resetSeconds - nowSeconds, 0) * 1000;
}

function getRetryDelayMs(attemptNumber: number, headers: Headers): number {
  const headerDelayMs = getRetryDelayFromHeaders(headers);

  if (headerDelayMs !== null) {
    return headerDelayMs;
  }

  const exponentialDelayMs = RETRY_BASE_DELAY_MS * 2 ** (attemptNumber - 1);
  const jitterMs = Math.floor(Math.random() * RETRY_JITTER_MS);

  return exponentialDelayMs + jitterMs;
}

function logRetryWarning(attemptNumber: number, responseStatus: number, retryDelayMs: number): void {
  console.warn(
    JSON.stringify({
      level: 'warn',
      event: 'beehiiv_subscribe_retry',
      attempt: attemptNumber,
      max_attempts: MAX_RETRY_ATTEMPTS,
      status: responseStatus,
      retry_delay_ms: retryDelayMs,
    }),
  );
}

function logFailure(failure: string, errorMessage: string): void {
  console.error(
    JSON.stringify({
      level: 'error',
      event: 'beehiiv_subscribe_failed',
      failure,
      error_message: errorMessage,
    }),
  );
}

function logRequestRejection(reason: string, request: Request, source: string): void {
  console.warn(
    JSON.stringify({
      level: 'warn',
      event: 'newsletter_subscribe_rejected',
      reason,
      source,
      submitted_origin: getSubmittedOrigin(request),
      allowed_origins: getAllowedOrigins(request),
    }),
  );
}

function delay(durationMs: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, durationMs);
  });
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeoutHandle = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, {
      ...init,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new BeehiivRequestTimeoutError(url, REQUEST_TIMEOUT_MS);
    }

    throw new BeehiivRequestNetworkError(url, error);
  } finally {
    clearTimeout(timeoutHandle);
  }
}

async function createBeehiivSubscription(
  apiBaseUrl: string,
  publicationId: string,
  apiKey: string,
  upstreamBody: BeehiivSubscribeBody,
): Promise<Response> {
  const url = `${apiBaseUrl}/v2/publications/${publicationId}/subscriptions`;
  const requestInit: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(upstreamBody),
  };

  for (let attemptNumber = 1; attemptNumber <= MAX_RETRY_ATTEMPTS; attemptNumber += 1) {
    const response = await fetchWithTimeout(url, requestInit);

    if (response.ok || !isRetryableStatus(response.status) || attemptNumber === MAX_RETRY_ATTEMPTS) {
      return response;
    }

    const retryDelayMs = getRetryDelayMs(attemptNumber, response.headers);
    logRetryWarning(attemptNumber, response.status, retryDelayMs);
    await delay(retryDelayMs);
  }

  throw new Error('Beehiiv subscription request exhausted its retry loop without returning a response.');
}

function getUpstreamMessage(upstreamPayload: unknown): string {
  if (
    typeof upstreamPayload === 'object' &&
    upstreamPayload !== null &&
    'errors' in upstreamPayload &&
    Array.isArray((upstreamPayload as BeehiivErrorPayload).errors)
  ) {
    return ((upstreamPayload as BeehiivErrorPayload).errors ?? [])
      .map((error) => error.message)
      .filter(Boolean)
      .join(' ');
  }

  return '';
}

export async function POST(request: Request): Promise<Response> {
  let payload: SubscribeRequestPayload | null = null;

  try {
    payload = (await request.json()) as SubscribeRequestPayload;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'The signup request body was invalid JSON.' },
      { status: 400 },
    );
  }

  const email = payload?.email?.trim().toLowerCase();
  const source = normalizeSource(payload?.source);
  const honeypotFilled = hasFilledHoneypot(payload?.website);

  if (!isVerifiedSignupRequest(request)) {
    logRequestRejection('origin_mismatch', request, source);
    return NextResponse.json(
      { ok: false, message: INVALID_REQUEST_MESSAGE },
      { status: 403 },
    );
  }

  if (honeypotFilled) {
    logRequestRejection('honeypot_filled', request, source);
    return NextResponse.json(
      { ok: false, message: INVALID_REQUEST_MESSAGE },
      { status: 400 },
    );
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return NextResponse.json(
      { ok: false, message: 'Enter a valid email address to subscribe.' },
      { status: 400 },
    );
  }

  const requestIp = getRequestIp(request);
  let rateLimitResult: RateLimitResponse;

  try {
    rateLimitResult = (await ratelimit.limit(requestIp)) as RateLimitResponse;
  } catch (error) {
    logFailure('rate_limit', error instanceof Error ? error.message : String(error));
    return NextResponse.json(
      {
        ok: false,
        message:
          'Newsletter signup is temporarily unavailable. Check rate limiting service connectivity and try again.',
      },
      { status: 503 },
    );
  }

  if (!rateLimitResult.success) {
    return NextResponse.json(
      { ok: false, message: 'Too many signup attempts. Please try again in a minute.' },
      {
        status: 429,
        headers: {
          'Retry-After': getRetryAfterSeconds(rateLimitResult.reset),
        },
      },
    );
  }

  const { apiKey, publicationId, apiBaseUrl, configured } = getBeehiivConfig();

  if (!configured || !apiKey || !publicationId) {
    return NextResponse.json(
      {
        ok: false,
        message:
          'Newsletter signup is not configured yet. Add BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID first.',
      },
      { status: 503 },
    );
  }

  const referringSite = getReferringSite(request);
  const welcomeAutomationIds = getBeehiivWelcomeAutomationIds();
  const upstreamBody: BeehiivSubscribeBody = {
    email,
    reactivate_existing: false,
    send_welcome_email: welcomeAutomationIds.length === 0,
    utm_source: 'website',
    utm_medium: 'organic',
    utm_campaign: 'site-signup',
    utm_content: source,
    ...(referringSite ? { referring_site: referringSite } : {}),
    ...(welcomeAutomationIds.length > 0 ? { automation_ids: welcomeAutomationIds } : {}),
  };

  let upstreamResponse: Response;

  try {
    upstreamResponse = await createBeehiivSubscription(apiBaseUrl, publicationId, apiKey, upstreamBody);
  } catch (error) {
    if (error instanceof BeehiivRequestTimeoutError) {
      logFailure('timeout', error.message);
      return NextResponse.json(
        {
          ok: false,
          message:
            'Beehiiv did not respond before the signup request timed out. Wait a moment and try again. If the delay continues, check Beehiiv API availability and publication settings.',
        },
        { status: 504 },
      );
    }

    if (error instanceof BeehiivRequestNetworkError) {
      logFailure('network', error.message);
      return NextResponse.json(
        {
          ok: false,
          message: 'Beehiiv could not be reached. Check network access and publication settings, then try again.',
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: 'Beehiiv could not be reached. Check network access and publication settings, then try again.',
      },
      { status: 502 },
    );
  }

  let upstreamPayload: unknown = null;

  try {
    upstreamPayload = await upstreamResponse.json();
  } catch {
    upstreamPayload = null;
  }

  if (!upstreamResponse.ok) {
    const upstreamMessage = getUpstreamMessage(upstreamPayload);

    return NextResponse.json(
      {
        ok: false,
        message:
          upstreamMessage ||
          'Beehiiv rejected the signup request. Double-check the publication settings and try again.',
      },
      { status: upstreamResponse.status },
    );
  }

  return NextResponse.json(
    {
      ok: true,
      message: "You're in. Check your inbox for Beehiiv's confirmation email.",
    },
    { status: 200 },
  );
}
