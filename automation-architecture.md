# Automation Architecture

> Canonical weekly automation design for AI Security Brief.

## Runtime

- Scheduler: GitHub Actions cron plus `workflow_dispatch`
- Model runtime: GitHub Models via `GITHUB_TOKEN`
- Default model: `openai/gpt-4o-mini`
- Article factory default: `openai/gpt-4.1`
- Newsletter compiler default: `openai/gpt-4.1`
- Content safety rail: draft PRs only, never direct `main` commits

## Why this architecture

- Removes the Perplexity Computer credit dependency entirely.
- Avoids a new paid API secret for text generation.
- Keeps editorial control through draft PR review.
- Uses deterministic RSS/Atom feeds for harvest sourcing, then limits model output to those supplied sources.

## Weekly flow

### Monday 05:00 Australia/Sydney — Weekly Harvest

- Workflow: `.github/workflows/weekly-harvest.yml`
- Script: `scripts/automation/run-weekly-harvest.mjs`
- Input: curated security and AI feeds from the last 7 days
- Output: `harvests/harvest-YYYY-MM-DD.md`
- Branch: `codex/content-week-YYYY-WW`
- PR: `Automation: content week YYYY-WW`

### Monday 09:00 Australia/Sydney — Article Factory

- Workflow: `.github/workflows/article-factory.yml`
- Script: `scripts/automation/run-article-factory.mjs`
- Input: the current weekly harvest file only
- Output: 2 dated article drafts in `/blog`
- Constraint: references must come from the current harvest source pack

### Monday 13:00 Australia/Sydney — Newsletter Compiler

- Workflow: `.github/workflows/newsletter-compiler.yml`
- Script: `scripts/automation/run-newsletter-compiler.mjs`
- Input: harvest, weekly articles, affiliate program roster
- Output: `drafts/newsletter-YYYY-MM-DD.md`
- Constraint: review-only draft; no Beehiiv publishing

### Monday 15:00 Australia/Sydney — SEO + Affiliate Optimiser

- Workflow: `.github/workflows/seo-affiliate.yml`
- Script: `scripts/automation/run-seo-affiliate.mjs`
- Input: only blog files changed on the current weekly branch
- Output: metadata completion and affiliate placeholder injection
- Constraint: no live affiliate URLs may be invented

### Sunday 20:00 Australia/Sydney — Performance Logger

- Workflow: `.github/workflows/performance-logger.yml`
- Script: `scripts/automation/run-performance-logger.mjs`
- Input: Beehiiv API metrics
- Output: upserted row in `logs/performance-log.md`
- Branch: `codex/performance-week-YYYY-WW`
- PR: `Automation: performance week YYYY-WW`

## Required configuration

GitHub Actions permissions:

- `contents: write`
- `pull-requests: write`
- `models: read` on the 4 model-driven workflows

GitHub Actions secrets:

- `BEEHIIV_API_KEY`
- `BEEHIIV_PUBLICATION_ID`

Optional GitHub Actions variable:

- `GITHUB_MODELS_MODEL`

## Operator rules

- First live validation should be `workflow_dispatch` on `weekly-harvest.yml`.
- Use the `force` input on backfills when a dated file already exists and needs regeneration.
- Merge only after reviewing generated markdown in the draft PR.
- Keep model outputs bounded to the supplied source pack. If harvest quality degrades, fix feed selection before changing model prompts.
