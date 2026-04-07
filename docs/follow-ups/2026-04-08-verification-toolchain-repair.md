# Follow-Up Task: Verification Toolchain Repair

Date: 2026-04-08

## Problem

The local QA stack is not currently trustworthy enough for a “fully verified” claim.

Observed failures:

- `npx pnpm@10.23.0 lint`

```text
TypeError: createDebug is not a function
```

- `npx pnpm@10.23.0 check:content`

```text
TypeError: Cannot read properties of undefined (reading 'bind')
```

- `npx pnpm@10.23.0 test:unit`

```text
TypeError: w.transformSync is not a function
```

## Scope

- Repair the ESLint runtime dependency failure
- Repair the `gray-matter` and YAML engine failure in content checks
- Repair the `tsx` runtime failure that prevents the unit test suite from booting

## Acceptance Criteria

- `npx pnpm@10.23.0 lint` passes
- `npx pnpm@10.23.0 check:content` passes
- `npx pnpm@10.23.0 test:unit` passes
- All commands run cleanly under the repo-pinned package manager and current Node 20 runtime

## Suggested Verification

```bash
npx pnpm@10.23.0 lint
npx pnpm@10.23.0 check:content
npx pnpm@10.23.0 test:unit
npx pnpm@10.23.0 verify:release
```
