import assert from 'node:assert/strict';
import test from 'node:test';
import { isBeehiivCheckoutLive, siteConfig } from '../lib/site';

test('Beehiiv runtime config targets the AI Security Brief publication host', () => {
  assert.equal(siteConfig.beehiiv.upgradeUrl, 'https://aisec.beehiiv.com/upgrade');
  assert.equal(siteConfig.beehiiv.loginUrl, 'https://aisec.beehiiv.com/login');
});

test('Beehiiv runtime config uses the same publication hostname for member flows', () => {
  const upgradeUrl = new URL(siteConfig.beehiiv.upgradeUrl);
  const loginUrl = new URL(siteConfig.beehiiv.loginUrl);

  assert.equal(upgradeUrl.hostname, 'aisec.beehiiv.com');
  assert.equal(loginUrl.hostname, 'aisec.beehiiv.com');
});

test('Beehiiv checkout stays disabled by default until public checkout is explicitly enabled', () => {
  assert.equal(siteConfig.beehiiv.checkoutLive, false);
  assert.equal(isBeehiivCheckoutLive({}), false);
  assert.equal(isBeehiivCheckoutLive({ NEXT_PUBLIC_PRO_CHECKOUT_LIVE: 'false' }), false);
  assert.equal(isBeehiivCheckoutLive({ NEXT_PUBLIC_PRO_CHECKOUT_LIVE: ' true ' }), true);
});
