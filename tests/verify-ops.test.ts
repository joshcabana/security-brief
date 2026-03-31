import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const verifyOpsScript = path.join(process.cwd(), 'scripts', 'verify-ops.mjs');

function stripAnsi(text: string) {
  return text.replace(/\x1B\[[0-?]*[ -/]*[@-~]/g, '');
}

async function createWorkspace(files: Record<string, string>) {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), 'verify-ops-'));

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

function runVerifyOps(
  workspaceDir: string,
  options: {
    args?: string[];
    env?: Record<string, string | undefined>;
  } = {},
) {
  const result = spawnSync(process.execPath, [verifyOpsScript, ...(options.args ?? [])], {
    cwd: workspaceDir,
    env: {
      ...process.env,
      ...options.env,
    },
    encoding: 'utf8',
  });

  return {
    status: result.status,
    stdout: stripAnsi(result.stdout),
    stderr: stripAnsi(result.stderr),
  };
}

test('verify:ops --contract-only ignores .env.local and passes for the current contract', async () => {
  const workspace = await createWorkspace({
    '.env.example': [
      'BEEHIIV_API_KEY=your-beehiiv-api-key-here',
      'BEEHIIV_PUBLICATION_ID=your-publication-id-here',
      'NEXT_PUBLIC_SITE_URL=https://your-domain.com',
      'NEXT_PUBLIC_SITE_NAME=AI Security Brief',
      'UPSTASH_REDIS_REST_URL=https://example.upstash.io',
      'UPSTASH_REDIS_REST_TOKEN=test-upstash-token',
      '',
    ].join('\n'),
    '.env.local': 'SUPABASE_URL=https://stale.example.com\n',
  });

  try {
    const summaryPath = path.join(workspace.workspaceDir, 'summary.md');
    const result = runVerifyOps(workspace.workspaceDir, {
      args: ['--contract-only'],
      env: {
        GITHUB_STEP_SUMMARY: summaryPath,
      },
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Contract check passed\. No drift detected\./);
    assert.doesNotMatch(result.stdout, /SUPABASE_URL/);

    const summary = await readFile(summaryPath, 'utf8');
    assert.match(summary, /PASS: no env contract drift detected\./);
  } finally {
    await workspace.cleanup();
  }
});

test('verify:ops --contract-only reports contract drift without failing', async () => {
  const workspace = await createWorkspace({
    '.env.example': [
      'BEEHIIV_API_KEY=your-beehiiv-api-key-here',
      'BEEHIIV_PUBLICATION_ID=your-publication-id-here',
      'NEXT_PUBLIC_SITE_URL=https://your-domain.com',
      'UPSTASH_REDIS_REST_URL=https://example.upstash.io',
      'UPSTASH_REDIS_REST_TOKEN=test-upstash-token',
      'NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID=stale-public-id',
      'EXTRA_KEY=unexpected',
      '',
    ].join('\n'),
  });

  try {
    const summaryPath = path.join(workspace.workspaceDir, 'summary.md');
    const result = runVerifyOps(workspace.workspaceDir, {
      args: ['--contract-only'],
      env: {
        GITHUB_STEP_SUMMARY: summaryPath,
      },
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /MISSING IN \.env\.example\s+NEXT_PUBLIC_SITE_NAME/);
    assert.match(result.stdout, /BANNED IN \.env\.example\s+NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID/);
    assert.match(result.stdout, /UNEXPECTED EXTRA KEY\s+EXTRA_KEY/);

    const summary = await readFile(summaryPath, 'utf8');
    assert.match(summary, /missing required key `NEXT_PUBLIC_SITE_NAME`/);
    assert.match(summary, /banned key `NEXT_PUBLIC_BEEHIIV_PUBLICATION_ID` present/);
    assert.match(summary, /unexpected extra key `EXTRA_KEY`/);
  } finally {
    await workspace.cleanup();
  }
});

test('verify:ops --contract-only allows documented optional env keys', async () => {
  const workspace = await createWorkspace({
    '.env.example': [
      'BEEHIIV_API_KEY=your-beehiiv-api-key-here',
      'BEEHIIV_PUBLICATION_ID=your-publication-id-here',
      'BEEHIIV_WELCOME_AUTOMATION_ID=',
      'NEXT_PUBLIC_SITE_URL=https://your-domain.com',
      'NEXT_PUBLIC_SITE_NAME=AI Security Brief',
      'UPSTASH_REDIS_REST_URL=https://example.upstash.io',
      'UPSTASH_REDIS_REST_TOKEN=test-upstash-token',
      'AFFILIATE_NORDVPN=',
      'AFFILIATE_PUREVPN=',
      'AFFILIATE_PROTON=',
      'AFFILIATE_PROTON_VPN=',
      'AFFILIATE_PROTON_MAIL=',
      '',
    ].join('\n'),
  });

  try {
    const result = runVerifyOps(workspace.workspaceDir, {
      args: ['--contract-only'],
    });

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Contract check passed\. No drift detected\./);
    assert.doesNotMatch(result.stdout, /UNEXPECTED EXTRA KEY/);
  } finally {
    await workspace.cleanup();
  }
});

test('verify:ops exits 1 when required runtime vars are missing', async () => {
  const workspace = await createWorkspace({
    '.env.example': [
      'BEEHIIV_API_KEY=your-beehiiv-api-key-here',
      'BEEHIIV_PUBLICATION_ID=your-publication-id-here',
      'NEXT_PUBLIC_SITE_URL=https://your-domain.com',
      'NEXT_PUBLIC_SITE_NAME=AI Security Brief',
      'UPSTASH_REDIS_REST_URL=https://example.upstash.io',
      'UPSTASH_REDIS_REST_TOKEN=test-upstash-token',
      '',
    ].join('\n'),
  });

  try {
    const result = runVerifyOps(workspace.workspaceDir);

    assert.equal(result.status, 1);
    assert.match(result.stdout, /MISSING\s+BEEHIIV_API_KEY/);
    assert.match(result.stdout, /MISSING\s+BEEHIIV_PUBLICATION_ID/);
    assert.match(result.stdout, /MISSING\s+NEXT_PUBLIC_SITE_URL/);
    assert.match(result.stdout, /MISSING\s+NEXT_PUBLIC_SITE_NAME/);
    assert.match(result.stdout, /MISSING\s+UPSTASH_REDIS_REST_URL/);
    assert.match(result.stdout, /MISSING\s+UPSTASH_REDIS_REST_TOKEN/);
  } finally {
    await workspace.cleanup();
  }
});

test('verify:ops warns on banned runtime vars but stays ready when required vars are set', async () => {
  const workspace = await createWorkspace({
    '.env.example': [
      'BEEHIIV_API_KEY=your-beehiiv-api-key-here',
      'BEEHIIV_PUBLICATION_ID=your-publication-id-here',
      'NEXT_PUBLIC_SITE_URL=https://your-domain.com',
      'NEXT_PUBLIC_SITE_NAME=AI Security Brief',
      'UPSTASH_REDIS_REST_URL=https://example.upstash.io',
      'UPSTASH_REDIS_REST_TOKEN=test-upstash-token',
      '',
    ].join('\n'),
    '.env.local': [
      'BEEHIIV_API_KEY=test-beehiiv-key',
      'BEEHIIV_PUBLICATION_ID=pub_123456',
      'NEXT_PUBLIC_SITE_URL=https://ai-security-brief.vercel.app',
      'NEXT_PUBLIC_SITE_NAME=The AI Security Brief',
      'UPSTASH_REDIS_REST_URL=https://example.upstash.io',
      'UPSTASH_REDIS_REST_TOKEN=test-upstash-token',
      'SUPABASE_URL=https://stale.example.com',
      '',
    ].join('\n'),
  });

  try {
    const result = runVerifyOps(workspace.workspaceDir);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /FOUND\s+SUPABASE_URL/);
    assert.match(result.stdout, /All checks passed|warning\(s\) — review before deploying/);
    assert.doesNotMatch(result.stdout, /MISSING\s+BEEHIIV_API_KEY/);
  } finally {
    await workspace.cleanup();
  }
});
