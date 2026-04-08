import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertAssessmentRuntimeState,
  getAssessmentVerificationConfig,
  resolveVerificationBaseUrl,
} from '../scripts/verify-production.mjs';

test('resolveVerificationBaseUrl trims a trailing slash from the selected base url', () => {
  assert.equal(
    resolveVerificationBaseUrl('https://aithreatbrief.com/', undefined),
    'https://aithreatbrief.com',
  );
});

test('getAssessmentVerificationConfig resolves public https URLs and the default fallback LinkedIn profile', () => {
  const config = getAssessmentVerificationConfig({
    NEXT_PUBLIC_ASSESSMENT_BOOKING_URL: 'https://cal.example.com/fit-call',
    NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL: 'https://buy.stripe.com/test_assessment',
    NEXT_PUBLIC_LINKEDIN_PROFILE_URL: 'mailto:invalid@example.com',
  });

  assert.deepEqual(config, {
    bookingUrl: 'https://cal.example.com/fit-call',
    paymentUrl: 'https://buy.stripe.com/test_assessment',
    linkedInUrl: 'https://www.linkedin.com/in/josh-cabana-351631393/',
    contactEmail: 'hello@aisecuritybrief.com',
    contactHref: 'mailto:hello@aisecuritybrief.com?subject=AI%20Agent%20Security%20Readiness%20Review',
  });
});

test('assertAssessmentRuntimeState accepts the current fallback assessment funnel state', () => {
  const fallbackHtml = `
    <div>
      <a href="https://www.linkedin.com/in/josh-cabana-351631393/">Message Josh on LinkedIn</a>
      <a href="/report/2026-ai-threat-landscape">Start with the report preview</a>
      <p>Live scheduling is not configured yet.</p>
      <p>Free path for teams still qualifying the review</p>
      <p>Ready to move now?</p>
      <a href="mailto:hello@aisecuritybrief.com?subject=AI%20Agent%20Security%20Readiness%20Review">hello@aisecuritybrief.com</a>
      <p>Payment links are issued after the fit call and expire after 7 days.</p>
    </div>
  `;

  assert.doesNotThrow(() => {
    assertAssessmentRuntimeState(
      fallbackHtml,
      getAssessmentVerificationConfig({
        NEXT_PUBLIC_LINKEDIN_PROFILE_URL: 'https://www.linkedin.com/in/josh-cabana-351631393/',
      }),
    );
  });
});

test('assertAssessmentRuntimeState accepts the live booking and payment state', () => {
  const liveHtml = `
    <div>
      <a href="https://cal.example.com/fit-call">Book the 15-minute fit call</a>
      <a href="/report/2026-ai-threat-landscape">Start with the report preview</a>
      <p>Free path for teams still qualifying the review</p>
      <p>Ready to move now?</p>
      <a href="mailto:hello@aisecuritybrief.com?subject=AI%20Agent%20Security%20Readiness%20Review">Email hello@aisecuritybrief.com</a>
      <a href="https://buy.stripe.com/test_assessment">Secure the review</a>
    </div>
  `;

  assert.doesNotThrow(() => {
    assertAssessmentRuntimeState(
      liveHtml,
      getAssessmentVerificationConfig({
        NEXT_PUBLIC_ASSESSMENT_BOOKING_URL: 'https://cal.example.com/fit-call',
        NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL: 'https://buy.stripe.com/test_assessment',
      }),
    );
  });
});

test('assertAssessmentRuntimeState rejects fallback copy when a booking url is configured', () => {
  const mismatchedHtml = `
    <div>
      <a href="https://cal.example.com/fit-call">Message Josh on LinkedIn</a>
      <a href="/report/2026-ai-threat-landscape">Start with the report preview</a>
      <p>Free path for teams still qualifying the review</p>
      <p>Ready to move now?</p>
      <p>Live scheduling is not configured yet.</p>
      <p>Payment links are issued after the fit call and expire after 7 days.</p>
    </div>
  `;

  assert.throws(
    () => {
      assertAssessmentRuntimeState(
        mismatchedHtml,
        getAssessmentVerificationConfig({
          NEXT_PUBLIC_ASSESSMENT_BOOKING_URL: 'https://cal.example.com/fit-call',
        }),
      );
    },
    /live fit-call CTA label|LinkedIn fallback CTA|scheduling fallback copy/,
  );
});
