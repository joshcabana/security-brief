import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const packageJsonPath = path.join(repoRoot, 'package.json');
const eslintConfigPath = path.join(repoRoot, 'eslint.config.mjs');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
};

function parseSemver(versionRange: string): [number, number, number] {
  const normalizedVersion = versionRange.replace(/^[^\d]*/, '');
  const parts = normalizedVersion.split('.');

  assert.equal(parts.length >= 3, true);

  return [
    Number.parseInt(parts[0], 10),
    Number.parseInt(parts[1], 10),
    Number.parseInt(parts[2], 10),
  ];
}

function assertVersionAtLeast(actualRange: string, minimumVersion: string): void {
  const actual = parseSemver(actualRange);
  const minimum = parseSemver(minimumVersion);

  for (let index = 0; index < actual.length; index += 1) {
    if (actual[index] > minimum[index]) {
      return;
    }

    if (actual[index] < minimum[index]) {
      assert.fail(`Expected ${actualRange} to be at least ${minimumVersion}`);
    }
  }
}

function assertIsString(value: string | undefined): asserts value is string {
  assert.equal(typeof value, 'string');
}

test('lint script uses eslint CLI instead of interactive next lint', () => {
  assert.equal(
    packageJson.scripts?.lint,
    'eslint . --ext .js,.mjs,.ts,.tsx',
  );
});

test('verify:pr script runs the canonical PR QA gate in sequence', () => {
  assert.equal(
    packageJson.scripts?.['verify:pr'],
    'pnpm lint && pnpm verify:release && pnpm verify:ops:contract && pnpm audit --prod',
  );
});

test('eslint flat config exists and extends next core web vitals', () => {
  assert.equal(existsSync(eslintConfigPath), true);

  const eslintConfigSource = readFileSync(eslintConfigPath, 'utf8');

  assert.match(eslintConfigSource, /compat\.extends\('next\/core-web-vitals'\)/);
  assert.match(eslintConfigSource, /ignores: \['\.next\/\*\*', 'node_modules\/\*\*', 'out\/\*\*'\]/);
});

test('dependency versions stay on patched security releases', () => {
  const nextVersion = packageJson.dependencies?.next;
  const eslintConfigNextVersion = packageJson.devDependencies?.['eslint-config-next'];
  const fastXmlParserVersion = packageJson.dependencies?.['fast-xml-parser'];
  const sanitizeHtmlVersion = packageJson.dependencies?.['sanitize-html'];
  const upstashRedisVersion = packageJson.dependencies?.['@upstash/redis'];
  const upstashRatelimitVersion = packageJson.dependencies?.['@upstash/ratelimit'];

  assertIsString(nextVersion);
  assertIsString(eslintConfigNextVersion);
  assertIsString(fastXmlParserVersion);
  assertIsString(sanitizeHtmlVersion);
  assertIsString(upstashRedisVersion);
  assertIsString(upstashRatelimitVersion);
  assert.equal(nextVersion, eslintConfigNextVersion);

  assertVersionAtLeast(nextVersion, '15.5.14');
  assertVersionAtLeast(fastXmlParserVersion, '5.5.7');
  assertVersionAtLeast(sanitizeHtmlVersion, '2.17.2');
  assertVersionAtLeast(upstashRedisVersion, '1.37.0');
  assertVersionAtLeast(upstashRatelimitVersion, '2.0.8');
});
