import { existsSync, readFileSync } from 'fs'
import { resolve } from 'path'

const STATUS_DOCUMENT_PATH = resolve(process.cwd(), 'STATUS.md')
const FALLBACK_SITE_NAME = 'AI Security Brief'
const FALLBACK_SITE_URL = 'https://aithreatbrief.com'

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normaliseKey(value) {
  return value
    .toLowerCase()
    .replace(/`/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

function extractSection(statusSource, heading) {
  const match = statusSource.match(
    new RegExp(`^## ${escapeRegExp(heading)}\\n([\\s\\S]*?)(?=^## |\\Z)`, 'm'),
  )

  if (!match) {
    throw new Error(`STATUS.md is missing the "${heading}" section.`)
  }

  return match[1].trim()
}

function parseTable(sectionSource) {
  const rows = sectionSource
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|'))

  if (rows.length < 3) {
    throw new Error('Expected a markdown table with a header, divider, and at least one row.')
  }

  return rows.slice(2).map((line) => {
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim())

    if (cells.length < 2) {
      throw new Error(`Invalid markdown table row in STATUS.md: ${line}`)
    }

    return {
      label: cells[0],
      value: cells.slice(1).join(' | '),
      key: normaliseKey(cells[0]),
    }
  })
}

function rowsToObject(rows) {
  return Object.fromEntries(rows.map((row) => [row.key, row.value]))
}

function parseOpenPullRequestSection(sectionSource) {
  const lines = sectionSource
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const mergeMarkerIndex = lines.findIndex((line) => line === 'Most recent merges:')
  const openPullRequests = mergeMarkerIndex === -1 ? lines : lines.slice(0, mergeMarkerIndex)
  const recentMerges = mergeMarkerIndex === -1 ? [] : lines.slice(mergeMarkerIndex + 1)

  return {
    open_pull_requests:
      openPullRequests.length === 1 && openPullRequests[0] === 'None.'
        ? []
        : openPullRequests.filter((line) => line.startsWith('- ')).map((line) => line.slice(2)),
    recent_merges: recentMerges.filter((line) => line.startsWith('- ')).map((line) => line.slice(2)),
  }
}

function formatUrlFromDomain(value) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimmedValue
  }

  return `https://${trimmedValue}`
}

function mergeRuntimeOverrides(baseRuntime, runtimeOverrides) {
  const overrides = runtimeOverrides ?? {}

  return Object.fromEntries(
    Object.entries({
      ...baseRuntime,
      ...overrides,
    }).map(([key, value]) => [key, value ?? null]),
  )
}

function extractDeployIdentityFromSummary(value) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  const match = trimmedValue.match(/`([^`]+)` @ `([0-9a-f]{7,40})`/)

  if (!match) {
    return null
  }

  return {
    ref: match[1],
    sha: match[2],
  }
}

function replaceRowValue(rows, label, value) {
  return rows.map((row) => (row.label === label ? { ...row, value } : row))
}

function buildRuntimeLatestDeploy(runtime) {
  if (!runtime.git_commit_ref || !runtime.git_commit_sha) {
    return null
  }

  return `\`${runtime.git_commit_ref}\` @ \`${runtime.git_commit_sha}\` — runtime reported active deployment`
}

function buildRuntimeVerificationPipeline(runtime, documentVerificationPipeline) {
  if (!runtime.git_commit_ref || !runtime.git_commit_sha) {
    return documentVerificationPipeline
  }

  return `Runtime currently reports active deploy \`${runtime.git_commit_ref}\` @ \`${runtime.git_commit_sha}\`. Use \`STATUS.md\` for operator-authored verification history and release narrative.`
}

function buildStatusDocumentDrift(parsedStatus, runtime, runtimeLatestDeploy) {
  const documentLatestDeploy = parsedStatus.site_status.latest_deploy ?? null
  const documentDeployIdentity = extractDeployIdentityFromSummary(documentLatestDeploy)
  const runtimeHasDeployIdentity = Boolean(runtime.git_commit_ref && runtime.git_commit_sha)
  const baselineDriftDetected =
    runtimeHasDeployIdentity &&
    (parsedStatus.pinned_baseline_ref !== `origin/${runtime.git_commit_ref}` ||
      parsedStatus.pinned_baseline_sha !== runtime.git_commit_sha)
  const deployDriftDetected =
    runtimeHasDeployIdentity &&
    documentDeployIdentity !== null &&
    (documentDeployIdentity.ref !== runtime.git_commit_ref ||
      documentDeployIdentity.sha !== runtime.git_commit_sha)
  const detected = baselineDriftDetected || deployDriftDetected

  return {
    detected,
    summary: runtimeHasDeployIdentity
      ? detected
        ? `STATUS.md deploy identity lags the runtime deployment. Runtime is authoritative for public deploy identity.`
        : 'STATUS.md deploy identity matches the runtime deployment.'
      : 'Runtime git metadata is unavailable; STATUS.md values are shown without runtime reconciliation.',
    document_pinned_baseline_ref: parsedStatus.pinned_baseline_ref,
    document_pinned_baseline_sha: parsedStatus.pinned_baseline_sha,
    document_latest_deploy: documentLatestDeploy,
    runtime_git_commit_ref: runtime.git_commit_ref,
    runtime_git_commit_sha: runtime.git_commit_sha,
    runtime_latest_deploy: runtimeLatestDeploy,
  }
}

