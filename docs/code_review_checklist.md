# Code Review Checklist

AI Security Brief Team  
Next.js 15 • TypeScript • React 19 • Tailwind CSS • Vercel

Source template: [Code Review Checklist.docx](/Users/castillo/Documents/Security%20Brief/Code%20Review%20Checklist.docx)  
Related review targets:
- [audit_redesign_plan.md](/Users/castillo/Documents/Security%20Brief/ai-security-brief/docs/audit_redesign_plan.md)
- [AGENTS-REVIEW.md](/Users/castillo/Documents/Security%20Brief/ai-security-brief/AGENTS-REVIEW.md)
- [SECURITY.md](/Users/castillo/Documents/Security%20Brief/ai-security-brief/SECURITY.md)
- [README.md](/Users/castillo/Documents/Security%20Brief/ai-security-brief/README.md)

PR Title:

Author:

Reviewer:

Date:

Branch:

Review target:
- [ ] Standard PR
- [ ] High-risk plan or spec review
- [ ] Review of `audit_redesign_plan.md`

How to use: Work through each section during review. Check items as you verify them. Add notes for anything that needs discussion. Not every item applies to every PR; use judgment and skip items that are irrelevant to the change. When reviewing a plan instead of code, treat each item as a requirement for implementation readiness and evidence quality.

---

## 1. Correctness & Logic

Does the code or plan do what it claims to do? Does it handle edge cases?

### 1.1 Functional Correctness

- [ ] Code implements the requirements described in the ticket or spec
- [ ] Business logic is correct and handles all defined scenarios
- [ ] Edge cases are handled: empty arrays, null or undefined, zero values, and boundary conditions
- [ ] TypeScript types are accurate and not bypassed with `any` or `@ts-ignore`
- [ ] No unintended side effects from state mutations or shared references
- [ ] Async operations use proper `await` and error handling with no floating promises

Reviewer notes:

### 1.2 React & Next.js Specifics

- [ ] Server Components vs Client Components are used appropriately, with `'use client'` only where needed
- [ ] React hooks follow the rules of hooks with correct dependency arrays
- [ ] `useEffect` cleanup functions are present where needed for subscriptions, timers, and `AbortController`
- [ ] Next.js data fetching uses the right pattern: Server Components, Route Handlers, or the repo's existing client-side approach
- [ ] Dynamic routes and params are validated before use
- [ ] Metadata and `generateMetadata` are set correctly for SEO-sensitive pages

Reviewer notes:

### 1.3 Error Handling

- [ ] API route handlers return appropriate HTTP status codes and error responses
- [ ] `try/catch` blocks are used around external calls such as APIs, Beehiiv, file system access, or network fetches
- [ ] Errors are logged with enough context to debug and are not silently swallowed
- [ ] User-facing error messages are helpful and do not leak internal details
- [ ] Error boundaries or `error.tsx` files exist for critical UI sections
- [ ] Form validation errors are surfaced clearly to the user

Reviewer notes:

### 1.4 Redesign Plan Reality Check

Use this subsection when reviewing [audit_redesign_plan.md](/Users/castillo/Documents/Security%20Brief/ai-security-brief/docs/audit_redesign_plan.md) or implementation derived from it.

- [ ] The plan distinguishes clearly between implemented capabilities and aspirational ideas
- [ ] Subscriber counts, open rates, CTRs, sponsor logos, or growth claims are backed by evidence or explicitly marked as placeholders
- [ ] Beehiiv paywall, premium archive, automation, and upgrade-flow claims match current repo behavior or include concrete implementation steps to make them true
- [ ] Proposed homepage, blog, or tool-directory UI changes map cleanly onto the current app structure and route model
- [ ] Sponsorship, trust, or analyst-credibility copy does not require unverifiable expertise claims to function
- [ ] The plan avoids hidden product assumptions such as existing auth, billing state, entitlement storage, or CMS features that are not present in the repo

Reviewer notes:

---

## 2. Security

Given this is a security-focused product, this section warrants extra scrutiny.

### 2.1 Input Validation & Sanitization

- [ ] All user input is validated and sanitized, including query params, form data, and URL segments
- [ ] `sanitize-html` is used correctly before rendering any user-generated or externally sourced HTML
- [ ] No raw HTML injection via `dangerouslySetInnerHTML` without sanitization
- [ ] API route inputs are validated with runtime checks or a schema validator such as Zod
- [ ] File uploads, if any, are validated for type, size, and content

