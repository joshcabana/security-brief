const CONTROL_CHAR_PATTERN = /[\u0000-\u001F\u007F]/;

function normalizeRawValue(rawValue) {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmedValue = rawValue.trim();

  if (
    trimmedValue.length === 0 ||
    trimmedValue.includes('{') ||
    trimmedValue.includes('}') ||
    CONTROL_CHAR_PATTERN.test(trimmedValue)
  ) {
    return null;
  }

  return trimmedValue;
}

function isSafeRelativeTarget(value) {
  if (value.startsWith('//') || value.startsWith('\\\\')) {
    return false;
  }

  return (
    value.startsWith('/') ||
    value.startsWith('./') ||
    value.startsWith('../') ||
    value.startsWith('#') ||
    value.startsWith('?')
  );
}

/**
 * @param {unknown} rawValue
 * @param {{ allowRelative?: boolean, requireHttps?: boolean }} [options]
 * @returns {string | null}
 */
export function normalizeLinkTarget(rawValue, options = {}) {
  const normalizedValue = normalizeRawValue(rawValue);

  if (!normalizedValue) {
    return null;
  }

  const { allowRelative = false, requireHttps = false } = options;

  if (allowRelative && isSafeRelativeTarget(normalizedValue)) {
    return normalizedValue;
  }

  let parsed;

  try {
    parsed = new URL(normalizedValue);
  } catch {
    return null;
  }

  if (parsed.username || parsed.password) {
    return null;
  }

  if (requireHttps) {
    return parsed.protocol === 'https:' ? normalizedValue : null;
  }

  return parsed.protocol === 'http:' || parsed.protocol === 'https:' ? normalizedValue : null;
}

/**
 * Outbound affiliate and vendor CTAs are treated as a trust boundary.
 * Only absolute HTTPS URLs are renderable.
 *
 * @param {unknown} rawValue
 * @returns {string | null}
 */
export function normalizeOutboundUrl(rawValue) {
  return normalizeLinkTarget(rawValue, { requireHttps: true });
}
