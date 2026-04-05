export const PLAUSIBLE_SCRIPT_URL = 'https://plausible.io/js/script.js';

export const PRIVACY_ANALYTICS_COPY = Object.freeze({
  enabled:
    'This site uses Plausible Analytics, a privacy-focused, cookie-free analytics service.',
  disabled:
    'This site does not use any client-side analytics scripts or cross-site tracking cookies.',
});

/**
 * @param {unknown} rawPlausibleDomain
 * @returns {{ plausibleDomain: string, analyticsEnabled: boolean, privacyDeclaration: string }}
 */
export function resolveAnalyticsState(rawPlausibleDomain) {
  const plausibleDomain = typeof rawPlausibleDomain === 'string' ? rawPlausibleDomain.trim() : '';
  const analyticsEnabled = plausibleDomain.length > 0;

  return {
    plausibleDomain,
    analyticsEnabled,
    privacyDeclaration: analyticsEnabled
      ? PRIVACY_ANALYTICS_COPY.enabled
      : PRIVACY_ANALYTICS_COPY.disabled,
  };
}

/**
 * @param {string} html
 * @returns {{ hasPlausibleScript: boolean, declaredState: 'enabled' | 'disabled' | 'conflict' | null }}
 */
export function detectRenderedAnalyticsState(html) {
  const declaresEnabled = html.includes(PRIVACY_ANALYTICS_COPY.enabled);
  const declaresDisabled = html.includes(PRIVACY_ANALYTICS_COPY.disabled);

  let declaredState = null;

  if (declaresEnabled && declaresDisabled) {
    declaredState = 'conflict';
  } else if (declaresEnabled) {
    declaredState = 'enabled';
  } else if (declaresDisabled) {
    declaredState = 'disabled';
  }

  return {
    hasPlausibleScript: html.includes(PLAUSIBLE_SCRIPT_URL),
    declaredState,
  };
}

/**
 * @param {{ analyticsEnabled: boolean, html: string }} input
 * @returns {{ ok: boolean, message: string, hasPlausibleScript: boolean, declaredState: 'enabled' | 'disabled' | 'conflict' | null }}
 */
export function evaluatePrivacyAnalyticsContract(input) {
  const renderedState = detectRenderedAnalyticsState(input.html);

  if (renderedState.declaredState === 'conflict') {
    return {
      ok: false,
      message: 'Privacy policy renders conflicting analytics disclosures.',
      ...renderedState,
    };
  }

  if (input.analyticsEnabled) {
    if (!renderedState.hasPlausibleScript) {
      return {
        ok: false,
        message: 'Plausible script is missing while NEXT_PUBLIC_PLAUSIBLE_DOMAIN is set.',
        ...renderedState,
      };
    }

    if (renderedState.declaredState !== 'enabled') {
      return {
        ok: false,
        message: 'Privacy policy does not disclose Plausible while analytics are enabled.',
        ...renderedState,
      };
    }
  } else {
    if (renderedState.hasPlausibleScript) {
      return {
        ok: false,
        message: 'Plausible script is present while NEXT_PUBLIC_PLAUSIBLE_DOMAIN is unset.',
        ...renderedState,
      };
    }

    if (renderedState.declaredState !== 'disabled') {
      return {
        ok: false,
        message: 'Privacy policy does not state that client-side analytics are disabled.',
        ...renderedState,
      };
    }
  }

  return {
    ok: true,
    message: 'Rendered analytics script state matches privacy disclosure.',
    ...renderedState,
  };
}
