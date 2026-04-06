<!-- markdownlint-disable MD034 -->
# AI Security Brief — Project Status

**Pinned baseline:** `origin/main` @ `4cde7a28d5cf57983d400700ec05881444416010` **Last updated:** 06 April 2026 **Updated by:** Codex

**Verification pipeline:** Vercel Actions

## Site Status

| Component | Status |
| --- | --- |
| Live URL | https://aithreatbrief.com |
| Latest deploy | `origin/main` — current |
| Rate limiting | Upstash-backed distributed 5 req/min per IP on `/api/subscribe` |
| Repository license | MIT (`LICENSE`) |
| Public status surface | `/status` and `/status.json` (runtime snapshot) |

## Current Status

The site is deployed and operational. The newsletter is accepting signups via Upstash rate limits and Beehiiv insertion.

The `/pro` page is live at `aithreatbrief.com/pro`. Pro CTAs are present in the header (Go Pro button), footer nav, ToolsMatrix bottom bar, and the Tools page CTA section.

LinkedIn Insight Tag base script is wired in `app/layout.tsx`. Campaign Manager now has Partner ID `9120908`, and the event-specific Pro signup conversion is `25104812`. Production tracking still requires `NEXT_PUBLIC_LINKEDIN_PARTNER_ID=9120908` and `NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP=25104812` in Vercel before the live site will start sending traffic data.

LinkedIn Company Page `AI Security Brief` is now live, and the new Campaign Manager ad account `521990231` has been created with locked settings `AI Security Brief — Main`, `AUD`, and associated Page `AI Security Brief`.

LinkedIn two-step verification for the profile is confirmed enabled. The `Business information` and payment method flow is now complete, and ad account `521990231` is `Active`.

Campaign Manager now also has a saved draft website-conversion ad set:

- Campaign Group ID: `862504326`
- Draft Campaign ID: `622908116`
- Draft name: `AU Pro Signup Document Draft`
- Objective: `WEBSITE_CONVERSION`
- Format: `SPONSORED_UPDATE_NATIVE_DOCUMENT`
- Budget: `A$20/day`
- Geography: `Australia`
- Audience expansion: `Off`
- LAN: `Off`
- Conversion selected: `Pro Signup` (`25104812`)

LinkedIn currently shows the Insight Tag status as `NO_DOMAINS`, which is expected until the live site loads the base tag with the production env vars.

## Content

| Metric | Count |
| --- | --- |
| Published articles | 14 |

## Revenue Surface

| Page | Status |
| --- | --- |
| `/pro` | ✅ Live — static, 815B, Pro signup CTA |
| Header "Go Pro" CTA | ✅ Live — amber button on all pages |
| ToolsMatrix Pro CTA | ✅ Fixed — now points to `/pro` (was dead beehiiv link) |
| Tools page CTA | ✅ Upgraded — Pro-forward with free sub secondary |
| Beehiiv Pro tier checkout | ⚠️ Pending — configure in Beehiiv dashboard |
| LinkedIn Insight Tag | ⚠️ Partial — Partner ID `9120908` and conversion ID `25104812` are created; still needs Vercel envs and live-site validation |
| LinkedIn Campaigns | ⚠️ Partial — first draft campaign saved as `AU Pro Signup Document Draft` (`622908116`), but creative upload and launch are still pending |

## Open PRs

None.

Most recent merges:

- feat(pro): Add /pro page, Pro CTAs in header/footer/tools, fix ToolsMatrix dead link
- Merge codex/content-week-2026-14
- Merge chore/trust-cleanup-and-affiliate-updates

## System Notes

Update this file whenever `main` advances. Pin the SHA in the header. External tooling should verify state against this file, not against prior conversation context.

## Remaining Blockers (LinkedIn Campaign Launch)

1. **Beehiiv Pro tier** — Set up paid tier checkout in Beehiiv dashboard so `/pro` CTA has a real destination
2. **Vercel LinkedIn env vars** — Add `NEXT_PUBLIC_LINKEDIN_PARTNER_ID=9120908` and `NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP=25104812`, then redeploy and validate on the live site
3. **Insight Tag domain validation** — Load the redeployed site so Campaign Manager can move the Insight Tag from `NO_DOMAINS` to an active tracked domain state
4. **Campaign creative completion** — Upload the native document creative (`marketing/assets/ai-security-brief-pro-launch-teaser.pdf`) and complete the remaining ad build screens for draft campaign `622908116`
5. **Pause legacy campaigns if still spending** — If any older LinkedIn ad account is still active, pause campaigns driving traffic to non-Pro pages
