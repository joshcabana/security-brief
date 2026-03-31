#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import { pathToFileURL } from 'node:url';
import {
  TIME_ZONE,
  buildAutomationIdentity,
  getLocalTimeParts,
  shiftDateString,
} from './automation/common.mjs';

const execFile = promisify(execFileCallback);

const DEFAULT_REPO = process.env.GITHUB_REPOSITORY?.trim() || 'joshcabana/ai-security-brief';

export const REQUIRED_WORKFLOWS = [
  {
    name: 'Weekly Harvest',
    fileName: 'weekly-harvest.yml',
    executionStep: 'Run weekly harvest automation',
    expectedHour: 5,
  },
  {
    name: 'Article Factory',
    fileName: 'article-factory.yml',
    executionStep: 'Run article factory automation',
    expectedHour: 9,
  },
  {
    name: 'Newsletter Compiler',
    fileName: 'newsletter-compiler.yml',
    executionStep: 'Run newsletter compiler automation',
    expectedHour: 13,
  },
  {
    name: 'SEO Affiliate Optimiser',
    fileName: 'seo-affiliate.yml',
    executionStep: 'Run SEO and affiliate automation',
    expectedHour: 15,
  },
  {
    name: 'Performance Logger',
    fileName: 'performance-logger.yml',
    executionStep: 'Run performance logger automation',
    expectedHour: 20,
    dateOffset: -1,
  },
];

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

export function parseCliOptions(argv = process.argv.slice(2)) {
  const options = {
    date: getLocalTimeParts(new Date(), TIME_ZONE).date,
    repo: DEFAULT_REPO,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--') {
      continue;
    }

    if (value === '--date' && argv[index + 1]) {
      options.date = argv[index + 1];
      index += 1;
      continue;
    }

    if (value === '--repo' && argv[index + 1]) {
      options.repo = argv[index + 1];
      index += 1;
      continue;
    }

    throw new Error('Usage: node scripts/check-monday-pipeline.mjs [--date YYYY-MM-DD] [--repo owner/repo]');
  }

  assert(/^\d{4}-\d{2}-\d{2}$/.test(options.date), '--date must be in YYYY-MM-DD format.');
  assert(options.repo.includes('/'), '--repo must be in owner/repo format.');

  return options;
}

export function getExpectedBranches(targetDate) {
  return {
    content: buildAutomationIdentity('content', targetDate),
    performance: buildAutomationIdentity('performance', shiftDateString(targetDate, -1)),
  };
}

export function getRunLocalDate(createdAt) {
  return getLocalTimeParts(new Date(createdAt), TIME_ZONE).date;
}

export function sortRunsNewestFirst(runs) {
  return [...runs].sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime());
}

export function findExecutionStep(run, stepName) {
  for (const job of run?.jobs ?? []) {
    for (const step of job?.steps ?? []) {
      if (step?.name === stepName) {
        return {
          jobName: job.name,
          ...step,
        };
      }
    }
  }

  return null;
}

export function findFirstFailingStep(run) {
  for (const job of run?.jobs ?? []) {
    for (const step of job?.steps ?? []) {
      if (step?.conclusion && !['success', 'skipped'].includes(step.conclusion)) {
        return {
          jobName: job.name,
          stepName: step.name,
          conclusion: step.conclusion,
        };
      }
    }
  }

  for (const job of run?.jobs ?? []) {
    if (job?.conclusion && !['success', 'skipped'].includes(job.conclusion)) {
      return {
        jobName: job.name,
        stepName: 'UNKNOWN STEP',
        conclusion: job.conclusion,
      };
    }
  }

  return null;
}

export function extractLogExcerpt(logText, maxLines = 12) {
  return String(logText)
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .slice(0, maxLines);
}

