import assert from 'node:assert/strict';
import test from 'node:test';
import { GET } from '../app/status.json/route';

test('status.json route returns the public status snapshot with no-store caching', async () => {
  const originalCommitRef = process.env.VERCEL_GIT_COMMIT_REF;
  const originalCommitSha = process.env.VERCEL_GIT_COMMIT_SHA;
  const originalProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;

  process.env.VERCEL_GIT_COMMIT_REF = 'main';
  process.env.VERCEL_GIT_COMMIT_SHA = '1234567890abcdef1234567890abcdef12345678';
  process.env.VERCEL_PROJECT_PRODUCTION_URL = 'aithreatbrief.com';

  const response = await GET();
  const payload = (await response.json()) as {
    status_document: {
      pinned_baseline_ref: string;
      pinned_baseline_sha: string;
      verification_pipeline: string;
      site_status: {
        live_url: string;
        latest_deploy: string;
      };
      drift: {
        detected: boolean;
        runtime_git_commit_ref: string | null;
        runtime_git_commit_sha: string | null;
      };
    };
    runtime: {
      production_url: string;
      git_commit_ref: string | null;
      git_commit_sha: string | null;
    };
  };

  try {
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    assert.equal(payload.status_document.pinned_baseline_ref, 'origin/main');
    assert.equal(payload.status_document.pinned_baseline_sha, '1234567890abcdef1234567890abcdef12345678');
    assert.equal(
      payload.status_document.site_status.latest_deploy,
      '`main` @ `1234567890abcdef1234567890abcdef12345678` — runtime reported active deployment',
    );
    assert.match(payload.status_document.verification_pipeline, /Runtime currently reports active deploy `main` @ `1234567890abcdef1234567890abcdef12345678`/);
    assert.equal(payload.status_document.site_status.live_url, 'https://aithreatbrief.com');
    assert.equal(payload.status_document.drift.detected, true);
    assert.equal(payload.status_document.drift.runtime_git_commit_ref, 'main');
    assert.equal(payload.status_document.drift.runtime_git_commit_sha, '1234567890abcdef1234567890abcdef12345678');
    assert.equal(payload.runtime.production_url, 'https://aithreatbrief.com');
    assert.equal(payload.runtime.git_commit_ref, 'main');
    assert.equal(payload.runtime.git_commit_sha, '1234567890abcdef1234567890abcdef12345678');
  } finally {
    if (originalCommitRef === undefined) {
      delete process.env.VERCEL_GIT_COMMIT_REF;
    } else {
      process.env.VERCEL_GIT_COMMIT_REF = originalCommitRef;
    }

    if (originalCommitSha === undefined) {
      delete process.env.VERCEL_GIT_COMMIT_SHA;
    } else {
      process.env.VERCEL_GIT_COMMIT_SHA = originalCommitSha;
    }

    if (originalProductionUrl === undefined) {
      delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    } else {
      process.env.VERCEL_PROJECT_PRODUCTION_URL = originalProductionUrl;
    }
  }
});
