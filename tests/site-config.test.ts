import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAssessmentBookingUrl,
  getAssessmentPaymentUrl,
  getFounderLinkedInUrl,
  isBeehiivCheckoutLive,
  siteConfig,
} from '../lib/site';

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
  const originalValue = process.env.NEXT_PUBLIC_PRO_CHECKOUT_LIVE;

  process.env.NEXT_PUBLIC_PRO_CHECKOUT_LIVE = 'false';
  assert.equal(isBeehiivCheckoutLive(), false);

  process.env.NEXT_PUBLIC_PRO_CHECKOUT_LIVE = ' true ';
  assert.equal(isBeehiivCheckoutLive(), true);

  if (originalValue === undefined) {
    delete process.env.NEXT_PUBLIC_PRO_CHECKOUT_LIVE;
  } else {
    process.env.NEXT_PUBLIC_PRO_CHECKOUT_LIVE = originalValue;
  }
});

test('founder LinkedIn URL defaults to the current public profile and ignores invalid overrides', () => {
  const originalValue = process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL;

  delete process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL;
  assert.equal(getFounderLinkedInUrl(), 'https://www.linkedin.com/in/josh-cabana-351631393/');

  process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL = 'https://www.linkedin.com/in/josh-cabana-351631393/';
  assert.equal(getFounderLinkedInUrl(), 'https://www.linkedin.com/in/josh-cabana-351631393/');

  process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL = 'http://linkedin.com/in/not-allowed';
  assert.equal(getFounderLinkedInUrl(), 'https://www.linkedin.com/in/josh-cabana-351631393/');

  if (originalValue === undefined) {
    delete process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL;
  } else {
    process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL = originalValue;
  }
});

test('assessment booking and payment URLs only accept public https links', () => {
  const originalBookingValue = process.env.NEXT_PUBLIC_ASSESSMENT_BOOKING_URL;
  const originalPaymentValue = process.env.NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL;

  process.env.NEXT_PUBLIC_ASSESSMENT_BOOKING_URL = 'https://cal.example.com/ai-security-brief';
  process.env.NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL = 'https://buy.stripe.com/test_assessment';

  assert.equal(getAssessmentBookingUrl(), 'https://cal.example.com/ai-security-brief');
  assert.equal(getAssessmentPaymentUrl(), 'https://buy.stripe.com/test_assessment');

  process.env.NEXT_PUBLIC_ASSESSMENT_BOOKING_URL = 'mailto:test@example.com';
  process.env.NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL = 'https://user:pass@example.com/private';

  assert.equal(getAssessmentBookingUrl(), null);
  assert.equal(getAssessmentPaymentUrl(), null);

  if (originalBookingValue === undefined) {
    delete process.env.NEXT_PUBLIC_ASSESSMENT_BOOKING_URL;
  } else {
    process.env.NEXT_PUBLIC_ASSESSMENT_BOOKING_URL = originalBookingValue;
  }

  if (originalPaymentValue === undefined) {
    delete process.env.NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL;
  } else {
    process.env.NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL = originalPaymentValue;
  }
});
