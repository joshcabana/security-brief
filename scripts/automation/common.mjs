#!/usr/bin/env node

import { execFile as execFileCallback } from 'node:child_process';
import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import { constants as fsConstants } from 'node:fs';
import path from 'node:path';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFile = promisify(execFileCallback);

export const TIME_ZONE = 'Australia/Sydney';
export const DEFAULT_GITHUB_MODELS_MODEL = 'openai/gpt-4o-mini';
export const GITHUB_MODELS_API_URL = 'https://models.github.ai/inference/chat/completions';
export const CONTENT_BRANCH_PREFIX = 'codex/content-week-';
export const PERFORMANCE_BRANCH_PREFIX = 'codex/performance-week-';
export const CONTENT_PR_PREFIX = 'Automation: content week ';
export const PERFORMANCE_PR_PREFIX = 'Automation: performance week ';
export const FINDING_CATEGORIES = ['Attack', 'Vulnerability', 'Regulation', 'Defence', 'Incident', 'Framework'];

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = path.resolve(SCRIPT_DIR, '..', '..');

const WEEKDAY_LOOKUP = {
  sun: 'sunday',
  mon: 'monday',
  tue: 'tuesday',
  wed: 'wednesday',
  thu: 'thursday',
  fri: 'friday',
  sat: 'saturday',
};

export function parseCliOptions(argv = process.argv.slice(2), env = process.env) {
  const options = {
    dryRun: false,
    force: false,
    skipScheduleGate: false,
    date: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];

    if (value === '--dry-run') {
      options.dryRun = true;
      continue;
    }

    if (value === '--force') {
      options.force = true;
      continue;
    }

    if (value === '--skip-schedule-gate') {
      options.skipScheduleGate = true;
      continue;
    }

    if (value === '--date' && argv[index + 1]) {
      options.date = argv[index + 1];
      index += 1;
    }
  }

  if (!options.date && env.AUTOMATION_RUN_DATE) {
    options.date = env.AUTOMATION_RUN_DATE;
  }

  if (!options.dryRun && env.AUTOMATION_DRY_RUN) {
    options.dryRun = env.AUTOMATION_DRY_RUN === 'true';
  }

  if (!options.force && env.AUTOMATION_FORCE) {
    options.force = env.AUTOMATION_FORCE === 'true';
  }

  if (!options.skipScheduleGate && env.AUTOMATION_SKIP_SCHEDULE_GATE) {
    options.skipScheduleGate = env.AUTOMATION_SKIP_SCHEDULE_GATE === 'true';
  }

  if (options.date) {
    assertDateString(options.date, 'AUTOMATION_RUN_DATE');
  }

  return options;
}

export function assertDateString(value, label = 'date') {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new Error(`${label} must be in YYYY-MM-DD format.`);
  }
}

export function getLocalTimeParts(date = new Date(), timeZone = TIME_ZONE) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'short',
    hourCycle: 'h23',
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  );

  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAY_LOOKUP[String(parts.weekday).toLowerCase()] ?? String(parts.weekday).toLowerCase(),
  };
}

export function shouldRunInScheduledWindow({
  targetWeekday,
  targetHour,
  options,
  now = new Date(),
  graceHours = 0,
}) {
  if (options.skipScheduleGate || options.date) {
    return {
      shouldRun: true,
      reason: options.date ? `manual date override ${options.date}` : 'schedule gate skipped',
      observed: getLocalTimeParts(now),
    };
  }

  const observed = getLocalTimeParts(now);
  const observedHour = String(observed.hour).padStart(2, '0');
  const targetHourLabel = String(targetHour).padStart(2, '0');
  const hourDistance = Math.abs(observed.hour - targetHour);

  if (observed.weekday !== targetWeekday || hourDistance > graceHours) {
    return {
      shouldRun: false,
      reason: `current Australia/Sydney time is ${observed.weekday} ${observedHour}:00`,
      observed,
    };
  }

  if (hourDistance > 0) {
    return {
      shouldRun: true,
      reason: `within ${graceHours}-hour grace window of ${targetWeekday} ${targetHourLabel}:00 Australia/Sydney (observed ${observedHour}:00)`,
      observed,
    };
  }

  return {
    shouldRun: true,
    reason: `matched ${targetWeekday} ${targetHourLabel}:00 Australia/Sydney`,
    observed,
  };
}

export function resolveEffectiveDate(options, now = new Date()) {
  return options.date ?? getLocalTimeParts(now).date;
}

