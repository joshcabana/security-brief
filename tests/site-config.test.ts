import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildSiteUrl,
  getAssessmentBookingUrl,
  getCanonicalSiteUrl,
  getAssessmentPaymentUrl,
  getFounderLinkedInUrl,
  isBeehiivCheckoutLive,
  siteConfig,
} from '../lib/site';

const mutableEnv = process.env as Record<string, string | undefined>;

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

test('site url contract falls back safely and only accepts https or explicit localhost development urls', () => {
  const originalSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const originalNodeEnv = process.env.NODE_ENV;

  mutableEnv.NODE_ENV = 'production';
  delete process.env.NEXT_PUBLIC_SITE_URL;
  assert.equal(getCanonicalSiteUrl(), 'https://aithreatbrief.com');
  assert.equal(buildSiteUrl('/feed.xml'), 'https://aithreatbrief.com/feed.xml');

  process.env.NEXT_PUBLIC_SITE_URL = 'http://evil.example.com';
  assert.equal(getCanonicalSiteUrl(), 'https://aithreatbrief.com');

  mutableEnv.NODE_ENV = 'development';
  process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:4000';
  assert.equal(getCanonicalSiteUrl(), 'http://localhost:4000');
  assert.equal(buildSiteUrl('/tools'), 'http://localhost:4000/tools');

  process.env.NEXT_PUBLIC_SITE_URL = 'https://brief.example.com';
  assert.equal(getCanonicalSiteUrl(), 'https://brief.example.com');

  if (originalSiteUrl === undefined) {
    delete process.env.NEXT_PUBLIC_SITE_URL;
  } else {
    process.env.NEXT_PUBLIC_SITE_URL = originalSiteUrl;
  }

  if (originalNodeEnv === undefined) {
    delete mutableEnv.NODE_ENV;
  } else {
    mutableEnv.NODE_ENV = originalNodeEnv;
  }
});
