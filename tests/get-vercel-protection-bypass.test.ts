import assert from 'node:assert/strict';
import test from 'node:test';
import {
  getAutomationBypassToken,
  resolveProtectionBypassToken,
  vercelApiRequest,
} from '../scripts/get-vercel-protection-bypass.mjs';

function createJsonResponse(body: object, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json',
    },
  });
}

test('getAutomationBypassToken returns the automation bypass token from the Vercel response shape', () => {
  const protectionBypass = {
    existingToken: {
      scope: 'shareable-link',
    },
    automationToken: {
      scope: 'automation-bypass',
    },
  };

  assert.equal(getAutomationBypassToken(protectionBypass), 'automationToken');
});

test('vercelApiRequest scopes team requests with the teamId query parameter', async () => {
  const requestUrls: string[] = [];

  const response = await vercelApiRequest({
    path: '/v9/projects/prj_123',
    method: 'GET',
    token: 'vercel-token',
    orgId: 'team_456',
    body: undefined,
    fetchImpl: async (url: string | URL, options: RequestInit | undefined) => {
      requestUrls.push(String(url));
      assert.equal(new Headers(options?.headers).get('authorization'), 'Bearer vercel-token');
      return createJsonResponse({ ok: true }, 200);
    },
  });

  assert.deepEqual(response, { ok: true });
  assert.deepEqual(requestUrls, ['https://api.vercel.com/v9/projects/prj_123?teamId=team_456']);
});

test('resolveProtectionBypassToken reuses an existing automation bypass token without creating a new one', async () => {
  const requests: Array<{ method: string; url: string }> = [];

  const protectionBypassToken = await resolveProtectionBypassToken({
    explicitToken: '',
    token: 'vercel-token',
    orgId: 'team_456',
    projectId: 'prj_123',
    fetchImpl: async (url: string | URL, options: RequestInit | undefined) => {
      requests.push({
        method: String(options?.method ?? 'GET'),
        url: String(url),
      });

      return createJsonResponse(
        {
          protectionBypass: {
            existingAutomationToken: {
              scope: 'automation-bypass',
            },
          },
        },
        200,
      );
    },
  });

  assert.equal(protectionBypassToken, 'existingAutomationToken');
  assert.deepEqual(requests, [
    {
      method: 'GET',
      url: 'https://api.vercel.com/v9/projects/prj_123?teamId=team_456',
    },
  ]);
});

test('resolveProtectionBypassToken creates an automation bypass token when the project has none configured', async () => {
  const requests: Array<{ method: string; url: string }> = [];

  const protectionBypassToken = await resolveProtectionBypassToken({
    explicitToken: '',
    token: 'vercel-token',
    orgId: 'team_456',
    projectId: 'prj_123',
    fetchImpl: async (url: string | URL, options: RequestInit | undefined) => {
      requests.push({
        method: String(options?.method ?? 'GET'),
        url: String(url),
      });

      if (requests.length === 1) {
        return createJsonResponse({ protectionBypass: {} }, 200);
      }

      return createJsonResponse(
        {
          protectionBypass: {
            generatedAutomationToken: {
              scope: 'automation-bypass',
            },
          },
        },
        200,
      );
    },
  });

  assert.equal(protectionBypassToken, 'generatedAutomationToken');
  assert.deepEqual(requests, [
    {
      method: 'GET',
      url: 'https://api.vercel.com/v9/projects/prj_123?teamId=team_456',
    },
    {
      method: 'PATCH',
      url: 'https://api.vercel.com/v1/projects/prj_123/protection-bypass?teamId=team_456',
    },
  ]);
});

test('resolveProtectionBypassToken honours an explicit bypass token without calling the Vercel API', async () => {
  const protectionBypassToken = await resolveProtectionBypassToken({
    explicitToken: 'explicit-token',
    token: 'vercel-token',
    orgId: 'team_456',
    projectId: 'prj_123',
    fetchImpl: async () => {
      throw new Error('fetch should not be called when an explicit token is provided');
    },
  });

  assert.equal(protectionBypassToken, 'explicit-token');
});

test('vercelApiRequest includes status and body details when the Vercel API returns an error', async () => {
  await assert.rejects(
    vercelApiRequest({
      path: '/v1/projects/prj_123/protection-bypass',
      method: 'PATCH',
      token: 'vercel-token',
      orgId: 'team_456',
      body: {},
      fetchImpl: async () =>
        createJsonResponse(
          {
            error: {
              message: 'deployment protection is unavailable',
            },
          },
          403,
        ),
    }),
    /Vercel API PATCH \/v1\/projects\/prj_123\/protection-bypass failed with 403[\s\S]*deployment protection is unavailable/,
  );
});