export function evaluatePipelineState({ targetDate, pullRequests, workflowRuns }) {
  const expected = getExpectedBranches(targetDate);
  const prChecks = [
    {
      label: 'content',
      branchName: expected.content.branchName,
      pullRequest: pullRequests.find((pullRequest) => pullRequest.headRefName === expected.content.branchName) ?? null,
    },
    {
      label: 'performance',
      branchName: expected.performance.branchName,
      pullRequest: pullRequests.find((pullRequest) => pullRequest.headRefName === expected.performance.branchName) ?? null,
    },
  ].map((check) => {
    if (!check.pullRequest) {
      return {
        ...check,
        ok: false,
        message: `Missing open PR for \`${check.branchName}\`.`,
      };
    }

    const draftLabel = check.pullRequest.isDraft ? 'draft' : 'ready for review';
    return {
      ...check,
      ok: true,
      message: `PR #${check.pullRequest.number} is open (${draftLabel}).`,
    };
  });

  const workflowChecks = REQUIRED_WORKFLOWS.map((workflow) => {
    const run = workflowRuns[workflow.name] ?? null;
    const workflowDate = shiftDateString(targetDate, workflow.dateOffset ?? 0);

    if (!run) {
      return {
        workflowName: workflow.name,
        ok: false,
        message: `Missing ${workflow.name} run for ${workflowDate}.`,
        run: null,
      };
    }

    const executionStep = findExecutionStep(run, workflow.executionStep);
    const executed = executionStep ? executionStep.conclusion !== 'skipped' : true;
    const ok = run.status === 'completed' && run.conclusion === 'success' && executed;

    if (ok) {
      return {
        workflowName: workflow.name,
        ok: true,
        message: `${workflow.name} succeeded.`,
        run,
      };
    }

    if (!executed) {
      return {
        workflowName: workflow.name,
        ok: false,
        message: `${workflow.name} only produced gate-skipped runs for ${workflowDate}.`,
        run,
      };
    }

    const failingStep = findFirstFailingStep(run);
    return {
      workflowName: workflow.name,
      ok: false,
      message: `${workflow.name} ${run.status}/${run.conclusion}.`,
      failingStep,
      logExcerpt: Array.isArray(run.logExcerpt) ? run.logExcerpt : [],
      run,
    };
  });

  return {
    expected,
    prChecks,
    workflowChecks,
    ok: prChecks.every((check) => check.ok) && workflowChecks.every((check) => check.ok),
  };
}

function rankWorkflowRun(run, workflow) {
  const localTime = getLocalTimeParts(new Date(run.createdAt), TIME_ZONE);
  return {
    eventPriority:
      run.event === 'schedule'
        ? 0
        : run.event === 'workflow_dispatch'
          ? 1
          : 2,
    distanceFromSchedule: Math.abs(localTime.hour - workflow.expectedHour),
    timestamp: new Date(run.createdAt).getTime(),
  };
}

async function runGh(repo, args, options = {}) {
  const { allowFailure = false } = options;

  try {
    return await execFile('gh', [...args, '--repo', repo], {
      maxBuffer: 20 * 1024 * 1024,
    });
  } catch (error) {
    if (allowFailure) {
      return {
        stdout: error.stdout ?? '',
        stderr: error.stderr ?? '',
        code: error.code ?? 1,
      };
    }

    const stderr = error.stderr ? `\n${error.stderr}` : '';
    throw new Error(`gh ${args.join(' ')} failed${stderr}`);
  }
}

async function runGhJson(repo, args) {
  const result = await runGh(repo, args);
  return JSON.parse(result.stdout);
}

