export const DEFAULT_BEEHIIV_API_BASE_URL = 'https://api.beehiiv.com';

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

  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.search ||
    parsed.hash
  ) {
    return null;
  }

  const normalizedPathname = parsed.pathname.replace(/\/+$/, '');
  return `${parsed.origin}${normalizedPathname}`;
}
