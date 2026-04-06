import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PLAUSIBLE_SCRIPT_URL,
  PRIVACY_ANALYTICS_COPY,
  evaluatePrivacyAnalyticsContract,
  resolveAnalyticsState,
} from '../lib/analytics-config.mjs';

test('analytics state resolution reflects whether a Plausible domain is configured', () => {
  assert.deepEqual(resolveAnalyticsState('aithreatbrief.com'), {
    plausibleDomain: 'aithreatbrief.com',
    analyticsEnabled: true,
    privacyDeclaration: PRIVACY_ANALYTICS_COPY.enabled,
  });

  assert.deepEqual(resolveAnalyticsState(''), {
    plausibleDomain: '',
    analyticsEnabled: false,
    privacyDeclaration: PRIVACY_ANALYTICS_COPY.disabled,
  });
});

test('privacy analytics contract passes when rendered script presence matches disclosure', () => {
  const enabledHtml = `<html><body>${PRIVACY_ANALYTICS_COPY.enabled}<script src="${PLAUSIBLE_SCRIPT_URL}"></script></body></html>`;
  const disabledHtml = `<html><body>${PRIVACY_ANALYTICS_COPY.disabled}</body></html>`;

  assert.equal(
    evaluatePrivacyAnalyticsContract({ analyticsEnabled: true, html: enabledHtml }).ok,
    true,
  );
  assert.equal(
    evaluatePrivacyAnalyticsContract({ analyticsEnabled: false, html: disabledHtml }).ok,
    true,
  );
});

test('privacy analytics contract flags mismatches between disclosure and rendered script state', () => {
  const missingScriptHtml = `<html><body>${PRIVACY_ANALYTICS_COPY.enabled}</body></html>`;
  const missingDisclosureHtml = `<html><body><script src="${PLAUSIBLE_SCRIPT_URL}"></script></body></html>`;

  const missingScriptResult = evaluatePrivacyAnalyticsContract({
    analyticsEnabled: true,
    html: missingScriptHtml,
  });
  const missingDisclosureResult = evaluatePrivacyAnalyticsContract({
    analyticsEnabled: false,
    html: missingDisclosureHtml,
  });

  assert.equal(missingScriptResult.ok, false);
  assert.match(missingScriptResult.message, /script is missing/i);
  assert.equal(missingDisclosureResult.ok, false);
  assert.match(missingDisclosureResult.message, /script is present/i);
});
