import { isIP } from 'node:net';
import { Buffer } from 'node:buffer';

export const REQUEST_IP_FALLBACK = 'anonymous';
export const MAX_MARKETING_FIELD_LENGTH = 64;
export const DEFAULT_JSON_BODY_LIMIT_BYTES = 8 * 1024;

const REQUEST_IP_HEADERS = ['x-vercel-forwarded-for', 'x-real-ip', 'x-forwarded-for'];
const MARKETING_FIELD_PATTERN = /^[a-z0-9-]+$/;

function normalizeConfiguredOrigin(rawValue) {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return null;
  }

  try {
    return new URL(rawValue.trim()).origin;
  } catch {
    return null;
  }
}

function normalizeIpCandidate(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const [firstToken] = rawValue.split(',');
  const candidate = firstToken?.trim();

  if (!candidate) {
    return null;
  }

  const bracketedMatch = candidate.match(/^\[([^\]]+)\](?::\d+)?$/);
  const hostCandidate = bracketedMatch?.[1] ?? candidate;
  const maybePortlessCandidate =
    hostCandidate.includes('.') &&
    hostCandidate.includes(':') &&
    hostCandidate.indexOf(':') === hostCandidate.lastIndexOf(':')
      ? hostCandidate.slice(0, hostCandidate.lastIndexOf(':'))
      : hostCandidate;

  return isIP(maybePortlessCandidate) ? maybePortlessCandidate : null;
}

/**
 * @param {Request} request
 * @returns {string[]}
 */
export function getAllowedOrigins(request) {
  const allowedOrigins = new Set([new URL(request.url).origin]);
  const configuredSiteOrigin = normalizeConfiguredOrigin(process.env.NEXT_PUBLIC_SITE_URL);

  if (configuredSiteOrigin) {
    allowedOrigins.add(configuredSiteOrigin);
  }

  return Array.from(allowedOrigins);
}

/**
 * @param {Request} request
 * @returns {string | null}
 */
export function getSubmittedOrigin(request) {
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

/**
 * @param {Request} request
 * @returns {boolean}
 */
export function isVerifiedSameSiteRequest(request) {
  const submittedOrigin = getSubmittedOrigin(request);

  if (!submittedOrigin) {
    return false;
  }

  return getAllowedOrigins(request).includes(submittedOrigin);
}

/**
 * @param {Request} request
 * @returns {boolean}
 */
export function hasJsonContentType(request) {
  const contentType = request.headers.get('content-type');

  if (!contentType) {
    return false;
  }

  const normalized = contentType.split(';', 1)[0]?.trim().toLowerCase();
  return normalized === 'application/json' || normalized?.endsWith('+json') === true;
}

/**
 * @param {Request} request
 * @returns {number | null}
 */
export function getDeclaredContentLength(request) {
  const rawValue = request.headers.get('content-length');

  if (!rawValue) {
    return null;
  }

  const parsed = Number(rawValue);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/**
 * @param {Request} request
 * @param {{
 *   maxBytes?: number,
 *   invalidJsonMessage?: string,
 *   invalidShapeMessage?: string,
 *   unsupportedMediaTypeMessage?: string,
 *   tooLargeMessage?: string,
 * }} [options]
 * @returns {Promise<
 *   | { ok: true, value: Record<string, unknown> }
 *   | { ok: false, status: number, message: string }
 * >}
 */
export async function parseJsonRequestBody(request, options = {}) {
  const {
    maxBytes = DEFAULT_JSON_BODY_LIMIT_BYTES,
    invalidJsonMessage = 'The request body was invalid JSON.',
    invalidShapeMessage = 'The request body must be a JSON object.',
    unsupportedMediaTypeMessage = 'This endpoint only accepts application/json payloads.',
    tooLargeMessage = 'The request body is too large.',
  } = options;

  if (!hasJsonContentType(request)) {
    return {
      ok: false,
      status: 415,
      message: unsupportedMediaTypeMessage,
    };
  }

  const declaredLength = getDeclaredContentLength(request);

  if (declaredLength !== null && declaredLength > maxBytes) {
    return {
      ok: false,
      status: 413,
      message: tooLargeMessage,
    };
  }

  let rawBody;

  try {
    rawBody = await request.text();
  } catch {
    return {
      ok: false,
      status: 400,
      message: invalidJsonMessage,
    };
  }

  if (Buffer.byteLength(rawBody, 'utf8') > maxBytes) {
    return {
      ok: false,
      status: 413,
      message: tooLargeMessage,
    };
  }

  let parsed;

  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return {
      ok: false,
      status: 400,
      message: invalidJsonMessage,
    };
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    return {
      ok: false,
      status: 400,
      message: invalidShapeMessage,
    };
  }

  return {
    ok: true,
    value: parsed,
  };
}

/**
 * @param {Request} request
 * @returns {string}
 */
export function getRequestIp(request) {
  for (const headerName of REQUEST_IP_HEADERS) {
    const normalizedIp = normalizeIpCandidate(request.headers.get(headerName));

    if (normalizedIp) {
      return normalizedIp;
    }
  }

  return REQUEST_IP_FALLBACK;
}

/**
 * @param {unknown} rawValue
 * @param {string} fallbackValue
 * @returns {string}
 */
export function sanitizeMarketingField(rawValue, fallbackValue) {
  const normalizedFallback = typeof fallbackValue === 'string' ? fallbackValue.trim().toLowerCase() : '';

  if (!MARKETING_FIELD_PATTERN.test(normalizedFallback)) {
    throw new Error(`Invalid fallback marketing field: ${String(fallbackValue)}`);
  }

  if (typeof rawValue !== 'string') {
    return normalizedFallback;
  }

  const normalizedValue = rawValue.trim().toLowerCase();

  if (
    normalizedValue.length === 0 ||
    normalizedValue.length > MAX_MARKETING_FIELD_LENGTH ||
    !MARKETING_FIELD_PATTERN.test(normalizedValue)
  ) {
    return normalizedFallback;
  }

  return normalizedValue;
}