function buildAuthoritativeStatusDocument(parsedStatus, runtime) {
  const runtimeHasDeployIdentity = Boolean(runtime.git_commit_ref && runtime.git_commit_sha)
  const runtimePinnedBaselineRef = runtimeHasDeployIdentity ? `origin/${runtime.git_commit_ref}` : parsedStatus.pinned_baseline_ref
  const runtimePinnedBaselineSha = runtimeHasDeployIdentity ? runtime.git_commit_sha : parsedStatus.pinned_baseline_sha
  const runtimeLatestDeploy = buildRuntimeLatestDeploy(runtime)
  const siteStatusRows =
    runtimeLatestDeploy === null
      ? parsedStatus.site_status_rows
      : replaceRowValue(parsedStatus.site_status_rows, 'Latest deploy', runtimeLatestDeploy)

  return {
    ...parsedStatus,
    pinned_baseline_ref: runtimePinnedBaselineRef,
    pinned_baseline_sha: runtimePinnedBaselineSha,
    verification_pipeline: buildRuntimeVerificationPipeline(runtime, parsedStatus.verification_pipeline),
    site_status_rows: siteStatusRows,
    site_status: rowsToObject(siteStatusRows),
    drift: buildStatusDocumentDrift(parsedStatus, runtime, runtimeLatestDeploy),
  }
}

export function readStatusDocument(statusDocumentPath) {
  const documentPath = statusDocumentPath ?? STATUS_DOCUMENT_PATH

  if (!existsSync(documentPath)) {
    throw new Error(`Could not find STATUS.md at ${documentPath}.`)
  }

  return readFileSync(documentPath, 'utf8')
}

export function parseStatusDocument(statusSource) {
  const headerMatch = statusSource.match(
    /\*\*Pinned(?: baseline| to):\*\* `([^`]+)` @ `([0-9a-f]{7,40})` \*\*Last updated:\*\* ([^*]+) \*\*Updated by:\*\* ([^\n]+)/,
  )

  if (!headerMatch) {
    throw new Error('STATUS.md is missing the pinned baseline header contract.')
  }

  const verificationPipelineMatch = statusSource.match(/\*\*Verification pipeline:\*\* ([^\n]+)/)

  if (!verificationPipelineMatch) {
    throw new Error('STATUS.md is missing the verification pipeline contract.')
  }

  const siteStatusRows = parseTable(extractSection(statusSource, 'Site Status'))
  const contentRows = parseTable(extractSection(statusSource, 'Content'))
  const openPullRequestStatus = parseOpenPullRequestSection(extractSection(statusSource, 'Open PRs'))

  return {
    pinned_baseline_ref: headerMatch[1],
    pinned_baseline_sha: headerMatch[2],
    last_updated: headerMatch[3].trim(),
    updated_by: headerMatch[4].trim(),
    verification_pipeline: verificationPipelineMatch[1].trim(),
    site_status: rowsToObject(siteStatusRows),
    site_status_rows: siteStatusRows,
    content: rowsToObject(contentRows),
    content_rows: contentRows,
    open_pull_requests: openPullRequestStatus.open_pull_requests,
    recent_merges: openPullRequestStatus.recent_merges,
  }
}

export function buildStatusSnapshot(options) {
  const resolvedOptions = options ?? {}
  const generatedAt = resolvedOptions.generatedAt ?? new Date().toISOString()
  const statusSource = resolvedOptions.statusSource ?? readStatusDocument(resolvedOptions.statusPath)
  const parsedStatus = parseStatusDocument(statusSource)
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || FALLBACK_SITE_NAME
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || FALLBACK_SITE_URL

  const runtime = mergeRuntimeOverrides(
    {
      node_env: process.env.NODE_ENV ?? null,
      target_env: process.env.VERCEL_TARGET_ENV ?? process.env.VERCEL_ENV ?? null,
      deployment_url: formatUrlFromDomain(process.env.VERCEL_URL),
      branch_url: formatUrlFromDomain(process.env.VERCEL_BRANCH_URL),
      production_url: formatUrlFromDomain(process.env.VERCEL_PROJECT_PRODUCTION_URL) ?? siteUrl,
      git_commit_sha: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
      git_commit_ref: process.env.VERCEL_GIT_COMMIT_REF ?? null,
      git_previous_sha: process.env.VERCEL_GIT_PREVIOUS_SHA ?? null,
    },
    resolvedOptions.runtimeOverrides,
  )
  const statusDocument = buildAuthoritativeStatusDocument(parsedStatus, runtime)

  return {
    generated_at: generatedAt,
    schema_version: '2',
    site: {
      name: siteName,
      url: siteUrl,
    },
    status_document: statusDocument,
    runtime,
  }
}