Reviewer notes:

### 2.2 Authentication & Authorization

- [ ] Protected routes and API endpoints check authentication status where required
- [ ] Authorization logic is enforced server-side, not only hidden in client UI
- [ ] Rate limiting is applied to sensitive endpoints and matches the intended `@upstash/ratelimit` usage
- [ ] CORS headers are configured correctly on API routes
- [ ] No sensitive operations are possible via `GET` requests

Reviewer notes:

### 2.3 Secrets & Data Exposure

- [ ] No secrets, API keys, or tokens are committed to the repository
- [ ] Environment variables use `NEXT_PUBLIC_` only for truly public values
- [ ] Server-only secrets are not accidentally imported into client components
- [ ] Error responses and logs do not leak stack traces, internal paths, or config details
- [ ] Sensitive data is not stored in `localStorage`, cookies, or URL parameters without a clear need and safe handling
- [ ] Third-party scripts are loaded only from trusted sources, with integrity controls where appropriate

Reviewer notes:

### 2.4 Dependency Security

- [ ] New dependencies have been checked for known vulnerabilities with `pnpm audit --prod`
- [ ] Dependencies are pinned through the lockfile and do not weaken supply-chain posture
- [ ] No unnecessary dependencies were added when existing utilities would suffice
- [ ] License compatibility has been considered for new packages

Reviewer notes:

### 2.5 Trust, Editorial, and Claim Validation

- [ ] Security, privacy, or trust claims match the actual implementation and documented policy
- [ ] The proposed design does not imply enterprise-grade controls, analyst credibility, or reviewed sponsor trust that the product cannot substantiate
- [ ] Social proof is not fabricated, inflated, or presented as factual without evidence
- [ ] Sponsor placements, affiliate links, and monetization language preserve editorial independence and do not undermine user trust
- [ ] Changes that affect privacy or analytics claims are reconciled against `pnpm verify:trust` and the current privacy-page contract

Reviewer notes:

---

## 3. Performance

Vercel deployment means every kilobyte and every render matters.

### 3.1 Bundle Size & Loading

- [ ] Large libraries are not imported into client bundles unnecessarily
- [ ] Dynamic imports via `next/dynamic` are used for heavy or below-the-fold components when justified
- [ ] Images use `next/image` with appropriate dimensions and lazy loading where applicable
- [ ] No blocking third-party scripts are introduced in the critical rendering path
- [ ] CSS stays lean and uses Tailwind utilities without large custom stylesheet sprawl

Reviewer notes:

### 3.2 Rendering & Caching

- [ ] Server Components are preferred for data-heavy pages when they reduce shipped client JavaScript
- [ ] Static generation or `generateStaticParams` is used where content is known at build time
- [ ] Revalidation strategies are appropriate for content freshness and operational cost
- [ ] Memoization is used only where profiling or clear render churn justifies it
- [ ] API or content fetches are not performed redundantly within a single lifecycle
- [ ] Caching headers are configured for API routes that truly serve cacheable data

Reviewer notes:

### 3.3 Core Web Vitals

- [ ] Layout shifts are minimized with explicit dimensions and stable placeholders
- [ ] Largest Contentful Paint elements load promptly
- [ ] Interaction to Next Paint is considered and heavy client work is deferred or offloaded
- [ ] No synchronous operations block the main thread during page load

Reviewer notes:

### 3.4 Frontend Implementation Realism

- [ ] Proposed redesign components can be implemented with the current stack without introducing avoidable client-side bloat
- [ ] New visual ideas fit existing route purposes and do not require a hidden design system rewrite
- [ ] Hero, blog-grid, table, and upgrade concepts degrade well on mobile and do not assume desktop-only layouts
- [ ] Premium visual treatments do not depend on scripts, assets, or live data sources that the repo does not already support
- [ ] Proposed UI complexity is proportionate to the product value and not likely to slow content publishing or maintenance

Reviewer notes:

---

## 4. Maintainability & Code Quality

Can the next person understand and safely modify this code?

### 4.1 Readability & Style

