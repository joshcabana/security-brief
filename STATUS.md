<!-- markdownlint-disable MD034 -->
# AI Security Brief — Project Status

**Pinned baseline:** `origin/main` @ `678d0f4fd5ad128f5236b132d2d655293dab167a` **Last updated:** 10 April 2026 **Updated by:** Codex

**Verification pipeline:** `pnpm verify:pr`, `pnpm verify:ops`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=aithreatbrief.com pnpm verify:live`, `pnpm verify:production -- --base-url https://aithreatbrief.com`, plus cache-bypassed checks against the production runtime

## Site Status

| Component | Status |
| --- | --- |
| Live URL | https://aithreatbrief.com |
| Latest deploy | `main` @ `678d0f4fd5ad128f5236b132d2d655293dab167a` — fix: pass CSP nonce from middleware to layout to unblock Next.js hydration |
| Rate limiting | Upstash-backed distributed 5 req/min per IP on `/api/subscribe` |
| Repository license | MIT (`LICENSE`) |
| Public status surface | `/status` and `/status.json` (runtime snapshot) |

## Current Status

The production site is live on Vercel. The `/pro` and `/upgrade` flows still reflect the live Beehiiv checkout path, and the `/upgrade` route renders the client-side "Opening Pro Checkout" handoff before redirecting to the hosted Beehiiv paid checkout.

Production security headers still allow the LinkedIn Insight Tag domains used by `app/layout.tsx`, while preserving the baseline CSP/HSTS/frame protections. `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is present in production and the live analytics/privacy contract passes when verified against the deployed domain.

The assessment funnel is now covered by repository-level verification, but the active production deployment is still serving the fallback `/assessment` state. A live fetch on 09 April 2026 confirmed the page currently renders the preview/newsletter split, `Message Josh on LinkedIn`, the public contact email, and no live payment CTA.

Local release verification passed via `npx pnpm@10.23.0 verify:pr`, and local ops verification still reports the two expected revenue-readiness warnings: `NEXT_PUBLIC_ASSESSMENT_BOOKING_URL` and `NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL`.

## Content

| Metric | Count |
| --- | --- |
| Published articles | 14 |

## Revenue Surface

| Page | Status |
| --- | --- |
| `/pro` | ✅ Live — paid-access messaging, live status badge, and Pro checkout CTA |
| `/assessment` | ⚠️ Live in fallback mode — qualification split is live, but production still routes to LinkedIn/email because live booking and payment URLs are not active in the current deployment |
| Header "Go Pro" CTA | ✅ Live — amber button on all pages |
| ToolsMatrix Pro CTA | ✅ Fixed — points to `/pro` |
| Tools page CTA | ✅ Live — Pro-forward with free-sub secondary |
| `/upgrade` | ✅ Live — "Opening Pro Checkout" handoff with client-side redirect to Beehiiv |
| Beehiiv Pro tier checkout | ✅ Live — `NEXT_PUBLIC_PRO_CHECKOUT_LIVE=true` is enabled in Vercel production |
| Beehiiv hosted upgrade URL | ✅ Live — public upgrade route is active and accepts the hosted checkout handoff |
| LinkedIn Insight Tag | ✅ Live — production CSP now allows `snap.licdn.com` and `px.ads.linkedin.com`, and the live pages load the base tag |
| LinkedIn campaign launch state | ⚠️ Unable to verify from available data — ad-account and campaign state were not rechecked directly in Campaign Manager during this audit |

## Open PRs

None

Most recent merges:

- fix: pass CSP nonce from middleware to layout to unblock Next.js hydration
- - feat: implement assessment page runtime verification and update deployment runbook
  - - feat: update assessment page with fit signals and direct contact options, add verification test, and clean up blog page code.
   
    - ## System Notes
   
    - Run `pnpm status:sync` before pushing a change that advances `main` so the header, Latest deploy row, and recent merges stay aligned with the current `origin/main` baseline. Review and update the narrative sections manually. External tooling should verify state against this file, not against prior conversation context.
   
    - Local verification assumes the shell is actually using the pinned Node runtime from `.nvmrc`. Check `node -v` before running `pnpm verify:pr`, `pnpm verify:ops`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=aithreatbrief.com pnpm verify:live`, or `pnpm verify:production -- --base-url https://aithreatbrief.com`; if the shell is not on `v20.20.2`, switch first so local results match CI and Vercel.
   
    - ## Remaining Blockers
   
    - 1. **The assessment booking and payment URLs are not live in the current production deployment** — `/assessment` is verified in fallback mode, not revenue-ready mode. Set `NEXT_PUBLIC_ASSESSMENT_BOOKING_URL` and `NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL` in Vercel production, redeploy, and rerun `pnpm verify:production -- --base-url https://aithreatbrief.com`.
      2. 2. **A real end-to-end paid conversion has not been executed during this audit** — The live UI and hosted upgrade handoff are verified, but no completed test purchase was run from this environment.
         3. 3. **A live newsletter write-path test was not executed during this audit** — Beehiiv read access and Upstash connectivity were verified, but no real subscriber was added because that would mutate production data.
            4. 4. **Campaign Manager launch is still a manual business decision** — The LinkedIn tag is present on production, but ad activation, spend controls, and conversion reporting still depend on Campaign Manager access.
