#!/usr/bin/env node
/**
 * verify-ops.mjs
 * Pre-launch operator check: validates required env vars and runtime readiness.
 * Run: pnpm verify:ops
 *      pnpm verify:ops:contract
 * Exit 0 = ready / warnings only. Exit 1 = missing config or runtime failure.
 */

import { appendFileSync, existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = process.cwd()
const CONTRACT_ONLY = process.argv.includes('--contract-only')
const BOLD  = '\x1b[1m'
const RED   = '\x1b[31m'
const GREEN = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN  = '\x1b[36m'
const RESET = '\x1b[0m'

// ── 2. Required env vars (sourced from .env.example — authoritative contract) ─
const REQUIRED = [
  {
    key: 'BEEHIIV_API_KEY',
    hint: 'Beehiiv dashboard → Settings → API → Generate key',
  },
  {
    key: 'BEEHIIV_PUBLICATION_ID',
    hint: 'Beehiiv dashboard → Settings → Publication ID (starts with pub_)',
  },
  {
    key: 'NEXT_PUBLIC_SITE_URL',
    hint: 'Your Vercel deployment URL, e.g. https://ai-security-brief.vercel.app',
  },
  {
    key: 'NEXT_PUBLIC_SITE_NAME',
    hint: 'Display name, e.g. "The AI Security Brief"',
  },
  {
    key: 'UPSTASH_REDIS_REST_URL',
    hint: 'Upstash Redis REST URL for distributed rate limiting',
  },
  {
    key: 'UPSTASH_REDIS_REST_TOKEN',
    hint: 'Upstash Redis REST token for distributed rate limiting',
  },
]

const OPTIONAL = [
  'BEEHIIV_WELCOME_AUTOMATION_ID',
  'AFFILIATE_NORDVPN',
  'AFFILIATE_PUREVPN',
  'AFFILIATE_PROTON',
  'AFFILIATE_PROTON_VPN',
  'AFFILIATE_PROTON_MAIL',
]

// ── 3. Known stale vars that must NOT be present (prevents misconfiguration) ──
const BANNED = [
  {
    key: 'NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID',
    reason: 'Outdated — use server-side BEEHIIV_PUBLICATION_ID instead',
  },
  {
    key: 'SUPABASE_URL',
    reason: 'Supabase removed from runtime — do not add this',
  },
  {
    key: 'SUPABASE_ANON_KEY',
    reason: 'Supabase removed from runtime — do not add this',
  },
]

function parseEnvFile(filePath) {
  return readFileSync(filePath, 'utf8')
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'))
    .map((line) => {
      const eqIdx = line.indexOf('=')
      if (eqIdx === -1) {
        return null
      }

      return {
        key: line.slice(0, eqIdx).trim(),
        value: line.slice(eqIdx + 1).trim().replace(/^['"]|['"]$/g, ''),
      }
    })
    .filter(Boolean)
}

function previewValue(value) {
  return value.length > 8 ? value.slice(0, 4) + '…' + value.slice(-4) : '****'
}

function writeSummary(summaryLines) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return
  }

  appendFileSync(process.env.GITHUB_STEP_SUMMARY, summaryLines.join('\n') + '\n')
}

// ── 4. Load .env.local if present (mirrors Next.js runtime lookup) ────────────
if (!CONTRACT_ONLY) {
  const envLocalPath = resolve(ROOT, '.env.local')
  if (existsSync(envLocalPath)) {
    for (const entry of parseEnvFile(envLocalPath)) {
      if (!process.env[entry.key]) {
        process.env[entry.key] = entry.value
      }
    }
  }
}

// ── 5. Run checks ─────────────────────────────────────────────────────────────
console.log(`\n${BOLD}${CYAN}╔══════════════════════════════════════╗${RESET}`)
if (CONTRACT_ONLY) {
  console.log(`${BOLD}${CYAN}║ ai-security-brief env contract check ║${RESET}`)
} else {
  console.log(`${BOLD}${CYAN}║     ai-security-brief verify:ops     ║${RESET}`)
}
console.log(`${BOLD}${CYAN}╚══════════════════════════════════════╝${RESET}\n`)

let errors = 0
let warnings = 0
const summaryLines = [
  CONTRACT_ONLY ? '## Env contract check' : '## verify:ops',
  '',
]

if (!CONTRACT_ONLY) {
  console.log(`${BOLD}── Required env vars ──────────────────────────────${RESET}`)
  summaryLines.push('### Required env vars')
  for (const { key, hint } of REQUIRED) {
    const val = process.env[key]
    if (!val || val.trim() === '') {
      console.log(`  ${RED}✗ MISSING${RESET}  ${BOLD}${key}${RESET}`)
      console.log(`           ${YELLOW}→ ${hint}${RESET}`)
      summaryLines.push(`- MISSING \`${key}\` — ${hint}`)
      errors++
    } else {
      const preview = previewValue(val)
      console.log(`  ${GREEN}✓ SET${RESET}     ${BOLD}${key}${RESET} ${YELLOW}(${preview})${RESET}`)
      summaryLines.push(`- SET \`${key}\` (${preview})`)
    }
  }

  console.log(`\n${BOLD}── Stale / banned vars (must be absent) ───────────${RESET}`)
  summaryLines.push('', '### Stale / banned vars')
  for (const { key, reason } of BANNED) {
    if (process.env[key]) {
      console.log(`  ${RED}✗ FOUND${RESET}   ${BOLD}${key}${RESET}`)
      console.log(`           ${YELLOW}→ ${reason}${RESET}`)
      summaryLines.push(`- FOUND \`${key}\` — ${reason}`)
      warnings++
    } else {
      console.log(`  ${GREEN}✓ ABSENT${RESET}  ${BOLD}${key}${RESET}`)
      summaryLines.push(`- ABSENT \`${key}\``)
    }
  }
}

// ── 6. .env.example drift check ───────────────────────────────────────────────
console.log(`\n${BOLD}── .env.example contract check ─────────────────────${RESET}`)
summaryLines.push('', '### .env.example contract check')

const envExamplePath = resolve(ROOT, '.env.example')
if (existsSync(envExamplePath)) {
  const exampleEntries = parseEnvFile(envExamplePath)
  const exampleKeys = exampleEntries.map((entry) => entry.key)
  const requiredKeys = REQUIRED.map((entry) => entry.key)
  const bannedKeys = BANNED.map((entry) => entry.key)
  const optionalKeys = OPTIONAL
  const missingRequired = requiredKeys.filter((key) => !exampleKeys.includes(key))
  const bannedPresent = bannedKeys.filter((key) => exampleKeys.includes(key))
  const unexpectedExtra = exampleKeys.filter(
    (key) => !requiredKeys.includes(key) && !bannedKeys.includes(key) && !optionalKeys.includes(key),
  )

  if (missingRequired.length) {
    missingRequired.forEach((key) => {
      console.log(`  ${YELLOW}⚠ MISSING IN .env.example${RESET}  ${key}`)
      summaryLines.push(`- DRIFT: missing required key \`${key}\` in \`.env.example\``)
      warnings++
    })
  }
  if (bannedPresent.length) {
    bannedPresent.forEach((key) => {
      const reason = BANNED.find((entry) => entry.key === key)?.reason ?? 'Remove this stale key.'
      console.log(`  ${YELLOW}⚠ BANNED IN .env.example${RESET}  ${key}`)
      console.log(`           ${YELLOW}→ ${reason}${RESET}`)
      summaryLines.push(`- DRIFT: banned key \`${key}\` present in \`.env.example\` — ${reason}`)
      warnings++
    })
  }
  if (unexpectedExtra.length) {
    unexpectedExtra.forEach((key) => {
      console.log(`  ${YELLOW}⚠ UNEXPECTED EXTRA KEY${RESET}  ${key}`)
      summaryLines.push(`- DRIFT: unexpected extra key \`${key}\` in \`.env.example\``)
      warnings++
    })
  }
  if (!missingRequired.length && !bannedPresent.length && !unexpectedExtra.length) {
    console.log(`  ${GREEN}✓ .env.example matches required contract${RESET}`)
    summaryLines.push('- No drift detected.')
  }
} else {
  console.log(`  ${YELLOW}⚠ .env.example not found — contract drift cannot be checked${RESET}`)
  summaryLines.push('- DRIFT: `.env.example` not found.')
  warnings++
}

// ── 7. Summary ────────────────────────────────────────────────────────────────
console.log(`\n${BOLD}── Summary ─────────────────────────────────────────${RESET}`)
summaryLines.push('', '### Summary')
if (CONTRACT_ONLY) {
  if (warnings === 0) {
    console.log(`  ${GREEN}${BOLD}✓ Contract check passed. No drift detected.${RESET}\n`)
    summaryLines.push('- PASS: no env contract drift detected.')
  } else {
    console.log(`  ${YELLOW}${BOLD}⚠ ${warnings} warning(s) — env contract drift detected.${RESET}\n`)
    summaryLines.push(`- WARN: ${warnings} env contract drift warning(s) detected.`)
  }
  writeSummary(summaryLines)
  process.exit(0)
}

if (errors === 0 && warnings === 0) {
  console.log(`  ${GREEN}${BOLD}✓ All checks passed. Ready to deploy.${RESET}\n`)
  summaryLines.push('- PASS: runtime env is ready to deploy.')
  writeSummary(summaryLines)
  process.exit(0)
}

if (errors > 0) {
  console.log(`  ${RED}${BOLD}✗ ${errors} error(s) — deployment will fail without these.${RESET}`)
  summaryLines.push(`- FAIL: ${errors} required runtime env value(s) missing.`)
}
if (warnings > 0) {
  console.log(`  ${YELLOW}⚠ ${warnings} warning(s) — review before deploying.${RESET}`)
  summaryLines.push(`- WARN: ${warnings} warning(s) detected.`)
}
console.log()
writeSummary(summaryLines)
process.exit(errors > 0 ? 1 : 0)
