# Automation Runbook — GitHub Actions + GitHub Models

> This is the production automation path. Zapier and Perplexity Computer are deprecated for live operation.

## Prerequisites

- GitHub repository admin access for `joshcabana/ai-security-brief`
- GitHub Actions enabled
- Beehiiv secrets stored as GitHub secrets:
  - `BEEHIIV_API_KEY`
  - `BEEHIIV_PUBLICATION_ID`
- Optional GitHub Actions variable:
  - `GITHUB_MODELS_MODEL` → defaults to `openai/gpt-4o-mini`

`GITHUB_TOKEN` is provided automatically by GitHub Actions and is used for GitHub Models inference, pushing weekly branches, and opening draft PRs. Model workflows need `models: read`.
The article factory and newsletter compiler workflows fall back to `openai/gpt-4.1` when no override is provided, because long-form drafting needs a stronger default than harvest ranking.

## Architecture Overview

```
MONDAY PIPELINE (Australia/Sydney):
  05:00 → weekly-harvest.yml
  09:00 → article-factory.yml
  13:00 → newsletter-compiler.yml
  15:00 → seo-affiliate.yml

SUNDAY:
  20:00 → performance-logger.yml
```

Operational rules:

- Monday jobs share one weekly branch: `codex/content-week-YYYY-WW`
- Sunday metrics use `codex/performance-week-YYYY-WW`
- Each workflow also supports `workflow_dispatch` with:
  - `run_date` → Australia/Sydney date override in `YYYY-MM-DD`
  - `dry_run` → generate output without pushing a branch or opening a PR
  - `force` → overwrite the dated output when you need to regenerate a weekly asset
- Scheduled workflows run hourly around the UTC day boundary and self-gate to the exact Australia/Sydney time window before any dependency install or API call
- AI-generated content always lands in a **draft PR**, never directly on `main`

## Workflow Inventory

### 1. Weekly Harvest

- Workflow: `.github/workflows/weekly-harvest.yml`
- Script: `scripts/automation/run-weekly-harvest.mjs`
- Output: `harvests/harvest-YYYY-MM-DD.md`
- PR: `Automation: content week YYYY-WW`

### 2. Article Factory

- Workflow: `.github/workflows/article-factory.yml`
- Script: `scripts/automation/run-article-factory.mjs`
- Output: two dated blog drafts in `/blog`
- Validation: regenerates and checks `content-manifest.json`

### 3. Newsletter Compiler

- Workflow: `.github/workflows/newsletter-compiler.yml`
- Script: `scripts/automation/run-newsletter-compiler.mjs`
- Output: `drafts/newsletter-YYYY-MM-DD.md`
- Constraint: review-only draft; never publishes to Beehiiv

### 4. SEO + Affiliate Optimiser

- Workflow: `.github/workflows/seo-affiliate.yml`
- Script: `scripts/automation/run-seo-affiliate.mjs`
- Scope: only blog files changed on the current weekly branch
- Constraint: injects existing affiliate placeholders only; never invents live affiliate URLs

### 5. Performance Logger

- Workflow: `.github/workflows/performance-logger.yml`
- Script: `scripts/automation/run-performance-logger.mjs`
- Output: upserts the weekly row in `logs/performance-log.md`
- Constraint: deterministic Beehiiv metrics update with no model generation

## Initial Setup Checklist

- [ ] Add GitHub secret `BEEHIIV_API_KEY`
- [ ] Add GitHub secret `BEEHIIV_PUBLICATION_ID`
- [ ] Optionally add GitHub variable `GITHUB_MODELS_MODEL=openai/gpt-4o-mini`
- [ ] Manually run `weekly-harvest.yml` via `workflow_dispatch`
- [ ] Manually run `article-factory.yml` against the same `run_date`
- [ ] Manually run `newsletter-compiler.yml` against the same `run_date`
- [ ] Manually run `seo-affiliate.yml` against the same `run_date`
- [ ] Manually run `performance-logger.yml`
- [ ] Review the draft PRs and merge only after editorial review

## Manual Backfill

Use `workflow_dispatch` and provide a `run_date` in Australia/Sydney local date format. Set `dry_run=true` if you want to validate generation without pushing a branch or opening a PR. Set `force=true` if you need to regenerate a dated output that already exists.

Suggested first backfill order:

1. `weekly-harvest.yml`
2. `article-factory.yml`
3. `newsletter-compiler.yml`
4. `seo-affiliate.yml`
5. `performance-logger.yml`

## Troubleshooting

| Symptom | Likely Cause | Action |
|---|---|---|
| Workflow exits without doing work | Outside Australia/Sydney run window | Use `workflow_dispatch` with `run_date` for manual runs |
| Harvest succeeds but article factory fails | Missing weekly harvest file on the weekly branch | Re-run harvest for the same `run_date` |
| Newsletter compiler fails | No two article drafts exist for the weekly date | Complete article factory first |
| SEO optimiser no-ops | Current weekly branch already has complete metadata and affiliate placeholders | Review the PR and merge |
| Performance logger fails | Beehiiv secrets missing or API response changed | Check `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, and Beehiiv API availability |
| PR not created | Missing `GITHUB_TOKEN` permissions or branch push failed | Confirm workflow permissions are `contents: write` and `pull-requests: write` |
| Model call fails | Workflow is missing `models: read` or model access is unavailable | Confirm workflow permissions include `models: read` and retry with the default model |

## Deprecated Paths

- Perplexity Computer credits are **not** part of the production automation path
- `skills.md` is retained as legacy reference only
- Zapier is no longer required and should not be wired to placeholder Perplexity endpoints
