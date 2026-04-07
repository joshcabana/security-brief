#!/usr/bin/env node

import {
  POLICY_PATH,
  MEMORY_PATH,
  PROFILE_OUTPUT_SCHEMA,
  TRIAGE_OUTPUT_SCHEMA,
  buildDefaultMemory,
  buildDefaultPolicy,
  buildFailureResult,
  buildProfilePrompt,
  buildTriagePrompt,
  classifyFailure,
  ensureJsonFile,
  getRunStamp,
  loadProjectContext,
  mergeMemory,
  runCodexJson,
  validateTriageResult,
  writeRunArtifacts,
} from './inbox-triage.mjs';
import { parseCliOptions } from './common.mjs';

function extractPreflightFailure(preflightResult) {
  if (!preflightResult.json || preflightResult.code !== 0) {
    return classifyFailure(preflightResult.stderr, 'preflight');
  }

  if (preflightResult.json.ok !== true || !preflightResult.json.email) {
    return classifyFailure(preflightResult.stderr, 'preflight');
  }

  return null;
}

async function main() {
  const options = parseCliOptions();
  const runStamp = getRunStamp();

  const [policy, memory, context] = await Promise.all([
    ensureJsonFile(POLICY_PATH, buildDefaultPolicy()),
    ensureJsonFile(MEMORY_PATH, buildDefaultMemory()),
    loadProjectContext(),
  ]);

  const preflight = await runCodexJson({
    prompt: buildProfilePrompt({
      connectorId: policy.connector_id ?? 'connector_2128aebfecb84f64a069897515042a44',
      mailboxEmail: policy.mailbox_email,
    }),
    schema: PROFILE_OUTPUT_SCHEMA,
  });

  const preflightFailure = extractPreflightFailure(preflight);

  if (preflightFailure) {
    const failureResult = buildFailureResult({
      runStamp,
      mailbox: policy.mailbox_email,
      failure: preflightFailure,
      preflight: preflight.json,
      notes: [
        'No Gmail scan was performed because the scheduled Codex CLI process could not verify mailbox access.',
      ],
    });
    const nextMemory = mergeMemory(memory, failureResult, runStamp);
    const reportPaths = await writeRunArtifacts({
      runStamp,
      result: failureResult,
      memory: nextMemory,
    });

    console.error(`Inbox triage preflight failed. Report written to ${reportPaths.markdownPath}`);
    process.exitCode = 1;
    return;
  }

  const triage = await runCodexJson({
    prompt: buildTriagePrompt({
      connectorId: policy.connector_id ?? 'connector_2128aebfecb84f64a069897515042a44',
      policy,
      memory,
      context,
      dryRun: options.dryRun,
    }),
    schema: TRIAGE_OUTPUT_SCHEMA,
    timeoutMs: 300000,
  });

  let result;

  if (!triage.json || triage.code !== 0) {
    result = buildFailureResult({
      runStamp,
      mailbox: policy.mailbox_email,
      failure: classifyFailure(triage.stderr, 'triage'),
      preflight: preflight.json,
      notes: [
        options.dryRun ? 'Dry run mode was enabled.' : 'Draft creation was enabled for reply-worthy threads.',
      ],
    });
  } else {
    validateTriageResult(triage.json);
    result = {
      ...triage.json,
      run_at: runStamp.display,
      mailbox: triage.json.mailbox || policy.mailbox_email,
      notes: [
        ...(triage.json.notes ?? []),
        `Mailbox preflight succeeded for ${preflight.json.email}.`,
        options.dryRun ? 'Dry run mode was enabled; no Gmail drafts should have been created.' : 'Draft-only mode is active; auto-send is disabled.',
      ],
    };
  }

  const nextMemory = mergeMemory(memory, result, runStamp);
  const reportPaths = await writeRunArtifacts({
    runStamp,
    result,
    memory: nextMemory,
  });

  console.log(JSON.stringify({
    success: result.success,
    mailbox: result.mailbox,
    markdown_report: reportPaths.markdownPath,
    json_report: reportPaths.jsonPath,
  }));

  if (!result.success) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
});
