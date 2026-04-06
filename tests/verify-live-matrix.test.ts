import assert from 'node:assert/strict';
import test from 'node:test';
import {
  LIVE_MATRIX_AFFILIATE_ENV,
  LIVE_MATRIX_CASES,
  buildLiveMatrixBaseUrl,
  buildLiveMatrixCaseEnv,
} from '../scripts/verify-live-matrix.mjs';

test('verify-live matrix defines the disabled and enabled analytics states', () => {
  assert.deepEqual(
    LIVE_MATRIX_CASES.map((matrixCase) => ({
      name: matrixCase.name,
      plausibleDomain: matrixCase.plausibleDomain,
    })),
    [
      { name: 'plausible-disabled', plausibleDomain: '' },
      { name: 'plausible-enabled', plausibleDomain: 'aithreatbrief.com' },
    ],
  );
});

test('verify-live matrix builds loopback base urls for local app boots', () => {
  assert.equal(buildLiveMatrixBaseUrl(56366), 'http://127.0.0.1:56366');
});

test('verify-live matrix injects affiliate and analytics env for each app state', () => {
  const env = buildLiveMatrixCaseEnv(56367, 'aithreatbrief.com');

  assert.equal(env.NEXT_PUBLIC_SITE_URL, 'http://127.0.0.1:56367');
  assert.equal(env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN, 'aithreatbrief.com');
  assert.equal(env.AFFILIATE_NORDVPN, LIVE_MATRIX_AFFILIATE_ENV.AFFILIATE_NORDVPN);
  assert.equal(env.AFFILIATE_PUREVPN, LIVE_MATRIX_AFFILIATE_ENV.AFFILIATE_PUREVPN);
  assert.equal(env.AFFILIATE_PROTON_VPN, LIVE_MATRIX_AFFILIATE_ENV.AFFILIATE_PROTON_VPN);
});
