# AI Security Brief — Fix Application Instructions

All changes have been prepared and verified. This document explains how to apply them.

---

## What's included

### Patch file: `ai-security-brief-fixes.patch`
Contains diffs for **14 modified files** covering P0 and P1 fixes. Apply this to a clean checkout of `main`.

### New files directory: `new-files/`
Contains **4 new files** that don't exist in the repo yet:

- `app/ai-use/page.tsx` — AI Use Policy page
- `app/api/health/subscribe/route.ts` — Non-destructive subscribe health check endpoint
- `app/corrections/page.tsx` — Corrections and accountability page
- `app/methodology/page.tsx` — Editorial methodology page

### Runbook: `aithreatbrief-scheduled-task-runbook.md`
Documentation for the Wednesday health check scheduled task (already configured in Claude desktop).

---

## How to apply

### Step 1: Clone and branch

```bash
git clone https://github.com/joshcabana/ai-security-brief.git
cd ai-security-brief
git checkout -b chore/p0-p1-fixes
```

### Step 2: Apply the patch

```bash
git apply /path/to/ai-security-brief-fixes.patch
```

If `git apply` fails on any hunk (e.g. if `main` has advanced since 31 March 2026), use:

```bash
git apply --3way /path/to/ai-security-brief-fixes.patch
```

### Step 3: Copy in new files

```bash
cp -r /path/to/new-files/app/ai-use app/ai-use
cp -r /path/to/new-files/app/api/health app/api/health
cp -r /path/to/new-files/app/corrections app/corrections
cp -r /path/to/new-files/app/methodology app/methodology
```

### Step 4: Verify

```bash
pnpm install
pnpm lint
pnpm check:content
pnpm typecheck
pnpm test:unit
pnpm build
pnpm test:smoke
```

If lint or content checks fail, fix any issues introduced by the new pages (e.g. `VERIFIED_PAGE_METADATA` may need updating to include `/ai-use`, `/methodology`, `/corrections`).

### Step 5: Commit and push

```bash
git add -A
git commit -m "fix(p0-p1): OPSEC purge, env contract alignment, editorial trust pages, affiliate separation

P0: Redact sensitive ops data (BSB, account numbers, affiliate IDs, personal info)
P0: Add Upstash to README env table and generate-status.mjs env contract
P0: Add /api/health/subscribe endpoint for non-destructive signup verification
P1: Add AI Use Policy, Methodology, and Corrections pages
P1: Remove affiliate CTAs from threat analysis articles
P1: Fix About and Privacy page overclaims
P1: Update STATUS.md stale PR #51 guidance
P1: Add editorial rule to affiliate-programs.md
CI: Add lint step to deploy.yml verify job"

git push -u origin chore/p0-p1-fixes
gh pr create --title "P0+P1: OPSEC purge, editorial trust, env alignment" --body "See commit message for full breakdown."
```

---

## Manual step required: Vercel environment variables (P0-1)

**This cannot be done via code.** You must set these in Vercel manually:

1. Go to https://vercel.com/josh-cabanas-projects/ai-security-brief/settings/environment-variables
2. Add for **Production** and **Preview**:
   - `UPSTASH_REDIS_REST_URL` — your Upstash Redis REST endpoint
   - `UPSTASH_REDIS_REST_TOKEN` — your Upstash Redis REST token
3. Optionally add `HEALTH_CHECK_TOKEN` — a shared secret for the new `/api/health/subscribe` endpoint
4. Redeploy production after setting the variables

If you don't have an Upstash account yet:
1. Go to https://upstash.com and create a free account
2. Create a new Redis database (free tier is fine for rate limiting)
3. Copy the REST URL and REST Token from the database details page

### Verify the fix

After setting env vars and redeploying:

```bash
# Test valid signup returns 200 (not 503)
curl -X POST https://aithreatbrief.com/api/subscribe \
  -H "Content-Type: application/json" \
  -H "Origin: https://aithreatbrief.com" \
  -H "Referer: https://aithreatbrief.com/" \
  -d '{"email": "test@example.com", "source": "verify"}'

# Test health endpoint (if HEALTH_CHECK_TOKEN is set)
curl https://aithreatbrief.com/api/health/subscribe \
  -H "x-health-token: YOUR_TOKEN_HERE"
```

---

## Optional: Git history rewrite (OPSEC deep clean)

The patch redacts sensitive data in the current files, but the original values remain in git history. If the repo has been public and indexed, consider a history rewrite:

```bash
# Install git-filter-repo if needed
brew install git-filter-repo  # macOS
# or: pip install git-filter-repo

# Remove entire sensitive files from history
git filter-repo --invert-paths \
  --path ops/RUNBOOK.md \
  --path logs/revenue-log.md

# After rewrite, force push (coordinate with any collaborators)
git push --force --all
git push --force --tags
```

**Note:** Force-pushing rewrites history for all collaborators. Only do this if you're confident no one else has open branches based on the old history.

---

## Summary of all changes

| Priority | Ticket | Files Changed | Status |
|----------|--------|---------------|--------|
| P0-1 | Upstash env vars in Vercel | Manual step | Requires manual action |
| P0-2 | Health check endpoint | `app/api/health/subscribe/route.ts` (new) | Ready |
| P0-3 | OPSEC purge | `ops/RUNBOOK.md`, `logs/revenue-log.md`, `ops/affiliate-status.md`, `STATUS.md` | Ready |
| P0-4 | Env contract alignment | `README.md`, `scripts/generate-status.mjs` | Ready |
| P1-1 | Trust pages | `app/ai-use/page.tsx`, `app/methodology/page.tsx`, `app/corrections/page.tsx` (all new) | Ready |
| P1-2 | Affiliate separation | 4 blog articles | Ready |
| P1-3 | Overclaim fixes | `app/about/page.tsx`, `app/privacy/page.tsx` | Ready |
| P1-4 | Stale guidance | `STATUS.md`, `affiliate-programs.md` | Ready |
| CI | Lint in CI | `.github/workflows/deploy.yml` | Ready |
