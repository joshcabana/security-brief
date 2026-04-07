<!-- markdownlint-disable MD034 -->
# AI Security Brief — Project Status

**Pinned baseline:** `origin/main` @ `16a4112861561a8c2df81700bed85f2b2a7a6ab2` **Last updated:** 07 April 2026 **Updated by:** Codex

**Verification pipeline:** `pnpm verify:pr`, `pnpm verify:ops`, `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=aithreatbrief.com pnpm verify:live`, plus cache-bypassed checks against the production runtime

## Site Status

| Component | Status |
| --- | --- |
| Live URL | https://aithreatbrief.com |
| Latest deploy | `main` @ `16a4112861561a8c2df81700bed85f2b2a7a6ab2` — runtime reported active deployment |
| Rate limiting | Upstash-backed distributed 5 req/min per IP on `/api/subscribe` |
| Repository license | MIT (`LICENSE`) |
| Public status surface | `/status` and `/status.json` (runtime snapshot) |

## Current Status

The production site is live on Vercel and, after cache-bypassed verification, is serving commit `16a4112861561a8c2df81700bed85f2b2a7a6ab2`.

The `/pro` and `/upgrade` flows now present waitlist-safe copy instead of promising immediate paid checkout. The status runtime payload is sanitized and no longer exposes internal Vercel deployment URLs.

Production security headers now explicitly allow the LinkedIn Insight Tag domains used by `app/layout.tsx`, while preserving the baseline CSP/HSTS/frame protections. `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is present in Vercel production and the live analytics/privacy contract passes when verified against the deployed domain.

Read-only integration checks succeeded during this audit: Beehiiv API access returned `200` for the configured publication and Upstash Redis returned `PONG`. Local release verification also passed via `pnpm verify:pr`.

The production Vercel project contains the required Beehiiv, Upstash, site, analytics, and LinkedIn environment variables. `NEXT_PUBLIC_PRO_CHECKOUT_LIVE` was not present in the production environment list during this audit, so paid checkout remains intentionally disabled.

## Content

| Metric | Count |
| --- | --- |
| Published articles | 14 |

## Revenue Surface

| Page | Status |
| --- | --- |
| `/pro` | ✅ Live — Pro waitlist CTA and honest pre-checkout copy |
| Header "Go Pro" CTA | ✅ Live — amber button on all pages |
| ToolsMatrix Pro CTA | ✅ Fixed — points to `/pro` |
| Tools page CTA | ✅ Live — Pro-forward with free-sub secondary |
| `/upgrade` | ✅ Live — waitlist capture flow with no false checkout promise |
| Beehiiv Pro tier checkout | ⚠️ Disabled by config — `NEXT_PUBLIC_PRO_CHECKOUT_LIVE` was absent from Vercel production during this audit |
| Beehiiv hosted upgrade URL | ⚠️ Unable to verify from available CLI data — `https://aisec.beehiiv.com/upgrade` returns a Cloudflare challenge to non-browser requests |
| LinkedIn Insight Tag | ✅ Live — production CSP now allows `snap.licdn.com` and `px.ads.linkedin.com`, and the live pages load the base tag |
| LinkedIn campaign launch state | ⚠️ Unable to verify from available data — ad-account and campaign state were not rechecked directly in Campaign Manager during this audit |

## Open PRs

None.

Most recent merges:

- refactor: implement security header middleware, update Pro checkout UI, sanitize status route, and standardize GITHUB_MODELS_MODEL configuration
- feat: add NEXT_PUBLIC_PRO_CHECKOUT_LIVE environment variable to toggle Beehiiv checkout and update upgrade page messaging
- feat(pro): Add /pro page, Pro CTAs in header/footer/tools, fix ToolsMatrix dead link

## System Notes

Update this file whenever `main` advances. Pin the SHA in the header. External tooling should verify state against this file, not against prior conversation context.

## Remaining Blockers

1. **Paid checkout is still intentionally disabled** — `NEXT_PUBLIC_PRO_CHECKOUT_LIVE` was not present in Vercel production during this audit, so the site remains on the waitlist flow by design.
2. **Hosted Beehiiv checkout still needs browser verification** — Non-browser CLI requests to `https://aisec.beehiiv.com/upgrade` hit a Cloudflare challenge, so the actual checkout page contents, offer name, and live price are still unverified from this environment.
3. **A real end-to-end paid conversion has not been executed during this audit** — No browser-based test purchase was performed, so Stripe/Beehiiv billing completion remains unverified from available data.
4. **A live newsletter write-path test was not executed during this audit** — Beehiiv read access and Upstash connectivity were verified, but no real subscriber was added because that would mutate production data.
5. **Campaign Manager launch is still a manual business decision** — Code and tracking are in much better shape, but actual ad activation, spend, and creative approval remain outside the repository.
