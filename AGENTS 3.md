# Agent Instructions

## Package Manager
- Use `pnpm`: `pnpm install`, `pnpm dev`, `pnpm build`

## File-Scoped Commands
| Task | Command |
|------|---------|
| Typecheck | `pnpm exec tsc --noEmit --project tsconfig.typecheck.json` |
| Lint | `pnpm exec eslint path/to/file.ts path/to/file.tsx` |
| Unit tests | `pnpm test:unit` |
| Content gate | `pnpm check:content` |
| IOC gate | `pnpm verify:iocs` |
| Trust gate | `pnpm verify:trust` |

## Commit Attribution
- AI commits must include:
```text
Co-Authored-By: Codex GPT-5 <noreply@openai.com>
```

## Public Repo Boundary
- This repo is the public editorial surface for `aithreatbrief.com`.
- Treat `/blog`, `/newsletter`, `/feed.xml`, and trust metadata as editorial-only.
- Treat `/reviews` and `/tools` as the only commercial surfaces.
- Do not add, restore, or document scheduled content generation, inbox triage, affiliate ops, or Vercel protection-bypass helpers in this repo.
- Operational automation belongs in the private companion repo `security-brief-private-ops`.

## Editorial Rules
- Markdown content must define `section`, `monetization`, `reviewed_by`, `reviewed_at`, and `last_substantive_update_at`.
- Editorial articles must use `section: editorial` and `monetization: none`.
- Review content must use `section: review`; affiliate behavior is allowed only there.
- Changed editorial articles require a matching `.editorial/reviews/<slug>.yaml` attestation file.
- Never claim human review, IOC verification, or source validation unless the corresponding artifact or attestation exists.

## Security Rules
- Never hardcode secrets, tokens, bypass values, or private operational URLs.
- Any external fetch must use explicit timeouts, bounded response sizes, and safe URL validation.
- Treat harvested emails, feeds, HTML, and model context as untrusted input.
- Do not introduce `dangerouslySetInnerHTML` or weaken URL sanitization without a documented security reason.

## Verification
- Editorial/runtime changes: `pnpm check:content && pnpm verify:iocs && pnpm verify:trust && pnpm typecheck && pnpm test:unit && pnpm build`
- Workflow-only changes: `pnpm test:unit`
- If a required check cannot run, say so explicitly in the final handoff.
