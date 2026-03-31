#!/usr/bin/env node

import {
  appendStepSummary,
  buildAutomationIdentity,
  checkoutAutomationBranch,
  commitAndPushChanges,
  ensureCleanWorktree,
  parseCliOptions,
  remoteBranchExists,
  resolveEffectiveDate,
  shouldRunInScheduledWindow,
} from './common.mjs';
import { buildPullRequestBody, ensureDraftPullRequest, summarisePullRequest } from './github.mjs';

export function requireEnvVars(keys) {
  for (const key of keys) {
    if (!process.env[key]?.trim()) {
      throw new Error(`${key} is required for this automation job.`);
    }
  }
}

export async function prepareAutomationRun({ kind, schedule }) {
  const options = parseCliOptions();
  const gate = shouldRunInScheduledWindow({
    targetWeekday: schedule.weekday,
    targetHour: schedule.hour,
    graceHours: schedule.graceHours ?? 0,
    options,
  });

  if (!gate.shouldRun) {
    await appendStepSummary([
      `### ${kind} automation`,
      `- Skipped: ${gate.reason}`,
    ]);
    return {
      skipped: true,
      options,
      gate,
    };
  }

  const effectiveDate = resolveEffectiveDate(options);
  const identity = buildAutomationIdentity(kind, effectiveDate);

  await ensureCleanWorktree();
  await checkoutAutomationBranch(identity.branchName);

  return {
    skipped: false,
    options,
    gate,
    effectiveDate,
    identity,
  };
}

export async function finishAutomationRun({
  context,
  commitMessage,
  model,
  outputs,
  notes = [],
}) {
  const changed = await commitAndPushChanges({
    branchName: context.identity.branchName,
    commitMessage,
    dryRun: context.options.dryRun,
  });

  let pullRequest = null;
  const branchExists = context.options.dryRun ? false : await remoteBranchExists(context.identity.branchName);

  if (!context.options.dryRun && branchExists) {
    pullRequest = await ensureDraftPullRequest({
      branchName: context.identity.branchName,
      title: context.identity.pullRequestTitle,
      body: buildPullRequestBody({
        kind: context.identity.branchName.includes('performance') ? 'performance' : 'content',
        weekKey: context.identity.weekKey,
        effectiveDate: context.effectiveDate,
        branchName: context.identity.branchName,
        model,
        outputs,
        notes,
      }),
    });
  }

  await appendStepSummary([
    `### ${context.identity.pullRequestTitle}`,
    `- Effective date: \`${context.effectiveDate}\``,
    `- Branch: \`${context.identity.branchName}\``,
    `- Changed files committed: ${changed ? 'yes' : 'no'}`,
    ...outputs.map((output) => `- ${output}`),
    ...notes.map((note) => `- ${note}`),
  ]);

  await summarisePullRequest(pullRequest, context.identity.branchName);
}
