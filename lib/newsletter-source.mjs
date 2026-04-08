const NEWSLETTER_SOURCE_PATTERN = /^[a-z0-9-]+$/;
export const MAX_NEWSLETTER_SOURCE_LENGTH = 64;

/**
 * @param {unknown} rawValue
 * @returns {string | null}
 */
export function sanitizeNewsletterSource(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const value = rawValue.trim();

  if (!value || value.length > MAX_NEWSLETTER_SOURCE_LENGTH) {
    return null;
  }

  return NEWSLETTER_SOURCE_PATTERN.test(value) ? value : null;
}

/**
 * @param {unknown} rawValue
 * @returns {string | null}
 */
export function coerceSingleSearchParamValue(rawValue) {
  if (Array.isArray(rawValue)) {
    return typeof rawValue[0] === 'string' ? rawValue[0] : null;
  }

  return typeof rawValue === 'string' ? rawValue : null;
}

/**
 * @param {unknown} rawValue
 * @param {string} fallbackSource
 * @returns {string}
 */
export function resolveNewsletterSource(rawValue, fallbackSource) {
  const sanitizedFallbackSource = sanitizeNewsletterSource(fallbackSource);

  if (sanitizedFallbackSource === null) {
    throw new Error(`Invalid fallback newsletter source: ${String(fallbackSource)}`);
  }

  return sanitizeNewsletterSource(rawValue) ?? sanitizedFallbackSource;
}

/**
 * @param {string} source
 * @returns {string}
 */
export function buildNewsletterPath(source) {
  const sanitizedSource = sanitizeNewsletterSource(source);

  if (sanitizedSource === null) {
    throw new Error(`Invalid newsletter source: ${String(source)}`);
  }

  return `/newsletter?source=${encodeURIComponent(sanitizedSource)}`;
}
