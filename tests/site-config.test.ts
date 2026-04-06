import assert from 'node:assert/strict';
import test from 'node:test';
import { siteConfig } from '../lib/site';

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
