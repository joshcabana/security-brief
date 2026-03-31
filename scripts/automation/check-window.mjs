#!/usr/bin/env node

import { appendStepSummary, parseCliOptions, shouldRunInScheduledWindow } from './common.mjs';

function getArgValue(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);
  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }
  return process.argv[index + 1];
}

async function main() {
  const weekday = getArgValue('weekday');
  const hour = getArgValue('hour');
  const graceHoursValue = getArgValue('grace-hours');
  const graceHours = graceHoursValue === null ? 0 : Number(graceHoursValue);

  if (!weekday || !hour) {
    throw new Error('check-window requires --weekday and --hour. Optional: --grace-hours N.');
  }

  if (!Number.isInteger(graceHours) || graceHours < 0) {
    throw new Error('--grace-hours must be a non-negative integer.');
  }

  const options = parseCliOptions();
  const result = shouldRunInScheduledWindow({
    targetWeekday: weekday.toLowerCase(),
    targetHour: Number(hour),
    graceHours,
    options,
  });

  if (process.env.GITHUB_OUTPUT) {
    await appendStepSummary([
      '### Schedule gate',
      `- Should run: ${result.shouldRun}`,
      `- Reason: ${result.reason}`,
    ]);
    await import('node:fs/promises').then(({ writeFile }) =>
      writeFile(process.env.GITHUB_OUTPUT, `should_run=${result.shouldRun}\n`, { flag: 'a' }),
    );
  }

  if (!result.shouldRun) {
    console.log(`Skipping run: ${result.reason}`);
    return;
  }

  console.log(`Schedule gate passed: ${result.reason}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
