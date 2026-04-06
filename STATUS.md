<!-- markdownlint-disable MD034 -->
# AI Security Brief — Project Status

**Pinned baseline:** `origin/main` @ `5dfa801f90e61b4f0192077c35090caa88028107` **Last updated:** 07 April 2026 **Updated by:** Codex

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

LinkedIn Insight Tag base script is wired in `app/layout.tsx`. Campaign Manager now has Partner ID `9120908`, and the event-specific Pro signup conversion is `25104812`. Both production Vercel env vars are present, the site has been redeployed, and the live domain is loading the tag.

LinkedIn Company Page `AI Security Brief` is now live, and the new Campaign Manager ad account `521990231` has been created with locked settings `AI Security Brief — Main`, `AUD`, and associated Page `AI Security Brief`.

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

LinkedIn two-step verification for the profile is confirmed enabled. The `Business information` and payment method flow are complete, ad account `521990231` is `Active`, and the first document-ad creative has been uploaded to the saved draft website-conversion campaign.

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
| Beehiiv Pro tier checkout | ⚠️ External confirmation pending — site routes `/upgrade` to the Beehiiv upgrade flow, but hosted checkout still needs browser-level confirmation in Beehiiv |
| LinkedIn Insight Tag | ✅ Live — Partner ID `9120908` and conversion ID `25104812` are set in Vercel production and deployed on `aithreatbrief.com` |
| LinkedIn Campaigns | ⚠️ Draft ready — campaign `622908116` includes uploaded document creative/ad `1386551166`; manual launch decision still pending |

## Open PRs

None.

Most recent merges:

- feat(pro): Add /pro page, Pro CTAs in header/footer/tools, fix ToolsMatrix dead link
- Merge codex/content-week-2026-14
- Merge chore/trust-cleanup-and-affiliate-updates

## System Notes

Update this file whenever `main` advances. Pin the SHA in the header. External tooling should verify state against this file, not against prior conversation context.

## Remaining Blockers (LinkedIn Campaign Launch)

1. **Beehiiv Pro tier confirmation** — Confirm the hosted Beehiiv upgrade flow completes successfully in a normal browser session and that pricing/tier settings match the live offer
2. **Campaign launch decision** — Review draft campaign `622908116`, confirm final targeting/budget copy, and explicitly launch when ready
3. **LinkedIn domain confirmation** — Recheck Campaign Manager until the tracked domain state reflects the live site load, since that status is controlled on LinkedIn’s side
4. **Beehiiv paid routing confirmation** — Confirm the current Beehiiv upgrade URL remains the intended canonical checkout destination; if Beehiiv issues a different final paid URL, update `siteConfig.beehiiv.upgradeUrl` and redeploy
5. **Pause legacy campaigns if still spending** — If any older LinkedIn ad account is still active, pause campaigns driving traffic to non-Pro pages
