import { NextResponse } from 'next/server';
import { DEFAULT_BEEHIIV_API_BASE_URL, resolveBeehiivApiBaseUrl } from '@/lib/beehiiv-api.mjs';
import { ratelimit } from '@/lib/rate-limit';
import {
  getAllowedOrigins,
  getRequestIp,
  getSubmittedOrigin,
  isVerifiedSameSiteRequest,
  parseJsonRequestBody,
  sanitizeMarketingField,
} from '@/lib/request-security.mjs';

/* ────────────────────────────────────────────────────────────────────────────
 * B2B Lead Capture API route
 *
 * This route is deliberately separate from /api/subscribe.  The subscribe
 * route is optimised for low-friction newsletter signups.  This route
 * enforces work-email validation, collects job-title metadata as a Beehiiv
 * custom field, and routes leads through a dedicated Beehiiv automation
 * that delivers gated content (e.g. the AI Security Matrix PDF).
 *
 * Flow:
 *   1. Validate origin, honeypot, email format, work-email domain.
 *   2. Validate job title against the allowed list.
 *   3. Rate-limit by IP.
 *   4. Create Beehiiv subscription with custom_fields for job_title,
 *      lead_source, and asset_requested.
 *   5. Return success — NO download link in the response.
 *      The Beehiiv automation email delivers the PDF.
 * ──────────────────────────────────────────────────────────────────────── */

// ── Config ────────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const REQUEST_TIMEOUT_MS = 10_000;
const MAX_RETRY_ATTEMPTS = 2;
const RETRY_BASE_DELAY_MS = 250;
const RETRY_JITTER_MS = 100;
const RETRYABLE_STATUS_CODES = new Set<number>([429, 503]);
const JSON_BODY_LIMIT_BYTES = 4 * 1024;
const AUTOMATION_ID_PATTERN = /^[a-z0-9_-]+$/i;

/** Domains rejected server-side.  Must match or exceed the client-side list. */
const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'yahoo.co.in',
  'yahoo.ca',
  'hotmail.com',
  'hotmail.co.uk',
  'outlook.com',
  'outlook.co.uk',
  'live.com',
  'live.co.uk',
  'aol.com',
  'icloud.com',
  'me.com',
  'mac.com',
  'mail.com',
  'protonmail.com',
  'proton.me',
  'pm.me',
  'gmx.com',
  'gmx.net',
  'zoho.com',
  'yandex.com',
  'yandex.ru',
  'tutanota.com',
  'tuta.com',
  'fastmail.com',
  'hey.com',
  'mail.ru',
  'inbox.com',
  'rocketmail.com',
  'ymail.com',
  'msn.com',
  'qq.com',
  '163.com',
  '126.com',
  'sina.com',
  'naver.com',
  'hanmail.net',
  'daum.net',
  'rediffmail.com',
  'web.de',
  'posteo.de',
  'mailinator.com',
  'guerrillamail.com',
  'tempmail.com',
  'throwaway.email',
  'sharklasers.com',
  'guerrillamailblock.com',
  'grr.la',
  'dispostable.com',
  'yopmail.com',
  'maildrop.cc',
  'trashmail.com',
]);

/** Server-side allowlist — must match the client-side JOB_TITLES. */
const VALID_JOB_TITLES = new Set([
  'CISO / CSO',
  'VP of Security',
  'Security Engineer',
  'AppSec Engineer',
  'DevSecOps Engineer',
  'Cloud Security Engineer',
  'SOC Analyst',
  'Penetration Tester',
  'Security Architect',
  'Engineering Manager',
  'CTO / VP Engineering',
  'AI / ML Engineer',
  'Software Engineer',
  'Consultant / Advisor',
  'Student / Researcher',
  'Other',
]);

// ── Types ─────────────────────────────────────────────────────────────────

type LeadCapturePayload = {
  email?: string;
  jobTitle?: string;
  source?: string;
  asset?: string;
  website?: string; // honeypot
};

type BeehiivCustomField = {
  name: string;
  value: string;
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
  custom_fields?: BeehiivCustomField[];
};

type BeehiivErrorPayload = {
  errors?: Array<{ message?: string }>;
};

type RateLimitResponse = {
  success: boolean;
  reset: number;
};

// ── Helpers ───────────────────────────────────────────────────────────────

function getBeehiivConfig() {
  const apiKey = process.env.BEEHIIV_API_KEY?.trim();
  const publicationId = process.env.BEEHIIV_PUBLICATION_ID?.trim();
  const rawApiBaseUrl = process.env.BEEHIIV_API_BASE_URL?.trim();
  const resolvedApiBaseUrl = resolveBeehiivApiBaseUrl(rawApiBaseUrl);

  return {
    apiKey,
    publicationId,
    apiBaseUrl: resolvedApiBaseUrl ?? DEFAULT_BEEHIIV_API_BASE_URL,
    configured: Boolean(apiKey && publicationId && resolvedApiBaseUrl),
    invalidApiBaseUrl: Boolean(rawApiBaseUrl && !resolvedApiBaseUrl),
  };
}