async function runGhApiJson(repo, endpoint) {
  const result = await execFile('gh', ['api', `repos/${repo}/${endpoint}`], {
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(result.stdout);
}

async function loadPullRequests(repo) {
  return runGhJson(repo, [
    'pr',
    'list',
    '--state',
    'open',
    '--limit',
    '50',
    '--json',
    'headRefName,isDraft,number,title,url',
  ]);
}

async function loadWorkflowRunList(repo, workflow, targetDate) {
  const utcSearchStart = shiftDateString(targetDate, -1);
  const payload = await runGhApiJson(
    repo,
    `actions/workflows/${workflow.fileName}/runs?per_page=30&created=${utcSearchStart}..${targetDate}`,
  );

  return (payload.workflow_runs ?? []).map((run) => ({
    conclusion: run.conclusion,
    createdAt: run.created_at,
    databaseId: run.id,
    displayTitle: run.display_title,
    event: run.event,
    headBranch: run.head_branch,
    status: run.status,
    url: run.html_url,
    workflowName: run.name,
  }));
}

async function loadRunDetail(repo, runId) {
  const [run, jobsPayload] = await Promise.all([
    runGhApiJson(repo, `actions/runs/${runId}`),
    runGhApiJson(repo, `actions/runs/${runId}/jobs?per_page=100`),
  ]);

  return {
    conclusion: run.conclusion,
    createdAt: run.created_at,
    databaseId: run.id,
    displayTitle: run.display_title,
    event: run.event,
    headBranch: run.head_branch,
    jobs: (jobsPayload.jobs ?? []).map((job) => ({
      completedAt: job.completed_at,
      conclusion: job.conclusion,
      databaseId: job.id,
      name: job.name,
      startedAt: job.started_at,
      status: job.status,
      steps: (job.steps ?? []).map((step) => ({
        completedAt: step.completed_at,
        conclusion: step.conclusion,
        name: step.name,
        number: step.number,
        startedAt: step.started_at,
        status: step.status,
      })),
      url: job.html_url,
    })),
    status: run.status,
    url: run.html_url,
    workflowName: run.name,
  };
}

async function loadFailureExcerpt(repo, runId) {
  const failedLogs = await runGh(repo, ['run', 'view', String(runId), '--log-failed'], {
    allowFailure: true,
  });
  const source = failedLogs.stdout.trim().length > 0 ? failedLogs.stdout : failedLogs.stderr;

  if (source.trim().length > 0) {
    return extractLogExcerpt(source);
  }

  const fullLogs = await runGh(repo, ['run', 'view', String(runId), '--log'], {
    allowFailure: true,
  });
  return extractLogExcerpt(fullLogs.stdout || fullLogs.stderr);
}

async function selectWorkflowRun(repo, workflow, targetDate, listedRuns) {
  const workflowDate = shiftDateString(targetDate, workflow.dateOffset ?? 0);
  const candidates = [...listedRuns]
    .filter((run) => run.workflowName === workflow.name && getRunLocalDate(run.createdAt) === workflowDate)
    .sort((left, right) => {
      const leftRank = rankWorkflowRun(left, workflow);
      const rightRank = rankWorkflowRun(right, workflow);

      if (leftRank.eventPriority !== rightRank.eventPriority) {
        return leftRank.eventPriority - rightRank.eventPriority;
      }

      if (leftRank.distanceFromSchedule !== rightRank.distanceFromSchedule) {
        return leftRank.distanceFromSchedule - rightRank.distanceFromSchedule;
      }

      return rightRank.timestamp - leftRank.timestamp;
    })
    .slice(0, 6);

  if (candidates.length === 0) {
    return null;
  }

  let fallback = null;

  for (const candidate of candidates) {
    const detail = await loadRunDetail(repo, candidate.databaseId);
    const executionStep = findExecutionStep(detail, workflow.executionStep);

    if (!fallback) {
      fallback = detail;
    }

    if (!executionStep || executionStep.conclusion !== 'skipped') {
      if (detail.status !== 'completed' || detail.conclusion !== 'success') {
        detail.logExcerpt = await loadFailureExcerpt(repo, detail.databaseId);
      }
      return detail;
    }
  }

  return fallback;
}

function printCheckResult(result) {
  console.log('Monday Pipeline Check');
  console.log(`  repo: ${result.repo}`);
  console.log(`  date (${TIME_ZONE}): ${result.targetDate}`);
  console.log(`  expected content branch: ${result.evaluation.expected.content.branchName}`);
  console.log(`  expected performance branch: ${result.evaluation.expected.performance.branchName}`);

  console.log('\nPull requests');
  for (const check of result.evaluation.prChecks) {
    console.log(`  ${check.ok ? '✓' : '✗'} ${check.branchName} — ${check.message}`);
    if (check.pullRequest) {
      console.log(`    ${check.pullRequest.url}`);
    }
  }

  console.log('\nWorkflows');
  for (const check of result.evaluation.workflowChecks) {
    console.log(`  ${check.ok ? '✓' : '✗'} ${check.workflowName} — ${check.message}`);
    if (check.run?.url) {
      console.log(`    ${check.run.url}`);
    }
    if (check.failingStep) {
      console.log(`    first failing step: ${check.failingStep.jobName} / ${check.failingStep.stepName}`);
    }
    if (check.logExcerpt?.length) {
      console.log('    log excerpt:');
      for (const line of check.logExcerpt) {
        console.log(`      ${line}`);
      }
    }
  }

  console.log(`\nSummary: ${result.evaluation.ok ? 'ready for review' : 'action required'}`);
}

async function main() {
  const options = parseCliOptions();
  const pullRequests = await loadPullRequests(options.repo);
  const workflowRuns = {};

  for (const workflow of REQUIRED_WORKFLOWS) {
    const listedRuns = await loadWorkflowRunList(options.repo, workflow, options.date);
    workflowRuns[workflow.name] = await selectWorkflowRun(options.repo, workflow, options.date, listedRuns);
  }

  const evaluation = evaluatePipelineState({
    targetDate: options.date,
    pullRequests,
    workflowRuns,
  });

  printCheckResult({
    repo: options.repo,
    targetDate: options.date,
    evaluation,
  });

  process.exit(evaluation.ok ? 0 : 1);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
