import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LINKEDIN_INSIGHT_SCRIPT_URL,
  PLAUSIBLE_SCRIPT_URL,
  PRIVACY_ANALYTICS_COPY,
  evaluatePrivacyAnalyticsContract,
  resolveAnalyticsState,
} from '../lib/analytics-config.mjs';

test('analytics state resolution reflects the configured tracking stack', () => {
  assert.deepEqual(resolveAnalyticsState('aithreatbrief.com', ''), {
    plausibleDomain: 'aithreatbrief.com',
    plausibleEnabled: true,
    linkedInPartnerId: '',
    linkedInInsightEnabled: false,
    analyticsEnabled: true,
    privacyDeclaration: PRIVACY_ANALYTICS_COPY.plausible,
  });

  assert.deepEqual(resolveAnalyticsState('', '12345'), {
    plausibleDomain: '',
    plausibleEnabled: false,
    linkedInPartnerId: '12345',
    linkedInInsightEnabled: true,
    analyticsEnabled: true,
    privacyDeclaration: PRIVACY_ANALYTICS_COPY.linkedin,
  });

  assert.deepEqual(resolveAnalyticsState('', ''), {
    plausibleDomain: '',
    plausibleEnabled: false,
    linkedInPartnerId: '',
    linkedInInsightEnabled: false,
    analyticsEnabled: false,
    privacyDeclaration: PRIVACY_ANALYTICS_COPY.none,
  });
});

test('privacy analytics contract passes for plausible-only, linkedin-only, and disabled states', () => {
  const plausibleHtml = `<html><body>${PRIVACY_ANALYTICS_COPY.plausible}<script src="${PLAUSIBLE_SCRIPT_URL}"></script></body></html>`;
  const linkedInHtml = `<html><body>${PRIVACY_ANALYTICS_COPY.linkedin}<script src="${LINKEDIN_INSIGHT_SCRIPT_URL}"></script></body></html>`;
  const disabledHtml = `<html><body>${PRIVACY_ANALYTICS_COPY.none}</body></html>`;

  assert.equal(
    evaluatePrivacyAnalyticsContract({ plausibleEnabled: true, linkedInInsightEnabled: false, html: plausibleHtml }).ok,
    true,
  );
  assert.equal(
    evaluatePrivacyAnalyticsContract({ plausibleEnabled: false, linkedInInsightEnabled: true, html: linkedInHtml }).ok,
    true,
  );
  assert.equal(
    evaluatePrivacyAnalyticsContract({ plausibleEnabled: false, linkedInInsightEnabled: false, html: disabledHtml }).ok,
    true,
  );
});

test('privacy analytics contract flags mismatches between disclosure and rendered script state', () => {
  const missingLinkedInScriptHtml = `<html><body>${PRIVACY_ANALYTICS_COPY.linkedin}</body></html>`;
  const missingDisclosureHtml = `<html><body><script src="${PLAUSIBLE_SCRIPT_URL}"></script></body></html>`;

  const missingLinkedInScriptResult = evaluatePrivacyAnalyticsContract({
    plausibleEnabled: false,
    linkedInInsightEnabled: true,
    html: missingLinkedInScriptHtml,
  });
  const missingDisclosureResult = evaluatePrivacyAnalyticsContract({
    plausibleEnabled: true,
    linkedInInsightEnabled: false,
    html: missingDisclosureHtml,
  });

  assert.equal(missingLinkedInScriptResult.ok, false);
  assert.match(missingLinkedInScriptResult.message, /LinkedIn Insight script is missing/i);
  assert.equal(missingDisclosureResult.ok, false);
  assert.match(missingDisclosureResult.message, /disclosure does not match/i);
});
