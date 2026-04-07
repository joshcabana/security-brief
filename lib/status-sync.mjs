function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function assertReplace(source, pattern, replacement, description) {
  if (!pattern.test(source)) {
    throw new Error(`Could not find ${description} in STATUS.md.`)
  }

  return source.replace(pattern, replacement)
}

function normaliseDisplayRef(value) {
  return value.replace(/^origin\//, '')
}

export function formatStatusDate(value, timeZone = 'Australia/Sydney') {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone,
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(value)
}

export function buildPinnedBaselineHeader({ pinnedBaselineRef, pinnedBaselineSha, lastUpdated, updatedBy }) {
  return `**Pinned baseline:** \`${pinnedBaselineRef}\` @ \`${pinnedBaselineSha}\` **Last updated:** ${lastUpdated} **Updated by:** ${updatedBy}`
}

export function buildLatestDeploySummary({ deployRef, sha }) {
  return `\`${deployRef}\` @ \`${sha}\` — runtime reported active deployment`
}

export function syncStatusDocumentSource(
  statusSource,
  {
    pinnedBaselineRef,
    pinnedBaselineSha,
    lastUpdated,
    updatedBy,
    recentMerges,
    latestDeployRef = normaliseDisplayRef(pinnedBaselineRef),
  },
) {
  const header = buildPinnedBaselineHeader({
    pinnedBaselineRef,
    pinnedBaselineSha,
    lastUpdated,
    updatedBy,
  })
  const latestDeployRow = `| Latest deploy | ${buildLatestDeploySummary({
    deployRef: latestDeployRef,
    sha: pinnedBaselineSha,
  })} |`
  const mergesBlock = `Most recent merges:\n\n${recentMerges.map((merge) => `- ${merge}`).join('\n')}`

  let nextSource = statusSource

  nextSource = assertReplace(
    nextSource,
    /\*\*Pinned(?: baseline| to):\*\* `[^`]+` @ `[0-9a-f]{7,40}` \*\*Last updated:\*\* [^*]+ \*\*Updated by:\*\* [^\n]+/,
    header,
    'the pinned baseline header',
  )
  nextSource = assertReplace(
    nextSource,
    /^\| Latest deploy \| .*$/m,
    latestDeployRow,
    'the Latest deploy row',
  )
  nextSource = assertReplace(
    nextSource,
    /Most recent merges:\n(?:\n- .*)+(?=\n## |\s*$)/m,
    mergesBlock,
    'the Most recent merges block',
  )

  return nextSource
}

export function buildStatusSyncConfig({
  pinnedBaselineRef = 'origin/main',
  pinnedBaselineSha,
  lastUpdated = formatStatusDate(new Date()),
  updatedBy = 'Codex',
  recentMerges = [],
}) {
  return {
    pinnedBaselineRef,
    pinnedBaselineSha,
    lastUpdated,
    updatedBy,
    recentMerges,
  }
}
