import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const workflowDirectoryPath = path.join(repoRoot, '.github', 'workflows');

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function readWorkflowSource(fileName: string): string {
  const workflowPath = path.join(workflowDirectoryPath, fileName);

  assert.equal(existsSync(workflowPath), true, `Expected ${fileName} to exist.`);

  return readFileSync(workflowPath, 'utf8');
}

const modelDrivenWorkflows = [
  {
    name: 'Weekly Harvest',
    fileName: 'weekly-harvest.yml',
    executionStep: 'Run weekly harvest automation',
    targetWeekday: 'monday',
    targetHour: '05',
  },
  {
    name: 'Article Factory',
    fileName: 'article-factory.yml',
    executionStep: 'Run article factory automation',
    targetWeekday: 'monday',
    targetHour: '09',
  },
  {
    name: 'Newsletter Compiler',
    fileName: 'newsletter-compiler.yml',
    executionStep: 'Run newsletter compiler automation',
    targetWeekday: 'monday',
    targetHour: '13',
  },
  {
    name: 'SEO Affiliate Optimiser',
    fileName: 'seo-affiliate.yml',
    executionStep: 'Run SEO and affiliate automation',
    targetWeekday: 'monday',
    targetHour: '15',
  },
];

for (const workflow of modelDrivenWorkflows) {
  test(`${workflow.fileName} wires the scheduled model workflow with dispatch controls and a schedule gate`, () => {
    const source = readWorkflowSource(workflow.fileName);

    assert.match(source, new RegExp(`^name: ${escapeRegExp(workflow.name)}$`, 'm'));
    assert.match(source, /workflow_dispatch:/);
    assert.match(source, /run_date:/);
    assert.match(source, /dry_run:/);
    assert.match(source, /force:/);
    assert.equal([...source.matchAll(/- cron:/g)].length, 2);
    assert.match(source, /permissions:\n  contents: write\n  pull-requests: write\n  models: read/m);
    assert.match(source, /name:\s+Evaluate Australia\/Sydney schedule gate/);
    assert.match(source, new RegExp(`TARGET_WEEKDAY: ${workflow.targetWeekday}`));
    assert.match(source, new RegExp(`TARGET_HOUR: '${workflow.targetHour}'`));
    assert.match(source, /TZ=Australia\/Sydney date \+%A/);
    assert.match(source, /name:\s+Checkout repository\n\s+if: steps\.gate\.outputs\.should_run == 'true'/);
    assert.match(source, /name:\s+Install dependencies\n\s+if: steps\.gate\.outputs\.should_run == 'true'/);
    assert.match(source, new RegExp(`name:\\s+${escapeRegExp(workflow.executionStep)}\\n\\s+if: steps\\.gate\\.outputs\\.should_run == 'true'`));
    assert.match(source, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
    assert.match(source, /GITHUB_MODELS_MODEL: \$\{\{ vars\.GITHUB_MODELS_MODEL \}\}/);
  });
}

test('performance-logger.yml wires Beehiiv-backed performance logging with schedule gating and manual dispatch support', () => {
  const source = readWorkflowSource('performance-logger.yml');

  assert.match(source, /^name: Performance Logger$/m);
  assert.match(source, /workflow_dispatch:/);
  assert.match(source, /run_date:/);
  assert.match(source, /dry_run:/);
  assert.match(source, /force:/);
  assert.equal([...source.matchAll(/- cron:/g)].length, 2);
  assert.match(source, /permissions:\n  contents: write\n  pull-requests: write/m);
  assert.doesNotMatch(source, /models: read/);
  assert.match(source, /TARGET_WEEKDAY: sunday/);
  assert.match(source, /TARGET_HOUR: '20'/);
  assert.match(source, /name:\s+Run performance logger automation/);
  assert.match(source, /BEEHIIV_API_KEY: \$\{\{ secrets\.BEEHIIV_API_KEY \}\}/);
  assert.match(source, /BEEHIIV_PUBLICATION_ID: \$\{\{ secrets\.BEEHIIV_PUBLICATION_ID \}\}/);
  assert.match(source, /GITHUB_TOKEN: \$\{\{ github\.token \}\}/);
});
