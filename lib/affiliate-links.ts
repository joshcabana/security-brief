const AFFILIATE_LINK_PATTERN = /\[([^\]]+)\]\(\[AFFILIATE:([A-Z0-9]+)\]\)/g;
const AFFILIATE_TOKEN_PATTERN = /\[AFFILIATE:([A-Z0-9]+)\]/g;
type AffiliateEnvironment = Readonly<Record<string, string | undefined>>;

function getAffiliateEnvKey(code: string): string {
  return `AFFILIATE_${code}`;
}

function isRenderableAffiliateUrl(value: string): boolean {
  if (value.includes('{') || value.includes('}')) {
    return false;
  }

  try {
    const url = new URL(value);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getAffiliateUrl(code: string, env: AffiliateEnvironment): string | null {
  const rawValue = env[getAffiliateEnvKey(code)];

  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmedValue = rawValue.trim();
  if (trimmedValue.length === 0 || !isRenderableAffiliateUrl(trimmedValue)) {
    return null;
  }

  return trimmedValue;
}

export function getAffiliateUrlByPriority(codes: readonly string[], env: AffiliateEnvironment): string | null {
  for (const code of codes) {
    const affiliateUrl = getAffiliateUrl(code, env);

    if (affiliateUrl) {
      return affiliateUrl;
    }
  }

  return null;
}

/**
 * Resolves article affiliate placeholders from environment variables.
 * Markdown links degrade to plain text when the target URL is not configured.
 */
export function replaceAffiliateTokens(markdown: string, env: AffiliateEnvironment): string {
  const withResolvedLinks = markdown.replace(
    AFFILIATE_LINK_PATTERN,
    (_match: string, label: string, code: string): string => {
      const affiliateUrl = getAffiliateUrl(code, env);
      return affiliateUrl ? `[${label}](${affiliateUrl})` : label;
    },
  );

  return withResolvedLinks.replace(
    AFFILIATE_TOKEN_PATTERN,
    (match: string, code: string): string => {
      const affiliateUrl = getAffiliateUrl(code, env);
      return affiliateUrl ?? match;
    },
  );
}
