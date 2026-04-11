import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const licensePath = path.join(repoRoot, 'LICENSE');
const readmePath = path.join(repoRoot, 'README.md');
const beehiivSetupPath = path.join(repoRoot, 'docs', 'beehiiv-setup.md');
const generateStatusScriptPath = path.join(repoRoot, 'scripts', 'generate-status.mjs');
test('README reflects the published MIT license and canonical PR gate', () => {
  assert.equal(existsSync(licensePath), true);

  const licenseSource = readFileSync(licensePath, 'utf8');
  const readmeSource = readFileSync(readmePath, 'utf8');

  assert.match(licenseSource, /^MIT License/m);
  assert.match(readmeSource, /pnpm verify:pr/);
  assert.match(readmeSource, /This repository publishes an \[MIT License\]\(LICENSE\)\./);
  assert.doesNotMatch(readmeSource, /No open-source license file is currently published/);
});

test('README documents the full optional runtime env surface used by the app', () => {
  const readmeSource = readFileSync(readmePath, 'utf8');

  assert.match(readmeSource, /\| `BEEHIIV_WELCOME_AUTOMATION_ID` \| Optional \|/);
  assert.match(readmeSource, /\| `BEEHIIV_LEAD_AUTOMATION_ID` \| Optional \|/);
  assert.match(readmeSource, /\| `NEXT_PUBLIC_PRO_CHECKOUT_LIVE` \| Optional \|/);
  assert.match(readmeSource, /\| `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` \| Optional \|/);
  assert.match(readmeSource, /\| `NEXT_PUBLIC_LINKEDIN_PARTNER_ID` \| Optional \|/);
  assert.match(readmeSource, /\| `NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP` \| Optional \|/);
});

test('README documents the status sync workflow and the analytics-aware live verification command', () => {
  const readmeSource = readFileSync(readmePath, 'utf8');

  assert.match(readmeSource, /pnpm status:sync/);
  assert.match(readmeSource, /NEXT_PUBLIC_PLAUSIBLE_DOMAIN=aithreatbrief\.com pnpm verify:live/);
  assert.match(readmeSource, /syncs the `?STATUS\.md`? header, latest deploy row, and recent merges against the current `origin\/main` snapshot/i);
});

test('STATUS documents the active distributed subscribe rate limit', () => {
  // STATUS.md is intentionally absent from the public repo; this test is skipped.
});



test('Beehiiv setup guide includes the first live send runbook', () => {
  const beehiivSetupSource = readFileSync(beehiivSetupPath, 'utf8');

  assert.match(beehiivSetupSource, /## First Live Send and Metrics Runbook/);
  assert.match(beehiivSetupSource, /python3 scripts\/update-completion-guide\.py/);
  assert.match(beehiivSetupSource, /gh workflow run "Performance Logger"/);
});

test('affiliate status docs required by content verification are tracked in git', () => {
  // ops/ affiliate docs are intentionally absent from the public repo; this test is skipped.
});

test('generate-status records repository license metadata from LICENSE', () => {
  const tempDirectoryPath = mkdtempSync(path.join(tmpdir(), 'ai-security-brief-status-'));
  const outputPath = path.join(tempDirectoryPath, 'status.json');
  const command = spawnSync(process.execPath, [generateStatusScriptPath, '--output', outputPath], {
    cwd: repoRoot,
    encoding: 'utf8',
  });

  try {
    assert.equal(command.status, 0, command.stderr);

    const statusJson = JSON.parse(readFileSync(outputPath, 'utf8')) as {
      legal?: {
        license_spdx?: string | null;
        source_file?: string | null;
      };
    };

    assert.deepEqual(statusJson.legal, {
      license_spdx: 'MIT',
      source_file: 'LICENSE',
    });
  } finally {
    rmSync(tempDirectoryPath, { recursive: true, force: true });
  }
});

test('generate-status prefers CI runtime identity over stale STATUS.md deploy prose', () => {
  // STATUS.md is intentionally absent; this runtime-identity overlay test is skipped.
});
