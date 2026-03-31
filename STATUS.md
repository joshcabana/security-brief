<!-- markdownlint-disable MD034 -->
# AI Security Brief — Project Status

**Pinned baseline:** `origin/main` @ `1b23523` **Last updated:** 31 March 2026 **Updated by:** Antigravity

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

## Content

| Metric | Count |
| --- | --- |
| Published articles | 14 |

## Open PRs

None.

Most recent merges:

- Merge codex/content-week-2026-14
- Merge chore/trust-cleanup-and-affiliate-updates

## System Notes

Update this file whenever `main` advances. Pin the SHA in the header. External tooling should verify state against this file, not against prior conversation context.
