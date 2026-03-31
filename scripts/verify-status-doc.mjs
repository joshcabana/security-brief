#!/usr/bin/env node

import { spawnSync } from 'child_process'
import { parseStatusDocument, readStatusDocument } from '../lib/status-data.mjs'

const BOLD = '\x1b[1m'
const GREEN = '\x1b[32m'
const RED = '\x1b[31m'
const RESET = '\x1b[0m'

function getArgValue(name) {
  const flag = `--${name}`
  const index = process.argv.indexOf(flag)

  if (index === -1 || index === process.argv.length - 1) {
    return null
  }

  return process.argv[index + 1]
}

function resolveExpectedBaselineSha() {
  const explicitValue = getArgValue('expected-main-sha') ?? process.env.EXPECTED_STATUS_BASELINE_SHA ?? null

  if (explicitValue) {
    return explicitValue.trim()
  }

  const gitResult = spawnSync('git', ['rev-parse', 'origin/main'], {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  if (gitResult.status !== 0) {
    throw new Error(
      'Could not resolve the expected STATUS.md baseline SHA. Provide --expected-main-sha or fetch origin/main first.',
    )
  }

  return gitResult.stdout.trim()
}

function normaliseSha(value) {
  return value.trim().toLowerCase()
}

function shaMatches(expectedSha, actualSha) {
  const normalisedExpectedSha = normaliseSha(expectedSha)
  const normalisedActualSha = normaliseSha(actualSha)

  return (
    normalisedExpectedSha === normalisedActualSha ||
    normalisedExpectedSha.startsWith(normalisedActualSha) ||
    normalisedActualSha.startsWith(normalisedExpectedSha)
  )
}

function run() {
  const expectedBaselineSha = resolveExpectedBaselineSha()
  const parsedStatus = parseStatusDocument(readStatusDocument())

  if (!shaMatches(expectedBaselineSha, parsedStatus.pinned_baseline_sha)) {
    throw new Error(
      [
        'STATUS.md is pinned to the wrong main baseline.',
        `Expected baseline SHA: ${expectedBaselineSha}`,
        `Pinned baseline SHA: ${parsedStatus.pinned_baseline_sha}`,
        'Rebase onto the latest main tip, update STATUS.md to that baseline SHA, and rerun verification.',
      ].join('\n'),
    )
  }

  console.log(
    `${BOLD}${GREEN}✓ STATUS.md baseline matches${RESET} ${parsedStatus.pinned_baseline_ref} @ ${parsedStatus.pinned_baseline_sha}`,
  )
}

try {
  run()
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown STATUS.md verification error.'
  console.error(`${BOLD}${RED}STATUS.md baseline check failed${RESET}\n${message}`)
  process.exitCode = 1
}
