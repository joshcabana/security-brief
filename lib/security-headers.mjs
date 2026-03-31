const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' https://plausible.io",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://plausible.io",
].join('; ');

const SECURITY_HEADERS = Object.freeze([
  Object.freeze({ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }),
  Object.freeze({ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }),
  Object.freeze({ key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=()' }),
  Object.freeze({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }),
  Object.freeze({ key: 'X-Content-Type-Options', value: 'nosniff' }),
  Object.freeze({ key: 'X-Frame-Options', value: 'DENY' }),
]);

function getSecurityHeaders() {
  return SECURITY_HEADERS.map((header) => ({ ...header }));
}

function getExpectedSecurityHeaderValue(name) {
  const header = SECURITY_HEADERS.find((candidate) => candidate.key.toLowerCase() === name.toLowerCase());
  return header?.value ?? null;
}

export {
  CONTENT_SECURITY_POLICY,
  SECURITY_HEADERS,
  getExpectedSecurityHeaderValue,
  getSecurityHeaders,
};
