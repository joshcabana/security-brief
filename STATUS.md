<!-- markdownlint-disable MD034 -->
# AI Security Brief — Project Status

**Pinned baseline:** `origin/main` @ `01c395363005d27241d77f7282da0bc2a70fbb75` **Last updated:** 07 April 2026 **Updated by:** Codex

**Verification pipeline:** `pnpm verify:pr`, `pnpm verify:ops`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=aithreatbrief.com pnpm verify:live`, plus cache-bypassed checks against the production runtime

## Site Status

| Component | Status |
| --- | --- |
| Live URL | https://aithreatbrief.com |
| Latest deploy | `main` @ `01c395363005d27241d77f7282da0bc2a70fbb75` — runtime reported active deployment |
| Rate limiting | Upstash-backed distributed 5 req/min per IP on `/api/subscribe` |
| Repository license | MIT (`LICENSE`) |
| Public status surface | `/status` and `/status.json` (runtime snapshot) |

## Current Status

The production site is live on Vercel and, after cache-bypassed verification, is serving commit `9f60eaae290c64b81e29c97cb8912ae5a3a2afed`.

The `/pro` and `/upgrade` flows now reflect the live Beehiiv checkout path. The `/upgrade` route renders the client-side "Opening Pro Checkout" handoff and then redirects to the hosted Beehiiv paid checkout.

Production security headers now explicitly allow the LinkedIn Insight Tag domains used by `app/layout.tsx`, while preserving the baseline CSP/HSTS/frame protections. `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is present in Vercel production and the live analytics/privacy contract passes when verified against the deployed domain.

Read-only integration checks succeeded during this audit: Beehiiv API access returned `200` for the configured publication and Upstash Redis returned `PONG`. Local release verification also passed via `pnpm verify:pr`.

The production Vercel project contains the required Beehiiv, Upstash, site, analytics, and LinkedIn environment variables. `NEXT_PUBLIC_PRO_CHECKOUT_LIVE=true` is present in Vercel production and the client bundle now resolves it correctly after the `lib/site.ts` inlining fix on `origin/main`.

## Content

| Metric | Count |
| --- | --- |
| Published articles | 14 |

## Revenue Surface

| Page | Status |
| --- | --- |
| `/pro` | ✅ Live — paid-access messaging, live status badge, and Pro checkout CTA |
| Header "Go Pro" CTA | ✅ Live — amber button on all pages |
| ToolsMatrix Pro CTA | ✅ Fixed — points to `/pro` |
| Tools page CTA | ✅ Live — Pro-forward with free-sub secondary |
| `/upgrade` | ✅ Live — "Opening Pro Checkout" handoff with client-side redirect to Beehiiv |
| Beehiiv Pro tier checkout | ✅ Live — `NEXT_PUBLIC_PRO_CHECKOUT_LIVE=true` is enabled in Vercel production |
| Beehiiv hosted upgrade URL | ✅ Live — public upgrade route is active and accepts the hosted checkout handoff |
| LinkedIn Insight Tag | ✅ Live — production CSP now allows `snap.licdn.com` and `px.ads.linkedin.com`, and the live pages load the base tag |
| LinkedIn campaign launch state | ⚠️ Unable to verify from available data — ad-account and campaign state were not rechecked directly in Campaign Manager during this audit |

## Open PRs

None.

Most recent merges:

- fix: inline NEXT_PUBLIC_PRO_CHECKOUT_LIVE for proper client-side hydration
- chore: pin Node.js 20.x runtime via engines and .nvmrc with associated verification tests
- feat: add pnpm status:sync command to automate STATUS.md updates and improve pro page animation performance

## System Notes

Run `pnpm status:sync` before pushing a change that advances `main` so the header, Latest deploy row, and recent merges stay aligned with the current `origin/main` baseline. Review and update the narrative sections manually. External tooling should verify state against this file, not against prior conversation context.

## Remaining Blockers

1. **A real end-to-end paid conversion has not been executed during this audit** — The live UI and hosted upgrade handoff are verified, but no completed test purchase was run from this environment.
2. **A live newsletter write-path test was not executed during this audit** — Beehiiv read access and Upstash connectivity were verified, but no real subscriber was added because that would mutate production data.
3. **Campaign Manager launch is still a manual business decision** — The LinkedIn tag is present on production, but ad activation, spend controls, and conversion reporting still depend on Campaign Manager access.
