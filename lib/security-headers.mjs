export const CSP_NONCE_HEADER = 'x-csp-nonce';
export const CSP_NONCE_PLACEHOLDER = '__CSP_NONCE__';

export function buildContentSecurityPolicy(scriptNonce = CSP_NONCE_PLACEHOLDER) {
  return [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "object-src 'none'",
    `script-src 'self' 'nonce-${scriptNonce}' https://plausible.io https://snap.licdn.com`,
    "script-src-attr 'none'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https: https://px.ads.linkedin.com",
    "font-src 'self' data:",
    "connect-src 'self' https://plausible.io https://snap.licdn.com https://www.linkedin.com",
  ].join('; ');
}

export const CONTENT_SECURITY_POLICY = buildContentSecurityPolicy();

const STATIC_SECURITY_HEADERS = Object.freeze([
  Object.freeze({ key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }),
  Object.freeze({ key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=()' }),
  Object.freeze({ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }),
  Object.freeze({ key: 'X-Content-Type-Options', value: 'nosniff' }),
  Object.freeze({ key: 'X-Frame-Options', value: 'DENY' }),
]);

const SECURITY_HEADERS = Object.freeze([
  Object.freeze({ key: 'Content-Security-Policy', value: CONTENT_SECURITY_POLICY }),
  ...STATIC_SECURITY_HEADERS,
]);

export function getStaticSecurityHeaders() {
  return STATIC_SECURITY_HEADERS.map((header) => ({ ...header }));
}

export function getSecurityHeaders({ scriptNonce } = {}) {
  return [
    { key: 'Content-Security-Policy', value: buildContentSecurityPolicy(scriptNonce) },
    ...getStaticSecurityHeaders(),
  ];
}

export function getExpectedSecurityHeaderValue(name, options = {}) {
  const header = getSecurityHeaders(options).find(
    (candidate) => candidate.key.toLowerCase() === name.toLowerCase(),
  );

  return header?.value ?? null;
}

export function getScriptNonce(headersLike) {
  return headersLike?.get?.(CSP_NONCE_HEADER) ?? undefined;
}

export {
  SECURITY_HEADERS,
  STATIC_SECURITY_HEADERS,
};
