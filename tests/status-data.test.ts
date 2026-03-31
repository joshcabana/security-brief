import assert from 'node:assert/strict';
import test from 'node:test';
import { buildStatusSnapshot } from '../lib/status-data.mjs';

const baselineStatusSource = `# AI Security Brief — Project Status

**Pinned baseline:** \`origin/main\` @ \`b48d8326cc306dd791efb3ae3d42b962944e7b84\` **Last updated:** 29 March 2026 **Updated by:** Codex

**Verification pipeline:** production remains GREEN on \`main\`; the latest run completed successfully on commit \`b48d832\`.

## Site Status

| Property | Value |
|---|---|
| Live URL | https://aithreatbrief.com |
| Latest deploy | \`main\` @ \`b48d8326cc306dd791efb3ae3d42b962944e7b84\` — READY |

## Content

| Metric | Count |
|---|---|
| Published articles | 12 |

## Open PRs

None.

Most recent merges:
- #47 — latest status and ops hardening merge on \`main\`

## Notes

Runtime metadata overlays deploy identity in public status surfaces.
`;

test('buildStatusSnapshot overlays deploy identity from runtime and reports drift when STATUS.md lags', () => {
  const snapshot = buildStatusSnapshot({
    statusSource: baselineStatusSource,
    runtimeOverrides: {
      git_commit_ref: 'main',
      git_commit_sha: '1234567890abcdef1234567890abcdef12345678',
      production_url: 'https://aithreatbrief.com',
      target_env: 'production',
    },
  });

  assert.equal(snapshot.status_document.pinned_baseline_ref, 'origin/main');
  assert.equal(snapshot.status_document.pinned_baseline_sha, '1234567890abcdef1234567890abcdef12345678');
  assert.equal(
    snapshot.status_document.site_status.latest_deploy,
    '`main` @ `1234567890abcdef1234567890abcdef12345678` — runtime reported active deployment',
  );
  assert.match(
    snapshot.status_document.verification_pipeline,
    /Runtime currently reports active deploy `main` @ `1234567890abcdef1234567890abcdef12345678`/,
  );
  assert.equal(snapshot.status_document.drift.detected, true);
  assert.equal(snapshot.status_document.drift.document_pinned_baseline_sha, 'b48d8326cc306dd791efb3ae3d42b962944e7b84');
  assert.equal(snapshot.status_document.drift.runtime_git_commit_sha, '1234567890abcdef1234567890abcdef12345678');
});

test('buildStatusSnapshot does not report drift when STATUS.md and runtime deploy identity match', () => {
  const snapshot = buildStatusSnapshot({
    statusSource: baselineStatusSource,
    runtimeOverrides: {
      git_commit_ref: 'main',
      git_commit_sha: 'b48d8326cc306dd791efb3ae3d42b962944e7b84',
      production_url: 'https://aithreatbrief.com',
    },
  });

  assert.equal(snapshot.status_document.pinned_baseline_sha, 'b48d8326cc306dd791efb3ae3d42b962944e7b84');
  assert.equal(snapshot.status_document.drift.detected, false);
  assert.match(snapshot.status_document.drift.summary, /matches the runtime deployment/);
});

test('buildStatusSnapshot leaves STATUS.md deploy identity untouched when runtime metadata is unavailable', () => {
  const snapshot = buildStatusSnapshot({
    statusSource: baselineStatusSource,
    runtimeOverrides: {
      git_commit_ref: null,
      git_commit_sha: null,
      production_url: 'https://aithreatbrief.com',
    },
  });

  assert.equal(snapshot.status_document.pinned_baseline_ref, 'origin/main');
  assert.equal(snapshot.status_document.pinned_baseline_sha, 'b48d8326cc306dd791efb3ae3d42b962944e7b84');
  assert.equal(snapshot.status_document.site_status.latest_deploy, '`main` @ `b48d8326cc306dd791efb3ae3d42b962944e7b84` — READY');
  assert.equal(snapshot.status_document.drift.detected, false);
  assert.match(snapshot.status_document.drift.summary, /Runtime git metadata is unavailable/);
});
