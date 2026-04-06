# AI Threat Brief — Scheduled Health Check Runbook

**Project:** aithreatbrief.com
**Repository:** github.com/joshcabana/ai-security-brief
**Task ID:** `aithreatbrief-health-check`
**Schedule:** Every Wednesday at 9:00 AM (Sydney/AEST)
**Created:** 31 March 2026

---

## What This Task Does

Every Wednesday morning, Claude automatically runs a health check on your AI Security Brief deployment. It reviews Vercel deployments for failures, scans runtime logs for errors and warnings, checks for stale pull requests awaiting review, and delivers a concise report. The timing is deliberate — it sits between your Monday content pipeline (harvest → articles → newsletter → SEO) and your Sunday performance logger, catching issues mid-week before they compound.

---

## Your Project Configuration

| Setting | Value |
|---------|-------|
| Vercel Team ID | `team_Dx2ZWbSD7WNciiYVNlkHfI9h` |
| Vercel Project ID | `prj_cRHUZ1JfYWKSnh333dQv8hkx548O` |
| Vercel Team Slug | `josh-cabanas-projects` |
| GitHub Repo | `joshcabana/ai-security-brief` |
| Production Domain | `aithreatbrief.com` |
| Task File Location | `~/Documents/Claude/Scheduled/aithreatbrief-health-check/SKILL.md` |

---

## Initial Setup Checklist

Complete these steps once to ensure the scheduled task runs smoothly on its own.

- [ ] **Step 1 — Confirm the task is visible in the sidebar.** Open the Claude desktop app. In the left sidebar, look for the "Scheduled" section. You should see `aithreatbrief-health-check` listed with the schedule "At 09:00 AM, only on Wednesday." If you don't see it, the task file may not have been saved correctly — re-run the creation step from the conversation.

- [ ] **Step 2 — Run the task manually to pre-approve tools.** Click the task in the sidebar and hit "Run now." The first run will pause to ask you for permission to use the Vercel connector tools (list_deployments, get_runtime_logs, etc.). Approve each one. These approvals are stored on the task and auto-applied to future runs, so you only need to do this once. If you skip this step, the first scheduled Wednesday run will stall waiting for permissions while you're not at your desk.

- [ ] **Step 3 — Verify the first run completes.** After approving tools, the task should run to completion and produce a health report. Confirm you see output covering: deployment status, runtime log summary, and PR queue. If the task errors out, check that your Vercel connector is still authenticated (Settings → Connectors → Vercel).

- [ ] **Step 4 — Confirm notification delivery.** This task was created with `notifyOnCompletion: true`, which means this session will receive a notification each time the task finishes. Going forward, you'll see a notification in Claude whenever a Wednesday run completes. If you'd prefer silent runs, you can update the task to disable notifications.

---

## What the Health Check Covers

Each Wednesday run executes four checks in sequence.

### Check 1 — Vercel Deployment Status

The task queries Vercel's `list_deployments` API for the past 7 days. It looks for any deployment whose state is not `READY` (such as `ERROR`, `BUILDING`, or `CANCELED`). It also counts total deployments and notes which ones targeted production versus preview environments. A healthy week typically shows 5–15 deployments, all READY, with 2–4 hitting production after PR merges.

**What "good" looks like:** "All 12 deployments this week are READY. 3 production, 9 preview."
**What "bad" looks like:** "2 of 14 deployments failed with ERROR state. Both were on the codex/content-week branch — check GitHub Actions logs."

### Check 2 — Runtime Error Scan

The task queries Vercel's `get_runtime_logs` API filtered to production, looking only at `error`, `warning`, and `fatal` severity levels. It identifies patterns, counts recurring issues, and flags affected endpoints. Your most common issue right now is Upstash Redis connection failures on `/api/subscribe`, which cause 503 responses for newsletter signups.

**What "good" looks like:** "0 errors, 0 warnings in the past 7 days."
**What "bad" looks like:** "15 warnings on POST /api/subscribe — Upstash Redis client still unable to connect. Signups are returning 503."

### Check 3 — Open PR Review

The task checks the GitHub repo for open pull requests, with special attention to draft PRs from your Monday automation pipeline (branches named `codex/content-week-*`), any PR that's been open for more than 3 days, and PRs with failing CI checks. Since your automation creates draft PRs rather than pushing directly to main, this check ensures nothing gets forgotten.

**What "good" looks like:** "1 open PR — #52 (content week 15), opened Monday, CI passing, ready for your review."
**What "bad" looks like:** "PR #50 has been open for 10 days with no review. PR #53 has failing CI — lint errors in the generated article."

