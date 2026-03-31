import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const verifyContentIntegrityScript = path.join(process.cwd(), 'scripts', 'verify-content-integrity.mjs');

async function createWorkspace(files: Record<string, string>) {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), 'verify-content-integrity-'));

  for (const [relativePath, source] of Object.entries(files)) {
    const filePath = path.join(workspaceDir, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, source, 'utf8');
  }

  return {
    workspaceDir,
    async cleanup() {
      await rm(workspaceDir, { recursive: true, force: true });
    },
  };
}

function runVerifyContentIntegrity(workspaceDir: string) {
  const result = spawnSync(process.execPath, [verifyContentIntegrityScript], {
    cwd: workspaceDir,
    encoding: 'utf8',
  });

  return {
    status: result.status,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

function buildWorkspaceFiles(overrides: Partial<Record<string, string>> = {}) {
  return {
    'content-manifest.json': JSON.stringify(
      {
        articleCount: 2,
        categories: ['AI Threats'],
        articles: [
          { slug: 'existing-article' },
          { slug: 'second-article' },
        ],
      },
      null,
      2,
    ),
    'drafts/newsletter-2026-03-16.md': [
      '# Newsletter Issue #2 — AI Security Brief',
      '',
      '**[Read the full analysis → Existing Article](/blog/existing-article)**',
      '',
    ].join('\n'),
    'drafts/newsletter-2026-03-17.md': [
      '# Newsletter Issue #3 — AI Security Brief',
      '',
      '**[Read the full analysis → Second Article](/blog/second-article)**',
      '',
    ].join('\n'),
    'ops/affiliate-status.md': [
      '| Programme | Status | Notes |',
      '| --- | --- | --- |',
      '| NordVPN | **Live in production** | note |',
      '| PureVPN | **Live in production** | note |',
      '| Proton | **Live in production** | note |',
      '',
    ].join('\n'),
    'ops/affiliate-intake.md': [
      '- NordVPN: **Live in production** — note',
      '- PureVPN: **Live in production** — note',
      '- Proton: **Live in production** — note',
      '',
    ].join('\n'),
    ...overrides,
  };
}

test('verify-content-integrity passes for valid drafts and aligned live affiliate docs', async () => {
  const workspace = await createWorkspace(buildWorkspaceFiles());

  try {
    const result = runVerifyContentIntegrity(workspace.workspaceDir);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Content integrity checks passed\./);
  } finally {
    await workspace.cleanup();
  }
});

test('verify-content-integrity fails on duplicate newsletter issue numbers', async () => {
  const workspace = await createWorkspace(
    buildWorkspaceFiles({
      'drafts/newsletter-2026-03-17.md': [
        '# Newsletter Issue #2 — AI Security Brief',
        '',
        '**[Read the full analysis → Second Article](/blog/second-article)**',
        '',
      ].join('\n'),
    }),
  );

  try {
    const result = runVerifyContentIntegrity(workspace.workspaceDir);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Duplicate newsletter issue numbers detected/);
    assert.match(result.stderr, /Issue #2/);
  } finally {
    await workspace.cleanup();
  }
});

test('verify-content-integrity fails on newsletter links to missing article slugs', async () => {
  const workspace = await createWorkspace(
    buildWorkspaceFiles({
      'drafts/newsletter-2026-03-17.md': [
        '# Newsletter Issue #3 — AI Security Brief',
        '',
        '**[Read the full analysis → Missing Article](/blog/missing-article)**',
        '',
      ].join('\n'),
    }),
  );

  try {
    const result = runVerifyContentIntegrity(workspace.workspaceDir);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Newsletter drafts reference missing article slugs/);
    assert.match(result.stderr, /missing-article/);
  } finally {
    await workspace.cleanup();
  }
});

test('verify-content-integrity fails when live affiliate programmes drift between ops docs', async () => {
  const workspace = await createWorkspace(
    buildWorkspaceFiles({
      'ops/affiliate-intake.md': [
        '- NordVPN: **Live in production** — note',
        '- PureVPN: **Live in production** — note',
        '',
      ].join('\n'),
    }),
  );

  try {
    const result = runVerifyContentIntegrity(workspace.workspaceDir);

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Affiliate live-status drift detected/);
    assert.match(result.stderr, /proton/);
  } finally {
    await workspace.cleanup();
  }
});
