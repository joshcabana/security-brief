# Follow-Up Task: Status-Document Consistency

Date: 2026-04-08

## Problem

`STATUS.md`, `/status`, and `/status.json` still communicate slightly different operational truth, especially around deploy identity and operator-authored narrative. The runtime status surface currently reports document drift even when the runtime SHA is exposed correctly.

## Scope

- Decide whether `STATUS.md` should keep static content counts and deploy narrative
- Or decide whether those sections should be generated or synced automatically
- Align operator-facing status language so drift is meaningful instead of noisy

## Acceptance Criteria

- No operator-facing contradiction remains between `STATUS.md`, `/status`, and `/status.json`
- Deploy identity is communicated once, clearly
- Content counts and narrative status are either explicitly runtime-derived or explicitly operator-authored
- Any remaining drift signal is intentional and useful

## Suggested Verification

- Check `STATUS.md`
- Load `/status`
- Load `/status.json`
- Confirm deploy identity, content counts, and drift messaging are internally consistent
