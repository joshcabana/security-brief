export const DEFAULT_BEEHIIV_API_BASE_URL = 'https://api.beehiiv.com';
const APPROVED_BEEHIIV_HOSTS = new Set(['api.beehiiv.com']);
const LOOPBACK_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

function normalizeHostname(hostname) {
  return hostname.replace(/^\[|\]$/g, '').toLowerCase();
}

/**
 * @param {unknown} rawValue
 * @returns {string | null}
 */
export function resolveBeehiivApiBaseUrl(rawValue) {
  if (typeof rawValue !== 'string' || rawValue.trim().length === 0) {
    return DEFAULT_BEEHIIV_API_BASE_URL;
  }

  let parsed;

  try {
    parsed = new URL(rawValue.trim());
  } catch {
    return null;
  }

  if (parsed.username || parsed.password || parsed.search || parsed.hash) {
    return null;
  }

  const normalizedHostname = normalizeHostname(parsed.hostname);
  const isLoopbackHost = LOOPBACK_HOSTS.has(normalizedHostname);
  const isApprovedBeehiivHost = APPROVED_BEEHIIV_HOSTS.has(normalizedHostname);

  if (isLoopbackHost) {
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return null;
    }
  } else if (parsed.protocol !== 'https:' || !isApprovedBeehiivHost) {
    return null;
  }

  const normalizedPathname = parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${normalizedPathname}`;
}
