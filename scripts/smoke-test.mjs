import assert from 'node:assert/strict';
import { createServer as createHttpServer } from 'node:http';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import net from 'node:net';
import { SECURITY_HEADERS } from '../lib/security-headers.mjs';

const repoDir = process.cwd();
const packageJson = JSON.parse(await readFile(path.join(repoDir, 'package.json'), 'utf8'));
const packageManagerSpec = typeof packageJson.packageManager === 'string'
  ? packageJson.packageManager
  : 'pnpm@10.23.0';

function findFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, '127.0.0.1', () => {
      const address = server.address();

      if (!address || typeof address === 'string') {
        reject(new Error('Could not resolve a free port.'));
        return;
      }

      const { port } = address;
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(port);
      });
    });
    server.on('error', reject);
  });
}

async function waitForServer(url, label) {
  const deadline = Date.now() + 30_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // Retry until timeout.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${label}.`);
}

function startApp(port, extraEnv = {}) {
  const packageManagerLaunch = resolvePackageManagerLaunch();
  const child = spawn(packageManagerLaunch.command, [...packageManagerLaunch.args, 'start', '-p', String(port)], {
    cwd: repoDir,
    detached: true,
    env: {
      ...process.env,
      NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}`,
      ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
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

      await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (callback, value) => {
          if (settled) {
            return;
          }
          settled = true;
          clearTimeout(timeout);
          child.off('exit', onExit);
          child.off('error', onError);
          callback(value);
        };
        const onExit = () => {
          finish(resolve);
        };
        const onError = (error) => {
          finish(reject, error);
        };
        const timeout = setTimeout(() => {
          if (child.exitCode === null) {
            killProcessGroup('SIGKILL');
          }
          if (child.exitCode !== null) {
            finish(resolve);
          }
        }, 5_000);

        child.once('exit', onExit);
        child.once('error', onError);
        killProcessGroup('SIGINT');
        if (child.exitCode !== null) {
          finish(resolve);
        }
      });
    },
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
      args: [packageManagerSpec],
    };
  }

  throw new Error('Smoke tests require pnpm on PATH or npm/npx so the pinned pnpm version can be launched.');
}

async function startMockBeehiivServer() {
  const port = await findFreePort();
  const sockets = new Set();
  const server = createHttpServer(async (request, response) => {
    if (
      request.method !== 'POST' ||
      request.url !== '/v2/publications/test-publication/subscriptions'
    ) {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ message: 'Not found' }));
      return;
    }

    let requestBody = '';
    for await (const chunk of request) {
      requestBody += chunk.toString();
    }

    const payload = JSON.parse(requestBody);
    assert.equal('custom_fields' in payload, false);

    if (payload.email === 'error@example.com') {
      response.writeHead(422, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ errors: [{ message: 'Mock Beehiiv rejected the signup request.' }] }));
      return;
    }

    response.writeHead(201, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ data: { id: 'sub_123', email: payload.email } }));
  });

  server.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => {
      sockets.delete(socket);
    });
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async stop() {
      server.closeIdleConnections?.();
      server.closeAllConnections?.();
      for (const socket of sockets) {
        socket.destroy();
      }
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

function getRateLimitKeyPrefix(requestBody) {
  try {
    const commands = JSON.parse(requestBody);
    const rateLimitCommand = Array.isArray(commands)
      ? commands.find((command) => Array.isArray(command) && command[0] === 'evalsha')
      : null;
    const currentWindowKey = rateLimitCommand?.[3];

    if (typeof currentWindowKey !== 'string') {
      return null;
    }

    return currentWindowKey.replace(/:\d+$/, '');
  } catch {
    return null;
  }
}

async function startMockUpstashServer() {
  const port = await findFreePort();
  const requestCounts = new Map();
  const server = createHttpServer(async (request, response) => {
    if (request.method !== 'POST' || request.url !== '/pipeline') {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ message: 'Not found' }));
      return;
    }

    let requestBody = '';
    for await (const chunk of request) {
      requestBody += chunk.toString();
    }

    const commands = JSON.parse(requestBody);
    const keyPrefix = getRateLimitKeyPrefix(requestBody) ?? '@upstash/ratelimit:anonymous';
    const nextCount = (requestCounts.get(keyPrefix) ?? 0) + 1;
    requestCounts.set(keyPrefix, nextCount);
    const pipelineResults = Array.isArray(commands)
      ? commands.map((command) => {
          if (!Array.isArray(command)) {
            return { result: null };
          }

          if (command[0] === 'zincrby') {
            return { result: nextCount };
          }

          if (command[0] === 'evalsha') {
            return {
              result: [
                5 - nextCount,
                5,
              ],
            };
          }

          return { result: 'OK' };
        })
      : [{ result: null }];

    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify(pipelineResults));
  });

  await new Promise((resolve) => server.listen(port, '127.0.0.1', resolve));

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    async stop() {
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

function extractArticleLinks(html, knownSlugs) {
  return knownSlugs.filter((slug) => html.includes(`/blog/${slug}`));
}

async function requestJson(url, init) {
  const response = await fetch(url, init);
  return {
    response,
    payload: await response.json(),
  };
}

function assertSecurityHeaders(headers) {
  for (const header of SECURITY_HEADERS) {
    assert.equal(headers.get(header.key), header.value, `Expected ${header.key} to match the configured value.`);
  }
}

async function main() {
  const manifest = JSON.parse(
    await readFile(path.join(repoDir, 'content-manifest.json'), 'utf8'),
  );
  const articleSlugs = manifest.articles.map((article) => article.slug);
  const homepageSlugs = articleSlugs.slice(0, 4);
  const privacyArticles = manifest.articles.filter((article) => article.category === 'Privacy');
  assert.ok(privacyArticles.length > 0, 'Expected at least one Privacy article in content-manifest.json.');

  const coldStartPort = await findFreePort();
  const coldStartApp = startApp(coldStartPort, {
    BEEHIIV_API_KEY: '',
    BEEHIIV_PUBLICATION_ID: '',
  });

  try {
    await waitForServer(`http://127.0.0.1:${coldStartPort}/`, 'cold-start production server');
    const coldStartSameSiteHeaders = {
      'Content-Type': 'application/json',
      origin: `http://127.0.0.1:${coldStartPort}`,
    };

    const homeResponse = await fetch(`http://127.0.0.1:${coldStartPort}/`);
    assert.equal(homeResponse.status, 200);
    assertSecurityHeaders(homeResponse.headers);
    const homeHtml = await homeResponse.text();
    assert.deepEqual(
      extractArticleLinks(homeHtml, articleSlugs),
      homepageSlugs,
      'Expected homepage to link to the latest four article slugs in content-manifest.json.',
    );
    assert.match(homeHtml, /Published briefings/);
    assert.match(homeHtml, /Get the next briefing in your inbox/);
    assert.doesNotMatch(homeHtml, /Join the launch list|publication goes live/i);

    const privacyHtml = await fetch(`http://127.0.0.1:${coldStartPort}/blog?category=Privacy`).then((response) => response.text());
    assert.deepEqual(extractArticleLinks(privacyHtml, articleSlugs), privacyArticles.map((a) => a.slug));

    assert.doesNotMatch(homeHtml, /protected-assets\//);

    for (const article of manifest.articles) {
      const articleHtml = await fetch(`http://127.0.0.1:${coldStartPort}/blog/${article.slug}`).then((response) => response.text());
      assert.match(articleHtml, new RegExp(article.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(articleHtml, new RegExp(article.category.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
      assert.match(articleHtml, /Back to all articles/);
      assert.match(articleHtml, /Browse tools/);
    }

    const toolsHtml = await fetch(`http://127.0.0.1:${coldStartPort}/tools`).then((response) => response.text());
    assert.match(toolsHtml, /Affiliate disclosure:/);
    assert.match(toolsHtml, /affiliate links/);
    assert.match(toolsHtml, /Subscribe for weekly briefings, new tooling notes/);
    assert.doesNotMatch(toolsHtml, /launch updates/i);

    const newsletterHtml = await fetch(`http://127.0.0.1:${coldStartPort}/newsletter`).then((response) => response.text());
    assert.match(newsletterHtml, /weekly ai security briefings, privacy shifts, and practical tooling notes/i);
    assert.match(newsletterHtml, /one concise issue each week covering AI threats, privacy changes, and tools worth evaluating/i);
    assert.match(newsletterHtml, /weekly briefings, low-noise/i);
    assert.doesNotMatch(newsletterHtml, /launch list|publishing schedule is live/i);

    const missingConfigResult = await requestJson(`http://127.0.0.1:${coldStartPort}/api/subscribe`, {
      method: 'POST',
      headers: coldStartSameSiteHeaders,
      body: JSON.stringify({ email: 'reader@example.com' }),
    });
    assert.equal(missingConfigResult.response.status, 503);
    assert.equal(
      missingConfigResult.payload.message,
      'Newsletter signup is temporarily unavailable. Check rate limiting service connectivity and try again.',
    );
  } finally {
    await coldStartApp.stop();
  }

  const mockBeehiiv = await startMockBeehiivServer();
  const mockUpstash = await startMockUpstashServer();
  const configuredPort = await findFreePort();
  const configuredApp = startApp(configuredPort, {
    BEEHIIV_API_KEY: 'smoke-test-key',
    BEEHIIV_PUBLICATION_ID: 'test-publication',
    BEEHIIV_API_BASE_URL: mockBeehiiv.baseUrl,
    UPSTASH_REDIS_REST_URL: mockUpstash.baseUrl,
    UPSTASH_REDIS_REST_TOKEN: 'smoke-test-token',
  });

  try {
    await waitForServer(`http://127.0.0.1:${configuredPort}/`, 'configured production server');
    const sameSiteHeaders = {
      'Content-Type': 'application/json',
      origin: `http://127.0.0.1:${configuredPort}`,
    };

    const invalidJsonResult = await requestJson(`http://127.0.0.1:${configuredPort}/api/subscribe`, {
      method: 'POST',
      headers: sameSiteHeaders,
      body: '{"email"',
    });
    assert.equal(invalidJsonResult.response.status, 400);
    assert.equal(invalidJsonResult.payload.message, 'The signup request body was invalid JSON.');

    const invalidOriginResult = await requestJson(`http://127.0.0.1:${configuredPort}/api/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        origin: 'https://attacker.example',
      },
      body: JSON.stringify({ email: 'reader@example.com' }),
    });
    assert.equal(invalidOriginResult.response.status, 403);
    assert.equal(
      invalidOriginResult.payload.message,
      'This signup request could not be verified. Refresh the page and try again.',
    );

    const invalidEmailResult = await requestJson(`http://127.0.0.1:${configuredPort}/api/subscribe`, {
      method: 'POST',
      headers: sameSiteHeaders,
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    assert.equal(invalidEmailResult.response.status, 400);
    assert.equal(invalidEmailResult.payload.message, 'Enter a valid email address to subscribe.');

    const honeypotResult = await requestJson(`http://127.0.0.1:${configuredPort}/api/subscribe`, {
      method: 'POST',
      headers: sameSiteHeaders,
      body: JSON.stringify({ email: 'reader@example.com', website: 'https://spam.example' }),
    });
    assert.equal(honeypotResult.response.status, 400);
    assert.equal(honeypotResult.payload.message, 'This signup request could not be verified. Refresh the page and try again.');

    const upstreamErrorResult = await requestJson(`http://127.0.0.1:${configuredPort}/api/subscribe`, {
      method: 'POST',
      headers: sameSiteHeaders,
      body: JSON.stringify({ email: 'error@example.com' }),
    });
    assert.equal(upstreamErrorResult.response.status, 422);
    assert.equal(upstreamErrorResult.payload.message, 'Mock Beehiiv rejected the signup request.');

    const successResult = await requestJson(`http://127.0.0.1:${configuredPort}/api/subscribe`, {
      method: 'POST',
      headers: {
        ...sameSiteHeaders,
        'x-forwarded-for': '198.51.100.10',
      },
      body: JSON.stringify({ email: 'success@example.com' }),
    });
    assert.equal(successResult.response.status, 200);
    assert.equal(successResult.payload.message, "You're in. Check your inbox for Beehiiv's confirmation email.");

    for (let attemptNumber = 1; attemptNumber <= 5; attemptNumber += 1) {
      const allowedResponse = await requestJson(`http://127.0.0.1:${configuredPort}/api/subscribe`, {
        method: 'POST',
        headers: {
          ...sameSiteHeaders,
          'x-forwarded-for': '203.0.113.25',
        },
        body: JSON.stringify({ email: `burst-${attemptNumber}@example.com` }),
      });

      assert.equal(allowedResponse.response.status, 200);
    }

    const rateLimitedResult = await requestJson(`http://127.0.0.1:${configuredPort}/api/subscribe`, {
      method: 'POST',
      headers: {
        ...sameSiteHeaders,
        'x-forwarded-for': '203.0.113.25',
      },
      body: JSON.stringify({ email: 'burst-6@example.com' }),
    });

    assert.equal(rateLimitedResult.response.status, 429);
    assert.equal(
      rateLimitedResult.payload.message,
      'Too many signup attempts. Please try again in a minute.',
    );
  } finally {
    await configuredApp.stop();
    await mockBeehiiv.stop();
    await mockUpstash.stop();
  }
}

main().catch((error) => {
  console.error(error.stack || error.message);
  process.exit(1);
});
