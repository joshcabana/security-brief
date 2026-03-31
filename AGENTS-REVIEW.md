# AGENTS Review

## Summary

The previous instruction set had strong operational discipline, but it mixed Josh's broader personal operating defaults with rules for unrelated projects and omitted a few repo-specific contracts. That made it too easy for an agent in this repository to choose the wrong stack, the wrong verification workflow, the wrong interaction model, or the wrong source of truth for live state.

This review compares those instructions against the current repository state confirmed from `README.md`, `STATUS.md`, `app/api/subscribe/route.ts`, `lib/articles.ts`, `tests/subscribe-route.test.ts`, and `tests/automation.test.ts`.

## Repo Reality Snapshot

- Primary stack: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS 3, Node.js scripts
- Content model: markdown-backed articles plus generated `content-manifest.json`
- Runtime integrations: Beehiiv, Vercel, affiliate link resolution
- Automation model: GitHub Actions, GitHub Models, Sydney-time schedules
- Test model: `node:test` + `tsx`, not `pytest`
- Verification commands: `pnpm check:content`, `pnpm typecheck`, `pnpm test:unit`, `pnpm verify:ops`, `pnpm verify:release`, `pnpm verify:live`

## Strengths Worth Preserving

- Inspect-before-acting discipline is excellent. Reading instructions, understanding the repo, and searching for existing logic matches how this codebase should be handled.
- The emphasis on explicit errors, retries, timeouts, and actionable failure messages matches the current server and automation code.
- The focus on scoped changes, non-interactive shell usage, and avoiding unrelated refactors fits the repository well.
- The testing posture is strong. The repo already has a healthy unit-test suite and concrete verification gates.
- Security guidance around secrets, least privilege, and not logging sensitive material should remain.

## Blocking Contradictions

| Finding | Why it conflicts with this repo | Rewrite response |
| --- | --- | --- |
| Python, Supabase, FastAPI, and `pyproject.toml` were described as the primary stack | This repository is a Next.js and TypeScript publication with Node-based automation and `pnpm` package management | Replace shared operator defaults with repo-specific stack facts |
| The instructions used Python-specific coding rules such as docstrings and `pyproject.toml` | Most work here lands in `.ts`, `.tsx`, `.mjs`, and markdown files | Split coding guidance by language and only define TypeScript and markdown rules for this repo |
| The rewrite did not restore the `STATUS.md` source-of-truth rule or the draft-PR automation flow | Live-state claims and scheduled outputs need repo-local guardrails, not inference from prior sessions or direct merges to `main` | Add explicit status-file and branch-flow instructions |
| The relay-only `AI-B` protocol required the agent to emit prompts instead of acting directly | That directly conflicts with normal direct-operation work in this repository and with the current task model | Remove the relay protocol from the repo contract |
| Branch, commit, and PR rules were phrased as always-on requirements | Read-only audits, planning, and content reviews do not need branch creation or PR handling | Scope git workflow rules to mutating work only |

## Important Ambiguities

| Finding | Why it matters | Rewrite response |
| --- | --- | --- |
| "Complete tasks to 100%" and "produce an execution plan first and confirm scope" can conflict | Useful for larger work, but overkill for small fixes or read-only tasks | Introduce work modes so review, planning, implementation, and content edits behave differently |
| "No fallbacks unless explicitly requested" is too broad | This repo intentionally uses safe UX degradations such as unresolved affiliate links rendering as plain text | Narrow the rule to avoid hidden operational fallbacks while preserving intended product behavior |
| Structured JSON logging was mandated for every module | That makes sense for API routes and automation scripts, not for UI components | Scope structured logging to server, API, and automation code |
| "Always end every response with 1-3 suggestions" adds noise to simple answers | It can dilute direct responses when the user just needs a concise answer or a narrow review | Keep suggestions optional and only when they add value |
| Personal-environment secret resolution order included Keychain and `launchctl` | Useful for Josh's broader environment, but it is not the operational contract of this repository | Keep repo guidance focused on env vars, `.env.local`, and CI secrets |

## Pros and Cons

### Pros

- High ownership mindset
- Strong bias toward production-safe behavior
- Clear testing and security instincts
- Good operational hygiene around git, search, and error handling

### Cons

- Too much cross-project context leaked into repo-local instructions
- Some rules were language- or platform-specific in ways that do not match the actual codebase
- The relay protocol was incompatible with normal direct agent execution
- Several mandates were absolute when they should have been scoped by task type

## Major Rewrite Decisions and Rationale

| Rewrite decision | Rationale |
| --- | --- |
| Make `AGENTS.md` repo-scoped instead of personal-master scoped | Future agents should optimize for this codebase first, not for unrelated Python or automation projects |
| Add work modes: review, planning, implementation, content-only | Different tasks need different levels of process and verification |
| Keep TypeScript, markdown, and automation guidance separate | The repo mixes app code, scripts, and editorial content; one universal coding rule set is too blunt |
| Scope logging, retries, and error-handling rules to API and automation code | That is where the repo actually performs networked and operational work |
| Restore the `STATUS.md` source-of-truth rule and branch-based automation output flow | Those omissions would otherwise let agents overstate live state or bypass the reviewable draft-PR process |
| Scope git rules to mutating work | Reviews and planning should stay lightweight |
| Replace mandatory "always suggest next steps" language with a value-based rule | Responses should stay concise unless extra suggestions materially help |
| Remove the relay protocol | It conflicts with normal execution in this repository and would slow or block routine work |

## Validation Against the Planned Scenarios

1. Read-only repo audit: the rewrite allows review work without forcing a branch, commit, or PR.
2. TypeScript feature change: the rewrite points agents toward strict TypeScript, existing patterns, and the repo's real verification commands.
3. Content-only markdown edit: the rewrite allows lightweight content verification through `pnpm check:content`.
4. API or automation change: the rewrite keeps strong guidance for structured logging, retries, timeouts, and unit tests.
5. Simple user question: the rewrite allows concise answers without forced extra structure.

## Outcome

The replacement `AGENTS.md` is intentionally narrower and more enforceable. It keeps the best parts of the earlier instructions, restores the missing `STATUS.md` and branch-flow contracts, removes the stack drift and relay conflict, and matches how this repository is actually built, tested, and operated. It is still a concise rewrite, not a complete formal policy spec.