export function getIsoWeekInfo(dateString) {
  assertDateString(dateString, 'date');
  const [year, month, day] = dateString.split('-').map(Number);
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  const dayNumber = utcDate.getUTCDay() || 7;
  utcDate.setUTCDate(utcDate.getUTCDate() + 4 - dayNumber);
  const isoYear = utcDate.getUTCFullYear();
  const yearStart = new Date(Date.UTC(isoYear, 0, 1));
  const isoWeek = Math.ceil((((utcDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return {
    isoYear,
    isoWeek,
  };
}

export function buildWeekKey(dateString) {
  const { isoYear, isoWeek } = getIsoWeekInfo(dateString);
  return `${isoYear}-${String(isoWeek).padStart(2, '0')}`;
}

export function shiftDateString(dateString, offsetDays) {
  assertDateString(dateString, 'date');
  const [year, month, day] = dateString.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, day));
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  return shifted.toISOString().slice(0, 10);
}

export function buildAutomationIdentity(kind, dateString) {
  const weekKey = buildWeekKey(dateString);

  if (kind === 'performance') {
    return {
      weekKey,
      branchName: `${PERFORMANCE_BRANCH_PREFIX}${weekKey}`,
      pullRequestTitle: `${PERFORMANCE_PR_PREFIX}${weekKey}`,
    };
  }

  return {
    weekKey,
    branchName: `${CONTENT_BRANCH_PREFIX}${weekKey}`,
    pullRequestTitle: `${CONTENT_PR_PREFIX}${weekKey}`,
  };
}

export function slugify(value) {
  return value
    .normalize('NFKD')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function runCommand(command, args, options = {}) {
  const { cwd = REPO_ROOT, env = process.env, allowFailure = false } = options;

  try {
    return await execFile(command, args, {
      cwd,
      env,
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
    throw new Error(`Command failed: ${command} ${args.join(' ')}${stderr}`);
  }
}

export async function ensureCleanWorktree() {
  const { stdout } = await runCommand('git', ['status', '--porcelain']);

  if (stdout.trim().length > 0) {
    throw new Error('Automation requires a clean worktree.');
  }
}

export async function remoteBranchExists(branchName) {
  const result = await runCommand('git', ['ls-remote', '--heads', 'origin', branchName], {
    allowFailure: true,
  });

  return result.stdout.trim().length > 0;
}

export async function checkoutAutomationBranch(branchName) {
  await runCommand('git', ['fetch', 'origin', 'main', '--quiet']);

  if (await remoteBranchExists(branchName)) {
    await runCommand('git', ['fetch', 'origin', branchName, '--quiet']);
    await runCommand('git', ['checkout', '-B', branchName, `origin/${branchName}`]);
    return { branchName, created: false };
  }

  await runCommand('git', ['checkout', '-B', branchName, 'origin/main']);
  return { branchName, created: true };
}

export async function listChangedBlogFilesAgainstMain() {
  const { stdout } = await runCommand('git', ['diff', '--name-only', 'origin/main...HEAD', '--', 'blog']);
  return stdout
    .split('\n')
    .map((entry) => entry.trim())
    .filter((entry) => entry.endsWith('.md'))
    .sort();
}

export async function fileExists(filePath) {
  try {
    await access(filePath, fsConstants.F_OK);
    return true;
  } catch {
    return false;
  }
}

export async function readText(filePath) {
  return readFile(filePath, 'utf8');
}

export async function writeText(filePath, contents) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, contents, 'utf8');
}

export async function runContentManifestWrite() {
  await runCommand(process.execPath, ['scripts/content-manifest.mjs', '--write']);
}

export async function runContentManifestCheck() {
  await runCommand(process.execPath, ['scripts/content-manifest.mjs', '--check']);
}

export async function hasGitChanges() {
  const { stdout } = await runCommand('git', ['status', '--porcelain']);
  return stdout.trim().length > 0;
}

export async function commitAndPushChanges({ branchName, commitMessage, dryRun }) {
  const dirty = await hasGitChanges();

  if (!dirty) {
    return false;
  }

  if (dryRun) {
    return true;
  }

  await runCommand('git', ['config', 'user.name', 'github-actions[bot]']);
  await runCommand('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  await runCommand('git', ['add', '-A']);
  await runCommand('git', ['commit', '-m', commitMessage]);
  await runCommand('git', ['push', '--set-upstream', 'origin', branchName]);
  return true;
}

export function appendStepSummary(lines) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  const summary = Array.isArray(lines) ? `${lines.join('\n')}\n` : `${String(lines)}\n`;
  return writeFile(process.env.GITHUB_STEP_SUMMARY, summary, { flag: 'a' });
}

export function toPercent(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return '—';
  }

  const normalised = value <= 1 ? value * 100 : value;
  return `${normalised.toFixed(normalised % 1 === 0 ? 0 : 1)}%`;
}

export function countWords(value) {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function todayForSummary() {
  const now = getLocalTimeParts();
  return `${now.date} ${String(now.hour).padStart(2, '0')}:${String(now.minute).padStart(2, '0')} ${TIME_ZONE}`;
}
