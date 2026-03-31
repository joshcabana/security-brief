import assert from 'node:assert/strict';
import test from 'node:test';
import {
  evaluatePipelineState,
  getExpectedBranches,
  getRunLocalDate,
} from '../scripts/check-monday-pipeline.mjs';

test('expected Monday pipeline branches follow the content-plus-prior-Sunday performance model', () => {
  const expected = getExpectedBranches('2026-03-23');

  assert.equal(expected.content.branchName, 'codex/content-week-2026-13');
  assert.equal(expected.performance.branchName, 'codex/performance-week-2026-12');
});

test('run dates are resolved in Australia/Sydney local time', () => {
  assert.equal(getRunLocalDate('2026-03-22T22:05:00Z'), '2026-03-23');
  assert.equal(getRunLocalDate('2026-06-14T10:05:00Z'), '2026-06-14');
});

test('pipeline evaluation passes when both PRs exist and all workflows succeed', () => {
  const successRun = (workflowName: string, stepName: string) => ({
    workflowName,
    status: 'completed',
    conclusion: 'success',
    url: `https://example.com/${workflowName}`,
    jobs: [
      {
        name: workflowName,
        conclusion: 'success',
        steps: [
          {
            name: stepName,
            conclusion: 'success',
          },
        ],
      },
    ],
  });

  const evaluation = evaluatePipelineState({
    targetDate: '2026-03-23',
    pullRequests: [
      {
        number: 31,
        headRefName: 'codex/content-week-2026-13',
        isDraft: true,
        url: 'https://example.com/pr/31',
      },
      {
        number: 32,
        headRefName: 'codex/performance-week-2026-12',
        isDraft: true,
        url: 'https://example.com/pr/32',
      },
    ],
    workflowRuns: {
      'Weekly Harvest': successRun('Weekly Harvest', 'Run weekly harvest automation'),
      'Article Factory': successRun('Article Factory', 'Run article factory automation'),
      'Newsletter Compiler': successRun('Newsletter Compiler', 'Run newsletter compiler automation'),
      'SEO Affiliate Optimiser': successRun('SEO Affiliate Optimiser', 'Run SEO and affiliate automation'),
      'Performance Logger': successRun('Performance Logger', 'Run performance logger automation'),
    },
  });

  assert.equal(evaluation.ok, true);
  assert.equal(evaluation.prChecks.every((check) => check.ok), true);
  assert.equal(evaluation.workflowChecks.every((check) => check.ok), true);
});

test('pipeline evaluation reports missing PRs and gate-skipped runs', () => {
  const evaluation = evaluatePipelineState({
    targetDate: '2026-03-23',
    pullRequests: [
      {
        number: 31,
        headRefName: 'codex/content-week-2026-13',
        isDraft: true,
        url: 'https://example.com/pr/31',
      },
    ],
    workflowRuns: {
      'Weekly Harvest': {
        workflowName: 'Weekly Harvest',
        status: 'completed',
        conclusion: 'success',
        url: 'https://example.com/run/harvest',
        jobs: [
          {
            name: 'weekly_harvest',
            conclusion: 'success',
            steps: [
              {
                name: 'Run weekly harvest automation',
                conclusion: 'skipped',
              },
            ],
          },
        ],
      },
    },
  });

  assert.equal(evaluation.ok, false);
  assert.match(evaluation.prChecks[1].message, /Missing open PR/);
  assert.match(evaluation.workflowChecks[0].message, /gate-skipped/);
  assert.match(evaluation.workflowChecks[1].message, /Missing Article Factory run/);
});
