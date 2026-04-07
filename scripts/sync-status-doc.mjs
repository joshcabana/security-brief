#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { isAbsolute, resolve } from 'path'
import { spawnSync } from 'child_process'
import { buildStatusSyncConfig, syncStatusDocumentSource } from '../lib/status-sync.mjs'

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

function resolvePath(value) {
  if (!value) {
    return resolve(process.cwd(), 'STATUS.md')
  }

  return isAbsolute(value) ? value : resolve(process.cwd(), value)
}

function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
  })

  if (result.status !== 0) {
    throw new Error(result.stderr.trim() || `git ${args.join(' ')} failed.`)
  }

  return result.stdout.trim()
}

function resolveRecentMergeCount() {
  const rawValue = getArgValue('recent-merges-count')

  if (!rawValue) {
    return 3
  }

  const parsedValue = Number.parseInt(rawValue, 10)

  if (!Number.isInteger(parsedValue) || parsedValue < 1) {
    throw new Error('--recent-merges-count must be a positive integer.')
  }

  return parsedValue
}

function run() {
  const statusPath = resolvePath(getArgValue('status-path'))
  const pinnedBaselineRef = getArgValue('ref') ?? 'origin/main'
  const pinnedBaselineSha = getArgValue('sha') ?? runGit(['rev-parse', pinnedBaselineRef])
  const recentMerges = (
    getArgValue('recent-merges')
      ? getArgValue('recent-merges').split('||')
      : runGit(['log', '--format=%s', `--max-count=${resolveRecentMergeCount()}`, pinnedBaselineRef]).split('\n')
  )
    .map((value) => value.trim())
    .filter(Boolean)
  const updatedBy = getArgValue('updated-by') ?? 'Codex'
  const lastUpdated = getArgValue('date') ?? buildStatusSyncConfig({ pinnedBaselineSha }).lastUpdated
  const currentSource = readFileSync(statusPath, 'utf8')
  const nextSource = syncStatusDocumentSource(
    currentSource,
    buildStatusSyncConfig({
      pinnedBaselineRef,
      pinnedBaselineSha,
      lastUpdated,
      updatedBy,
      recentMerges,
    }),
  )

  if (nextSource === currentSource) {
    console.log(
      `${BOLD}${GREEN}✓ STATUS.md already synced${RESET} ${pinnedBaselineRef} @ ${pinnedBaselineSha}`,
    )
    return
  }

  writeFileSync(statusPath, nextSource)
  console.log(`${BOLD}${GREEN}✓ STATUS.md synced${RESET} ${pinnedBaselineRef} @ ${pinnedBaselineSha}`)
}

try {
  run()
} catch (error) {
  const message = error instanceof Error ? error.message : 'Unknown STATUS.md sync failure.'
  console.error(`${BOLD}${RED}STATUS.md sync failed${RESET}\n${message}`)
  process.exitCode = 1
}
