# AGENTS.md

This file is the operating contract for agents working in `ai-security-brief`. It is repo-scoped and should win over any broader personal defaults when they conflict.

## Repo Identity

- Stack: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3, Node.js automation scripts
- Content model: markdown articles in `blog/`, newsletter drafts in `drafts/`, generated `content-manifest.json`
- Integrations: Beehiiv, Vercel, GitHub Actions, GitHub Models, affiliate link resolution
- Timezone: `Australia/Sydney`
- Package manager: `pnpm` via the pinned version in `package.json`
- Source of truth for live state: consult `STATUS.md` before making claims about deploy status, environment readiness, affiliate status, analytics, open PRs, or automation health.

## Explore First

Before making changes:

1. Read this `AGENTS.md` and any deeper `AGENTS.md` files if they exist.
2. Inspect the relevant directories and existing implementation.
3. Search for existing logic with `rg` before writing new code.
4. Match the established patterns in the touched area instead of imposing a new style.
5. Check `git status --short --branch` before mutating files.

## Work Modes

### Review and Audit

- Default to a code-review mindset when the user asks for review, critique, cross-examination, or risk analysis.
- Findings come first, ordered by severity, with file references when applicable.
- Read-only review does not require a branch, commit, or PR.

### Planning

- For non-trivial work, state the goal, relevant context, constraints, and done-when conditions before implementation.
- Ask clarifying questions only when the ambiguity creates real product or safety risk and cannot be resolved from the repo.

### Implementation

- Keep changes minimal, scoped, and production-safe.
- Do not refactor unrelated areas while addressing the current request.
- Reuse existing helpers and contracts whenever possible.

### Content-Only Work

- Preserve article and newsletter structure unless the user asks for a format change.
- Treat markdown, frontmatter, and affiliate placeholders as part of the product contract.
- Prefer content validation over full release validation when runtime code is untouched.

## Code and Content Rules

### TypeScript and Next.js

- TypeScript is the primary implementation language in this repository.
- Keep exported functions and non-trivial data structures typed.
- Prefer small, composable functions and existing utility boundaries over large multi-purpose functions.
- Follow the repo's existing import style, alias usage, and server/client boundaries.
- Automation scripts may use Node ESM and `.mjs`; do not treat the repository as TypeScript-only.
- Use comments sparingly and only when they explain intent that is not obvious from the code.
- Do not introduce new dependencies unless the current toolchain cannot reasonably support the change.

### Markdown and Content

- Preserve frontmatter contracts used by `lib/articles.ts` and content verification scripts.
- Article frontmatter must remain consistent with the current parser expectations, including five `keywords` and `read_time` in the `<minutes> min` format.
- Keep affiliate placeholders and content-manifest expectations intact unless the task explicitly changes that behavior.

### Generated and Derived Files

- Do not hand-edit generated outputs when a repo script is the source of truth.
- If content or metadata changes require regeneration, use the existing scripts and mention that in your summary.
- Generated content and scheduled automation output should follow the existing `codex/content-week-*` and `codex/performance-week-*` branch plus draft-PR flow rather than going directly to `main`.

## API and Automation Rules

- Any external API call must have an explicit timeout.
- Retry only transient failures and use exponential backoff with jitter.
- Log retry attempts and operational failures in structured JSON for API routes and automation scripts.
- Include actionable failure context in errors without leaking secrets, tokens, or unnecessary PII.
- Do not add hidden fallbacks that mask operational failures.
- Safe user-facing degradations that are already part of product behavior are acceptable.

## Security and Secrets

- Secrets belong in environment variables, `.env.local`, or CI provider secrets. Never hardcode them.
- Never log API keys, auth headers, or sensitive user data.
- Validate and sanitize external input before forwarding it to integrations or writing derived outputs.
- Follow least privilege when adding filesystem, network, or service access.

## Testing and Verification

Choose verification based on the type of change:

### TypeScript, routing, rendering, or metadata changes

- Run `pnpm typecheck`
- Run `pnpm test:unit`
- Run `pnpm build` when page rendering, route generation, metadata, or import boundaries changed

### API or automation changes

- Run `pnpm test:unit`
- Run any relevant verification script for the touched behavior
- Consider `pnpm verify:live` or `pnpm verify:release` when deployment-facing behavior changed

### Content, markdown, or affiliate placeholder changes

- Run `pnpm check:content`
- Run broader verification only if the change also affects runtime behavior

### Env contract or operational checks

- Run `pnpm verify:ops:contract`
- Run `pnpm verify:ops` when the runtime environment contract changed

If you cannot run a relevant check, say so explicitly.

## Git and Workflow Discipline

- Use `rg` for search and `git --no-pager diff` for diffs.
- Prefer non-interactive commands with explicit flags.
- Do not overwrite or revert user changes you did not make.
- Do not commit, push, or open a PR unless the user asked for it or the task explicitly includes it.
- For mutating work that should be isolated in git, use a branch with the `codex/` prefix unless the user specifies otherwise.

## Response Guidelines

- Lead with the answer, fix, or findings.
- Keep simple answers concise.
- For reviews, list findings first and keep summaries brief.
- Mention risks, verification gaps, or follow-up checks when they materially affect confidence.
- Offer next steps only when they add clear leverage.
