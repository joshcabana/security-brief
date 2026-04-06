#!/usr/bin/env node

import { readFileSync } from 'fs';
import net from 'net';
import path, { dirname, resolve } from 'path';
import { spawn, spawnSync } from 'child_process';
import { fileURLToPath, pathToFileURL } from 'url';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, '..');
const PACKAGE_JSON = JSON.parse(readFileSync(path.join(REPO_ROOT, 'package.json'), 'utf8'));
const PACKAGE_MANAGER_SPEC = typeof PACKAGE_JSON.packageManager === 'string'
  ? PACKAGE_JSON.packageManager
  : 'pnpm@10.23.0';
const SERVER_READY_TIMEOUT_MS = 30_000;
const activeApps = new Set();

export const LIVE_MATRIX_AFFILIATE_ENV = Object.freeze({
  AFFILIATE_NORDVPN: 'https://go.nordvpn.net/aff_c?aff_id=143381',
  AFFILIATE_PUREVPN: 'https://www.purevpn.com/order-now.php?affiliate_id=49384204',
  AFFILIATE_PROTON: 'https://go.getproton.me/aff_c?url_id=471',
  AFFILIATE_PROTON_VPN: 'https://go.getproton.me/aff_c?url_id=471',
  AFFILIATE_PROTON_MAIL: 'https://go.getproton.me/aff_c?url_id=921',
});

export const LIVE_MATRIX_CASES = Object.freeze([
  Object.freeze({
    name: 'plausible-disabled',
    plausibleDomain: '',
    label: 'Plausible disabled',
  }),
  Object.freeze({
    name: 'plausible-enabled',
    plausibleDomain: 'aithreatbrief.com',
    label: 'Plausible enabled',
  }),
]);

export function buildLiveMatrixBaseUrl(port) {
  return `http://127.0.0.1:${String(port)}`;
}

export function buildLiveMatrixCaseEnv(port, plausibleDomain) {
  return {
    ...LIVE_MATRIX_AFFILIATE_ENV,
    NEXT_PUBLIC_SITE_URL: buildLiveMatrixBaseUrl(port),
    NEXT_PUBLIC_PLAUSIBLE_DOMAIN: plausibleDomain,
  };
}

function canRunCommand(command, args) {
  const result = spawnSync(command, args, { stdio: 'ignore' });
  return !result.error && result.status === 0;
}

function resolvePackageManagerLaunch() {
  if (canRunCommand('pnpm', ['--version'])) {
    return {
      command: 'pnpm',
      args: [],
    };
  }

  if (canRunCommand('npx', ['--version'])) {
    return {
      command: 'npx',
      args: [PACKAGE_MANAGER_SPEC],
    };
  }

  throw new Error('verify:live:matrix requires pnpm on PATH or npm/npx so the pinned pnpm version can be launched.');
}

function findFreePort() {
  return new Promise((resolvePort, reject) => {
    const server = net.createServer();

    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        reject(new Error('Could not resolve a free port for verify:live:matrix.'));
        return;
      }

      const { port } = address;

      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolvePort(port);
      });
    });

    server.on('error', reject);
  });
}

async function waitForServer(url, label) {
  const deadline = Date.now() + SERVER_READY_TIMEOUT_MS;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);

      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }

  throw new Error(`Timed out waiting for ${label}.`);
}

function startApp(packageManagerLaunch, port, extraEnv) {
  const child = spawn(
    packageManagerLaunch.command,
    [...packageManagerLaunch.args, 'dev', '-p', String(port)],
    {
      cwd: REPO_ROOT,
      detached: true,
      env: {
        ...process.env,
        ...extraEnv,
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  let logs = '';

  const killProcessGroup = (signal) => {
    if (!child.pid) {
      return;
    }

    try {
      process.kill(-child.pid, signal);
    } catch (error) {
      if (error.code !== 'ESRCH') {
        throw error;
      }
    }
  };

  child.stdout.on('data', (chunk) => {
    logs += chunk.toString();
  });
  child.stderr.on('data', (chunk) => {
    logs += chunk.toString();
  });

  return {
    child,
    getLogs() {
      return logs;
    },
    async stop() {
      if (child.exitCode !== null) {
        return;
      }

      await new Promise((resolveStop, rejectStop) => {
        let settled = false;
        const timeout = setTimeout(() => {
          if (child.exitCode === null) {
            killProcessGroup('SIGKILL');
          }

          finish(resolveStop);
        }, 5_000);

        const finish = (callback, value) => {
          if (settled) {
            return;
          }

          settled = true;
          clearTimeout(timeout);
          child.off('exit', handleExit);
          child.off('error', handleError);
          callback(value);
        };

        const handleExit = () => {
          finish(resolveStop);
        };

        const handleError = (error) => {
          finish(rejectStop, error);
        };

        child.once('exit', handleExit);
        child.once('error', handleError);
        killProcessGroup('SIGINT');

        if (child.exitCode !== null) {
          finish(resolveStop);
        }
      });
    },
  };
}

async function stopActiveApps() {
  const apps = [...activeApps];

  activeApps.clear();
  await Promise.all(apps.map(async (app) => {
    await app.stop();
  }));
}

function printSection(label) {
  const divider = '='.repeat(72);
  console.log(`\n${divider}`);
  console.log(label);
  console.log(divider);
}

function runVerifier(baseUrl, plausibleDomain) {
  const result = spawnSync(
    process.execPath,
    [path.join('scripts', 'verify-live.mjs'), '--base-url', baseUrl],
    {
      cwd: REPO_ROOT,
      env: {
        ...process.env,
        NEXT_PUBLIC_PLAUSIBLE_DOMAIN: plausibleDomain,
      },
      stdio: 'inherit',
    },
  );

  if (result.status !== 0) {
    throw new Error(`verify-live failed for ${baseUrl} with exit status ${String(result.status)}.`);
  }
}

async function runMatrixCase(packageManagerLaunch, matrixCase) {
  const port = await findFreePort();
  const baseUrl = buildLiveMatrixBaseUrl(port);
  const app = startApp(packageManagerLaunch, port, buildLiveMatrixCaseEnv(port, matrixCase.plausibleDomain));

  activeApps.add(app);

  printSection(`verify:live:matrix -> ${matrixCase.label}`);

  try {
    await waitForServer(baseUrl, `${matrixCase.label} app`);
    runVerifier(baseUrl, matrixCase.plausibleDomain);
    console.log(`[PASS] ${matrixCase.name}`);
  } catch (error) {
    const appLogs = app.getLogs().trim();

    if (appLogs.length > 0) {
      console.error('\nApp logs:\n');
      console.error(appLogs);
    }

    throw error;
  } finally {
    activeApps.delete(app);
    await app.stop();
  }
}

export async function main() {
  const packageManagerLaunch = resolvePackageManagerLaunch();

  console.log('Starting verify:live matrix across both analytics states.');

  for (const matrixCase of LIVE_MATRIX_CASES) {
    await runMatrixCase(packageManagerLaunch, matrixCase);
  }

  console.log('\n[PASS] verify:live:matrix completed successfully.');
}

process.once('SIGINT', () => {
  stopActiveApps()
    .catch(() => {})
    .finally(() => {
      process.exit(130);
    });
});

process.once('SIGTERM', () => {
  stopActiveApps()
    .catch(() => {})
    .finally(() => {
      process.exit(143);
    });
});

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(async (error) => {
    await stopActiveApps().catch(() => {});
    const message = error instanceof Error ? error.message : 'Unknown verify:live:matrix failure.';
    console.error(`\n[FAIL] ${message}`);
    process.exit(1);
  });
}