### Check 4 — Compiled Report

All findings are compiled into a single, actionable report with a prioritised list of anything that needs your attention. If everything is green, the report says so briefly and doesn't waste your time.

---

## Weekly Workflow Integration

Here's how this task fits into your existing automation schedule (all times AEST).

| Day | Time | Event | Source |
|-----|------|-------|--------|
| Sunday | 8:00 PM | Performance monitoring logs run | GitHub Actions |
| Monday | 5:00 AM | Weekly research harvest | GitHub Actions |
| Monday | 9:00 AM | Article generation | GitHub Actions |
| Monday | 1:00 PM | Newsletter compilation | GitHub Actions |
| Monday | 3:00 PM | SEO & affiliate optimisation | GitHub Actions |
| **Wednesday** | **9:00 AM** | **Health check (this task)** | **Claude Scheduled** |

The Wednesday check catches anything that went wrong during Monday's pipeline, any deployment issues from mid-week PR merges, and any runtime errors that accumulated since Sunday's performance log.

---

## Managing the Task

### View all scheduled tasks

Open the Claude desktop app → Sidebar → "Scheduled" section. Or in any conversation, ask: *"List my scheduled tasks."*

### Run it on demand

Click the task in the sidebar and press "Run now." Useful after a big deployment or if you suspect something's broken and don't want to wait until Wednesday.

### Pause or disable

In the sidebar, click the task and toggle it off. You can also ask Claude: *"Disable the aithreatbrief-health-check task."*

### Change the schedule

Ask Claude: *"Update aithreatbrief-health-check to run every day at 8am"* or *"Change the health check to run on Tuesdays and Fridays."* Claude will update the cron expression for you.

### Edit what the task does

The task prompt lives at `~/Documents/Claude/Scheduled/aithreatbrief-health-check/SKILL.md`. You can edit this file directly, or ask Claude to update it. For example: *"Add a check for Supabase table row counts to my health check task."*

### Delete the task

Ask Claude: *"Delete the aithreatbrief-health-check scheduled task."*

---

## Troubleshooting

### The task didn't run on Wednesday

The Claude desktop app must be running for scheduled tasks to fire. If the app was closed at 9:00 AM, the task will run when you next open it. Make sure the app is open and running before the scheduled time.

### The task stalls asking for permissions

This happens if the Vercel tools weren't pre-approved during initial setup. Run the task manually once (Step 2 above) and approve all tool permissions. They'll persist for future runs.

### Vercel connector stopped working

If the health check reports it can't reach Vercel, your connector token may have expired. Go to Claude Settings → Connectors → Vercel and re-authenticate. Then run the task manually to confirm it works.

### The runtime logs section is empty

Vercel only retains runtime logs for a limited window (varies by plan). If no serverless functions were invoked in production during the check window, the logs will be empty — this is normal for a static-heavy site like yours. The task will note this rather than flagging it as an error.

### The PR check can't access GitHub

The task uses browser-based access to check open PRs. If your GitHub repo goes private or access changes, the task may not be able to list PRs. Ensure the repo remains public, or connect a GitHub MCP connector for authenticated access.

---

## Current Known Issues (as of 31 March 2026)

These are the issues the health check is already aware of from the baseline scan run today.

1. **Upstash Redis not configured in Vercel** — The `/api/subscribe` endpoint returns 503 because the Upstash Redis client can't connect. This was identified in PR #51 (Beehiiv-only delivery) and documented in STATUS.md. Until the Redis environment variables are set in Vercel, newsletter signups through the site's own form will fail. Beehiiv's hosted form works independently.

2. **PR #50 (content week 14) open since Monday** — The automated content pipeline created this PR with harvest, articles, newsletter draft, and SEO metadata for week 14. It's ready for review and merge. The health check will continue flagging it until it's merged or closed.

---

## Extending This Task

Some ideas for making the health check more comprehensive over time.

**Add Supabase monitoring:** If you connect a Supabase database to the project, ask Claude to add a check for table row counts, slow queries, or storage usage.

**Add uptime monitoring:** Ask Claude to add a step that fetches key pages (homepage, /blog, /newsletter, /status) and verifies they return 200. This catches edge cases where Vercel shows READY but the app itself has a runtime crash.

**Add Lighthouse scores:** Ask Claude to periodically run a performance audit and track scores over time in a Notion database.

**Create a Notion dashboard:** Route the weekly health reports into a Notion page so you have a historical record of site health over time.

---

*This runbook was generated from a live scan of your Vercel deployments and GitHub repository on 31 March 2026.*