- [ ] `pnpm lint` passes cleanly with no disabled rules or suppressions
- [ ] `pnpm typecheck` passes in strict mode
- [ ] Naming is clear and consistent across components, utilities, and constants
- [ ] Files and folders follow the existing project structure, especially `app/` router conventions
- [ ] No commented-out code, stray `console.log`, or unresolved TODOs remain in production code
- [ ] Complex logic includes a brief comment explaining the why when needed

Reviewer notes:

### 4.2 Architecture & Design

- [ ] Changes follow existing patterns instead of introducing a second way to solve the same problem
- [ ] Components have a single responsibility and large components are broken into smaller parts when needed
- [ ] Shared logic is extracted into reusable utility functions or custom hooks where appropriate
- [ ] API route handlers stay thin and business logic lives in separate modules
- [ ] No circular dependencies are introduced between modules
- [ ] Feature flags or environment checks are used for gradual rollouts, not long-lived code forks

Reviewer notes:

### 4.3 Testing

- [ ] Unit tests are added or updated for new or changed logic and `pnpm test:unit` passes
- [ ] Smoke tests cover critical user paths and `pnpm test:smoke` passes
- [ ] Tests verify behavior, not implementation details
- [ ] Edge cases and failure scenarios have dedicated test coverage
- [ ] Test data is realistic and does not rely on hardcoded production values
- [ ] `pnpm verify:release` passes

Reviewer notes:

### 4.4 Documentation & Operations

- [ ] `README.md` or relevant docs are updated if the change affects setup, configuration, or usage
- [ ] API changes are reflected in public docs or changelogs where needed
- [ ] Automation scripts and weekly content workflows are not broken by the change
- [ ] `pnpm check:content` validates cleanly after content changes
- [ ] Environment variable changes are documented and communicated to the team

Reviewer notes:

### 4.5 Verification Requirements for Plan Reviews

- [ ] The plan names concrete verification commands instead of generic "test it" guidance
- [ ] The plan stays aligned with the repo's actual gates: `pnpm lint`, `pnpm typecheck`, `pnpm test:unit`, `pnpm test:smoke`, `pnpm verify:release`, `pnpm verify:pr`, `pnpm check:content`, `pnpm verify:ops:contract`, and `pnpm audit --prod`
- [ ] The plan does not assume non-existent checks, frameworks, or infrastructure
- [ ] Any launch or rollout steps include a preview or safe-validation step before merge to `main`
- [ ] The implementation burden implied by the plan is proportional to the validation strategy it requires

Reviewer notes:

---

## 5. Deployment & Release Readiness

Final checks before merging to `main` and deploying to Vercel.

- [ ] `pnpm verify:pr` passes: `lint`, `verify:release`, `verify:ops:contract`, and `audit --prod`
- [ ] The PR is focused: one logical change per PR, not multiple unrelated features
- [ ] Commit messages are descriptive and follow team conventions
- [ ] There are no merge conflicts with the main branch
- [ ] Vercel preview deployment has been checked and functions correctly
- [ ] Database migrations, if any, are backward-compatible and reversible
- [ ] Feature toggles are in place if the feature is not ready for all users
- [ ] Rollback safety is understood and the change can be reverted cleanly

Reviewer notes:

### 5.1 Monetization & Launch Readiness

- [ ] Beehiiv and monetization steps are grounded in current repo responsibilities rather than external platform wish lists
- [ ] Paid-tier, lead-magnet, sponsor, or affiliate flows have a concrete owner in the codebase, the ops runbooks, or Beehiiv configuration docs
- [ ] Launch checklists do not depend on fake metrics, placeholder sponsors, or unverifiable conversion assumptions
- [ ] Any premium or sponsor-facing page copy can be reviewed safely in a Vercel preview before launch
- [ ] The rollout plan avoids presenting unfinished monetization features as already live

Reviewer notes:

---

## 6. Reviewer Sign-Off

Reviewer:

Comments / blockers:

Verdict:
- [ ] Approve
- [ ] Request changes

Second reviewer, if needed:

Comments / blockers:

Verdict:
- [ ] Approve
- [ ] Request changes

Version 1.0 • Markdown counterpart tailored for AI Security Brief • Next.js 15 + TypeScript + React 19 + Tailwind CSS + Vercel

Customise this checklist as the team evolves. Not every item applies to every PR, but any unchecked high-risk item should be an explicit review decision rather than an assumption.
