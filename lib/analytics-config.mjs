export const PLAUSIBLE_SCRIPT_URL = 'https://plausible.io/js/script.js';
export const LINKEDIN_INSIGHT_SCRIPT_URL = 'https://snap.licdn.com/li.lms-analytics/insight.min.js';

export const PRIVACY_ANALYTICS_COPY = Object.freeze({
  plausible:
    'This site uses Plausible Analytics, a privacy-focused, cookie-free analytics service.',
  linkedin:
    'This site uses the LinkedIn Insight Tag for campaign attribution and conversion measurement.',
  plausibleAndLinkedIn:
    'This site uses Plausible Analytics and the LinkedIn Insight Tag for aggregated traffic measurement and campaign attribution.',
  none:
    'This site does not use any client-side analytics scripts or cross-site tracking cookies.',
});

/**
 * @param {unknown} rawPlausibleDomain
 * @param {unknown} rawLinkedInPartnerId
 * @returns {{ plausibleDomain: string, plausibleEnabled: boolean, linkedInPartnerId: string, linkedInInsightEnabled: boolean, analyticsEnabled: boolean, privacyDeclaration: string }}
 */
export function resolveAnalyticsState(rawPlausibleDomain, rawLinkedInPartnerId) {
  const plausibleDomain = typeof rawPlausibleDomain === 'string' ? rawPlausibleDomain.trim() : '';
  const linkedInPartnerId = typeof rawLinkedInPartnerId === 'string' ? rawLinkedInPartnerId.trim() : '';
  const plausibleEnabled = plausibleDomain.length > 0;
  const linkedInInsightEnabled = linkedInPartnerId.length > 0;
  const analyticsEnabled = plausibleEnabled || linkedInInsightEnabled;
  const privacyDeclaration =
    plausibleEnabled && linkedInInsightEnabled
      ? PRIVACY_ANALYTICS_COPY.plausibleAndLinkedIn
      : plausibleEnabled
        ? PRIVACY_ANALYTICS_COPY.plausible
        : linkedInInsightEnabled
          ? PRIVACY_ANALYTICS_COPY.linkedin
          : PRIVACY_ANALYTICS_COPY.none;

  return {
    plausibleDomain,
    plausibleEnabled,
    linkedInPartnerId,
    linkedInInsightEnabled,
    analyticsEnabled,
    privacyDeclaration,
  };
}

/**
 * @param {string} html
 * @returns {{ hasPlausibleScript: boolean, hasLinkedInInsightScript: boolean, declaredState: 'plausible' | 'linkedin' | 'plausibleAndLinkedIn' | 'none' | 'conflict' | null }}
 */
export function detectRenderedAnalyticsState(html) {
  const declaredStates = Object.entries(PRIVACY_ANALYTICS_COPY)
    .filter(([, copy]) => html.includes(copy))
    .map(([key]) => key);

  let declaredState = /** @type {'plausible' | 'linkedin' | 'plausibleAndLinkedIn' | 'none' | 'conflict' | null} */ (null);

  if (declaredStates.length > 1) {
    declaredState = 'conflict';
  } else if (declaredStates.length === 1) {
    declaredState = /** @type {'plausible' | 'linkedin' | 'plausibleAndLinkedIn' | 'none'} */ (declaredStates[0]);
  }

  return {
    hasPlausibleScript: html.includes(PLAUSIBLE_SCRIPT_URL),
    hasLinkedInInsightScript: html.includes(LINKEDIN_INSIGHT_SCRIPT_URL),
    declaredState,
  };
}

/**
 * @param {{ analyticsEnabled?: boolean, plausibleEnabled?: boolean, linkedInInsightEnabled?: boolean, html: string }} input
 * @returns {{ ok: boolean, message: string, hasPlausibleScript: boolean, hasLinkedInInsightScript: boolean, declaredState: 'plausible' | 'linkedin' | 'plausibleAndLinkedIn' | 'none' | 'conflict' | null }}
 */
export function evaluatePrivacyAnalyticsContract(input) {
  const renderedState = detectRenderedAnalyticsState(input.html);
  const plausibleEnabled = typeof input.plausibleEnabled === 'boolean'
    ? input.plausibleEnabled
    : Boolean(input.analyticsEnabled);
  const linkedInInsightEnabled = input.linkedInInsightEnabled ?? false;
  const expectedDeclaredState = plausibleEnabled && linkedInInsightEnabled
    ? 'plausibleAndLinkedIn'
    : plausibleEnabled
      ? 'plausible'
      : linkedInInsightEnabled
        ? 'linkedin'
        : 'none';

  if (renderedState.declaredState === 'conflict') {
    return {
      ok: false,
      message: 'Privacy policy renders conflicting analytics disclosures.',
      ...renderedState,
    };
  }

  if (renderedState.hasPlausibleScript !== plausibleEnabled) {
    return {
      ok: false,
      message: plausibleEnabled
        ? 'Plausible script is missing while Plausible analytics are enabled.'
        : 'Plausible script is present while Plausible analytics are disabled.',
      ...renderedState,
    };
  }

  if (renderedState.hasLinkedInInsightScript !== linkedInInsightEnabled) {
    return {
      ok: false,
      message: linkedInInsightEnabled
        ? 'LinkedIn Insight script is missing while LinkedIn tracking is enabled.'
        : 'LinkedIn Insight script is present while LinkedIn tracking is disabled.',
      ...renderedState,
    };
  }

  if (renderedState.declaredState !== expectedDeclaredState) {
    return {
      ok: false,
      message: 'Privacy policy disclosure does not match the rendered analytics and tracking configuration.',
      ...renderedState,
    };
  }

  return {
    ok: true,
    message: 'Rendered analytics script state matches privacy disclosure.',
    ...renderedState,
  };
}
