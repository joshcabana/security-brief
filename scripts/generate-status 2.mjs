#!/usr/bin/env node
/**
 * generate-status.mjs
 * Merges CI context + verify-live output into a single machine-readable status.json.
 * Uploaded as a CI artifact on every main push — replaces prose handoff summaries.
 *
 * Usage (in CI):
 *   node scripts/generate-status.mjs --live-report verify-live.json --output status.json
 *
 * Usage (local dry-run, no verify-live.json required):
 *   node scripts/generate-status.mjs --output status.json
 */

import { readFileSync, writeFileSync, existsSync } from 'fs'
import { resolve, isAbsolute } from 'path'

const BOLD  = '\x1b[1m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const RESET = '\x1b[0m'

function arg(name) {
  const idx = process.argv.indexOf(`--${name}`)
  return idx !== -1 && idx < process.argv.length - 1 ? process.argv[idx + 1] : null
}

function resolvePath(p) {
  return isAbsolute(p) ? p : resolve(process.cwd(), p)
}

// ── CI environment ──────────────────────────────────────────────────────────
const ci = {
  run_id:        process.env.GITHUB_RUN_ID        || null,
  run_number:    process.env.GITHUB_RUN_NUMBER     || null,
  run_url:       process.env.GITHUB_RUN_ID
                   ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
                   : null,
  commit_sha:    process.env.GITHUB_SHA            || null,
  commit_ref:    process.env.GITHUB_REF_NAME       || null,
  repository:    process.env.GITHUB_REPOSITORY     || 'joshcabana/ai-security-brief',
  workflow:      process.env.GITHUB_WORKFLOW        || null,
  actor:         process.env.GITHUB_ACTOR           || null,
  triggered_at:  new Date().toISOString(),
}

// ── Deploy context ───────────────────────────────────────────────────────────
const deploy = {
  production_url:  'https://aithreatbrief.com',
  vercel_fallback: 'https://ai-security-brief.vercel.app',
  deploy_skipped:  process.env.DEPLOY_SKIPPED === 'true' || false,
}

// ── verify-live report ───────────────────────────────────────────────────────
const liveReportPath = arg('live-report')
let liveReport = null

if (liveReportPath && existsSync(resolvePath(liveReportPath))) {
  try {
    liveReport = JSON.parse(readFileSync(resolvePath(liveReportPath), 'utf8'))
  } catch {
    liveReport = { ok: null, error: 'Failed to parse verify-live report' }
  }
} else {
  liveReport = { ok: null, note: 'verify-live report not provided or not found' }
}

// ── Assemble status.json ──────────────────────────────────────────────────────
const status = {
  generated_at:    new Date().toISOString(),
  schema_version:  '1',
  ci,
  deploy,
  verify_live:     liveReport,
  overall_ok:      liveReport?.ok === true,
  redirects: {
    www:   'www.aithreatbrief.com → https://aithreatbrief.com (308)',
    alias: 'aisecbrief.com → https://aithreatbrief.com (308)',
  },
  env_contract: {
    required: [
      'BEEHIIV_API_KEY',
      'BEEHIIV_PUBLICATION_ID',
      'NEXT_PUBLIC_SITE_URL',
      'NEXT_PUBLIC_SITE_NAME',
    ],
    banned: [
      'NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID',
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
    ],
  },
}

// ── Write output ──────────────────────────────────────────────────────────────
const outputPath = resolvePath(arg('output') || 'status.json')
writeFileSync(outputPath, JSON.stringify(status, null, 2) + '\n')

console.log(`${BOLD}${GREEN}✓ status.json written${RESET} → ${outputPath}`)
console.log(`  overall_ok:  ${status.overall_ok ? `${GREEN}true${RESET}` : `${YELLOW}false/pending${RESET}`}`)
console.log(`  commit_sha:  ${ci.commit_sha || '(local run)'}`)
console.log(`  run_url:     ${ci.run_url || '(local run)'}`)

// ── GitHub Step Summary ───────────────────────────────────────────────────────
if (process.env.GITHUB_STEP_SUMMARY) {
  const lines = [
    '## status.json',
    '',
    `| Field | Value |`,
    `|---|---|`,
    `| commit | \`${ci.commit_sha || 'n/a'}\` |`,
    `| run | [${ci.run_number || 'n/a'}](${ci.run_url || '#'}) |`,
    `| production_url | ${deploy.production_url} |`,
    `| deploy_skipped | ${deploy.deploy_skipped} |`,
    `| verify_live.ok | ${liveReport?.ok ?? 'n/a'} |`,
    `| overall_ok | **${status.overall_ok}** |`,
    '',
  ]
  writeFileSync(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'), { flag: 'a' })
}