function getLeadAutomationIds(): string[] {
  // Prefer dedicated lead-capture automation; fall back to general welcome.
  const leadAutomationId = process.env.BEEHIIV_LEAD_AUTOMATION_ID?.trim();
  if (leadAutomationId && AUTOMATION_ID_PATTERN.test(leadAutomationId)) return [leadAutomationId];

  const welcomeAutomationId = process.env.BEEHIIV_WELCOME_AUTOMATION_ID?.trim();
  if (welcomeAutomationId && AUTOMATION_ID_PATTERN.test(welcomeAutomationId)) return [welcomeAutomationId];

  return [];
}

function getRetryAfterSeconds(resetAt: number): string {
  return String(Math.max(Math.ceil((resetAt - Date.now()) / 1000), 1));
}

function jsonResponse(body: Record<string, unknown>, init: ResponseInit): Response {
  const headers = new Headers(init.headers);
  headers.set('Cache-Control', 'no-store');

  return NextResponse.json(body, {
    ...init,
    headers,
  });
}

function isWorkEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Beehiiv request logic ─────────────────────────────────────────────────

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Beehiiv request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw new Error(`Beehiiv network error: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    clearTimeout(timeout);
  }
}

function getRetryDelay(attempt: number, headers: Headers): number {
  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const seconds = Number(retryAfter);
    if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000;
  }
  return RETRY_BASE_DELAY_MS * 2 ** (attempt - 1) + Math.floor(Math.random() * RETRY_JITTER_MS);
}

async function createBeehiivSubscription(
  apiBaseUrl: string,
  publicationId: string,
  apiKey: string,
  body: BeehiivSubscribeBody,
): Promise<Response> {
  const url = `${apiBaseUrl}/v2/publications/${publicationId}/subscriptions`;
  const init: RequestInit = {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  };

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt += 1) {
    const response = await fetchWithTimeout(url, init);

    if (response.ok || !RETRYABLE_STATUS_CODES.has(response.status) || attempt === MAX_RETRY_ATTEMPTS) {
      return response;
    }

    const retryMs = getRetryDelay(attempt, response.headers);
    console.warn(JSON.stringify({
      level: 'warn',
      event: 'lead_capture_beehiiv_retry',
      attempt,
      status: response.status,
      retry_ms: retryMs,
    }));
    await delay(retryMs);
  }

  throw new Error('Beehiiv subscription request exhausted retries without returning a response.');
}

function getUpstreamErrorMessage(payload: unknown): string {
  if (
    typeof payload === 'object' &&
    payload !== null &&
    'errors' in payload &&
    Array.isArray((payload as BeehiivErrorPayload).errors)
  ) {
    return ((payload as BeehiivErrorPayload).errors ?? [])
      .map((e) => e.message)
      .filter(Boolean)
      .join(' ');
  }
  return '';
}

function getPublicUpstreamMessage(status: number): string {
  if (status === 429) {
    return 'Too many report requests are being processed right now. Please try again in a minute.';
  }

  if (status >= 400 && status < 500) {
    return 'The report request was rejected. Double-check the submitted details and try again.';
  }

  return 'Could not process your request right now. Try again in a moment.';
}

// ── Structured logging ────────────────────────────────────────────────────

function logLeadCapture(email: string, jobTitle: string, source: string, asset: string): void {
  console.info(JSON.stringify({
    level: 'info',
    event: 'lead_captured',
    email_domain: email.split('@')[1],
    job_title: jobTitle,
    source,
    asset,
    timestamp: new Date().toISOString(),
  }));
}

function logRejection(reason: string, request: Request, source: string): void {
  console.warn(JSON.stringify({
    level: 'warn',
    event: 'lead_capture_rejected',
    reason,
    source,
    submitted_origin: getSubmittedOrigin(request),
  }));
}

function logError(failure: string, message: string): void {
  console.error(JSON.stringify({
    level: 'error',
    event: 'lead_capture_failed',
    failure,
    error_message: message,
  }));
}

// ── POST handler ──────────────────────────────────────────────────────────

export async function POST(request: Request): Promise<Response> {
  const parsedBody = await parseJsonRequestBody(request, {
    maxBytes: JSON_BODY_LIMIT_BYTES,
    invalidJsonMessage: 'Invalid request body.',
    invalidShapeMessage: 'Request body must be a JSON object.',
    unsupportedMediaTypeMessage: 'This endpoint only accepts application/json payloads.',
    tooLargeMessage: 'The request body is too large.',
  });

  if (!parsedBody.ok) {
    return jsonResponse(
      { ok: false, message: parsedBody.message },
      { status: parsedBody.status },
    );
  }

  const payload = parsedBody.value as LeadCapturePayload;

  const email = payload?.email?.trim().toLowerCase() ?? '';
  const jobTitle = payload?.jobTitle?.trim() ?? '';
  const source = sanitizeMarketingField(payload?.source, 'lead-capture');
  const asset = sanitizeMarketingField(payload?.asset, 'unknown');
  const honeypot = payload?.website?.trim() ?? '';

  // 2. Origin check
  if (!isVerifiedSameSiteRequest(request)) {
    logRejection('origin_mismatch', request, source);
    return jsonResponse(
      { ok: false, message: 'This request could not be verified. Refresh the page and try again.' },
      { status: 403 },
    );
  }

  // 3. Honeypot
  if (honeypot.length > 0) {
    logRejection('honeypot_filled', request, source);
    return jsonResponse(
      { ok: false, message: 'This request could not be verified. Refresh the page and try again.' },
      { status: 400 },
    );
  }

  // 4. Email format
  if (!email || !EMAIL_REGEX.test(email)) {
    return jsonResponse(
      { ok: false, message: 'Enter a valid email address.' },
      { status: 400 },
    );
  }

  // 5. Work-email enforcement (server-side — never trust the client)
  if (!isWorkEmail(email)) {
    return jsonResponse(
      { ok: false, message: 'Please use your corporate email address to receive the enterprise report.' },
      { status: 400 },
    );
  }

  // 6. Job title validation
  if (!jobTitle || !VALID_JOB_TITLES.has(jobTitle)) {
    return jsonResponse(
      { ok: false, message: 'Please select your role.' },
      { status: 400 },
    );
  }

  // 7. Rate limiting
  const ip = getRequestIp(request);
  let rateLimitResult: RateLimitResponse;

  try {
    rateLimitResult = (await ratelimit.limit(`lead:${ip}`)) as RateLimitResponse;
  } catch (error) {
    logError('rate_limit', error instanceof Error ? error.message : String(error));
    return jsonResponse(
      { ok: false, message: 'Service temporarily unavailable. Try again shortly.' },
      { status: 503 },
    );
  }

  if (!rateLimitResult.success) {
    return jsonResponse(
      { ok: false, message: 'Too many requests. Please try again in a minute.' },
      {
        status: 429,
        headers: { 'Retry-After': getRetryAfterSeconds(rateLimitResult.reset) },
      },
    );
  }

  // 8. Beehiiv config
  const { apiKey, publicationId, apiBaseUrl, configured, invalidApiBaseUrl } = getBeehiivConfig();

  if (!configured || !apiKey || !publicationId) {
    if (invalidApiBaseUrl) {
      logError('config', 'Invalid BEEHIIV_API_BASE_URL configuration.');
    }

    return jsonResponse(
      { ok: false, message: 'Could not process your request right now. Try again in a moment.' },
      { status: 503 },
    );
  }

  // 9. Build Beehiiv payload with custom fields
  const automationIds = getLeadAutomationIds();
  const referringSite = getSubmittedOrigin(request) ?? getAllowedOrigins(request)[0] ?? '';

  const beehiivBody: BeehiivSubscribeBody = {
    email,
    reactivate_existing: false,
    send_welcome_email: automationIds.length === 0, // Let automation handle delivery
    utm_source: 'website',
    utm_medium: 'lead-capture',
    utm_campaign: `report:${asset}`,
    utm_content: source,
    custom_fields: [
      { name: 'job_title', value: jobTitle },
      { name: 'lead_source', value: source },
      { name: 'asset_requested', value: asset },
    ],
    ...(referringSite ? { referring_site: referringSite } : {}),
    ...(automationIds.length > 0 ? { automation_ids: automationIds } : {}),
  };

  // 10. Create subscription
  let upstreamResponse: Response;

  try {
    upstreamResponse = await createBeehiivSubscription(apiBaseUrl, publicationId, apiKey, beehiivBody);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logError('beehiiv_request', errorMessage);

    const status = errorMessage.includes('timed out') ? 504 : 502;
    return jsonResponse(
      { ok: false, message: 'Could not process your request right now. Try again in a moment.' },
      { status },
    );
  }

  // 11. Handle upstream response
  let upstreamPayload: unknown = null;
  try {
    upstreamPayload = await upstreamResponse.json();
  } catch {
    upstreamPayload = null;
  }

  if (!upstreamResponse.ok) {
    const upstreamMessage = getUpstreamErrorMessage(upstreamPayload);
    logError('beehiiv_upstream', upstreamMessage || `HTTP ${upstreamResponse.status}`);

    return jsonResponse(
      { ok: false, message: getPublicUpstreamMessage(upstreamResponse.status) },
      { status: upstreamResponse.status },
    );
  }

  // 12. Success — log and respond.  NO download link in the response.
  logLeadCapture(email, jobTitle, source, asset);

  return jsonResponse(
    {
      ok: true,
      message: 'Check your inbox — the report is on its way. It may take a minute to arrive.',
    },
    { status: 200 },
  );
}
