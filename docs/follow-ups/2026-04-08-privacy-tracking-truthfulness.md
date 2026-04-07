# Follow-Up Task: Privacy And Tracking Truthfulness

Date: 2026-04-08

## Problem

The live site loads LinkedIn Insight from `app/layout.tsx` when `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` is enabled, but `/privacy` does not explicitly disclose LinkedIn Insight in the third-party services or analytics/tracking language.

## Scope

- Update `app/privacy/page.tsx`
- Update any related analytics or tracking copy so it matches the actual scripts and CSP-allowed third-party tracking domains
- Keep disclosure conditional if the integration is environment-gated

## Acceptance Criteria

- Privacy text explicitly matches the active tracking stack
- LinkedIn Insight is disclosed whenever `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` is enabled
- Plausible disclosure remains accurate
- No contradiction remains between `app/layout.tsx`, CSP allowances, and `/privacy`

## Suggested Verification

- Render `/privacy` with LinkedIn Insight enabled
- Confirm the page mentions the integration explicitly
- Confirm the page still behaves correctly when the environment variable is unset
