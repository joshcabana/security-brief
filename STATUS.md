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

LinkedIn Insight Tag base script is wired in `app/layout.tsx`. Production tracking still requires `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` and `NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP` in Vercel.

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
| LinkedIn Insight Tag | ⚠️ Pending — add `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` and `NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP` to Vercel |
| LinkedIn Campaigns | ⚠️ Pending — account access fix required (see playbook) |

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
2. **LinkedIn Insight Tag** — Get Partner ID and Pro signup conversion ID from Campaign Manager → add `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` and `NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP` to Vercel
3. **LinkedIn Account Access** — Identify which account owns `509494393`, grant Josh Cabana Account Manager role
4. **Pause active campaigns** — Once in Campaign Manager, pause all active campaigns (driving traffic to non-Pro pages)
5. **Build new campaigns** — Follow `marketing/linkedin-campaign-playbook.md` Steps 3–6
