# Follow-Up Task: Metadata Cleanup

Date: 2026-04-08

## Problem

Page-level metadata currently includes titles that already contain the brand suffix, while `app/layout.tsx` also applies the `%s | AI Security Brief` template. This produces duplicated titles on live pages.

Confirmed live examples:

- `/about`
- `/subscribe`
- `/archive`
- `/methodology`

## Scope

- Fix page titles so page-level `title` values do not include the brand suffix when `app/layout.tsx` already applies `%s | AI Security Brief`.
- Limit the work to pages currently using values like `... | AI Security Brief` in their own metadata.

## Acceptance Criteria

- `/about` renders a single brand suffix in `<title>`
- `/subscribe` renders a single brand suffix in `<title>`
- `/archive` renders a single brand suffix in `<title>`
- `/methodology` renders a single brand suffix in `<title>`
- Home and article pages retain intentional title behavior

## Suggested Verification

- Inspect built or live HTML `<title>` for the affected pages
- Re-run:

```bash
npx pnpm@10.23.0 typecheck
npx pnpm@10.23.0 build
```
