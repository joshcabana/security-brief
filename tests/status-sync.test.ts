import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildLatestDeploySummary,
  buildPinnedBaselineHeader,
  formatStatusDate,
  syncStatusDocumentSource,
} from '../lib/status-sync.mjs';

const sampleStatusSource = `# AI Security Brief — Project Status

**Pinned baseline:** \`origin/main\` @ \`a1b2c3d4e5f6\` **Last updated:** 01 April 2026 **Updated by:** Codex

**Verification pipeline:** \`pnpm verify:pr\`, \`pnpm verify:ops\`, \`NEXT_PUBLIC_PLAUSIBLE_DOMAIN=aithreatbrief.com pnpm verify:live\`

## Site Status

| Component | Status |
| --- | --- |
| Live URL | https://aithreatbrief.com |
| Latest deploy | \`main\` @ \`a1b2c3d4e5f6\` — runtime reported active deployment |

## Open PRs

- #101 Draft release note cleanup

Most recent merges:

- old merge one
- old merge two

## System Notes

Keep this current.
`;

test('formatStatusDate renders operator-friendly Sydney dates', () => {
  assert.equal(
    formatStatusDate(new Date('2026-04-07T00:00:00Z')),
    '07 April 2026',
  );
});

test('header and latest deploy summary builders use the current status contract', () => {
  assert.equal(
    buildPinnedBaselineHeader({
      pinnedBaselineRef: 'origin/main',
      pinnedBaselineSha: '264b1c263cab85076c29630c1c4c073a077b7d91',
      lastUpdated: '07 April 2026',
      updatedBy: 'Codex',
    }),
    '**Pinned baseline:** `origin/main` @ `264b1c263cab85076c29630c1c4c073a077b7d91` **Last updated:** 07 April 2026 **Updated by:** Codex',
  );
  assert.equal(
    buildLatestDeploySummary({
      deployRef: 'main',
      sha: '264b1c263cab85076c29630c1c4c073a077b7d91',
    }),
    '`main` @ `264b1c263cab85076c29630c1c4c073a077b7d91` — runtime reported active deployment',
  );
});

test('syncStatusDocumentSource updates machine-managed STATUS fields and preserves open PR lines', () => {
  const syncedStatusSource = syncStatusDocumentSource(sampleStatusSource, {
    pinnedBaselineRef: 'origin/main',
    pinnedBaselineSha: '264b1c263cab85076c29630c1c4c073a077b7d91',
    lastUpdated: '07 April 2026',
    updatedBy: 'Codex',
    recentMerges: [
      'fix: update GITHUB_MODELS_MODEL resolution to ensure proper variable access in workflow environments',
      'refactor: migrate inline styles to Tailwind classes, update metadata descriptions, and fix GitHub Actions variable syntax.',
      'refactor: update report preview page to use dynamic site configuration for Pro access and CTA routing',
    ],
  });

  assert.match(
    syncedStatusSource,
    /\*\*Pinned baseline:\*\* `origin\/main` @ `264b1c263cab85076c29630c1c4c073a077b7d91` \*\*Last updated:\*\* 07 April 2026 \*\*Updated by:\*\* Codex/,
  );
  assert.match(
    syncedStatusSource,
    /^\| Latest deploy \| `main` @ `264b1c263cab85076c29630c1c4c073a077b7d91` — runtime reported active deployment \|$/m,
  );
  assert.match(syncedStatusSource, /- #101 Draft release note cleanup/);
  assert.match(
    syncedStatusSource,
    /Most recent merges:\n\n- fix: update GITHUB_MODELS_MODEL resolution to ensure proper variable access in workflow environments\n- refactor: migrate inline styles to Tailwind classes, update metadata descriptions, and fix GitHub Actions variable syntax\.\n- refactor: update report preview page to use dynamic site configuration for Pro access and CTA routing/,
  );
  assert.doesNotMatch(syncedStatusSource, /old merge one/);
});
