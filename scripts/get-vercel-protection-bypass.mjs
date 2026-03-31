#!/usr/bin/env node

import { writeFileSync } from 'fs';
import { resolve } from 'path';
import { pathToFileURL } from 'url';

const VERCEL_API_BASE_URL = 'https://api.vercel.com';

function getArgValue(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);

  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1];
}

function getEnvValue(name) {
  return process.env[name]?.trim() ?? '';
}

function getRequiredEnvValue(name) {
  const value = getEnvValue(name);

  if (!value) {
    throw new Error(`${name} is required to resolve the Vercel protection bypass token.`);
  }

  return value;
}

function appendAccountScope(url, orgId) {
  if (orgId.startsWith('team_')) {
    url.searchParams.set('teamId', orgId);
  }
}

function resolveOutputPath(outputPath) {
  return resolve(process.cwd(), outputPath);
}

function parseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

export function getAutomationBypassToken(protectionBypass) {
  if (!protectionBypass || typeof protectionBypass !== 'object') {
    return null;
  }

  return (
    Object.keys(protectionBypass).find((token) => protectionBypass[token]?.scope === 'automation-bypass') ?? null
  );
}

export async function vercelApiRequest({ path, method, token, orgId, body, fetchImpl }) {
  const url = new URL(path, VERCEL_API_BASE_URL);
  appendAccountScope(url, orgId);

  const requestHeaders = {
    authorization: `Bearer ${token}`,
  };

  if (body !== undefined) {
    requestHeaders['content-type'] = 'application/json';
  }

  const response = await fetchImpl(url, {
    method,
    headers: requestHeaders,
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const responseText = await response.text();
  const responseJson = parseJson(responseText);

  if (!response.ok) {
    throw new Error(
      `Vercel API ${method} ${url.pathname} failed with ${response.status} ${response.statusText}. Response body: ${responseText || '<empty>'}`,
    );
  }

  return responseJson;
}

export async function resolveProtectionBypassToken({
  explicitToken,
  token,
  orgId,
  projectId,
  fetchImpl,
}) {
  if (explicitToken) {
    return explicitToken;
  }

  const project = await vercelApiRequest({
    path: `/v9/projects/${encodeURIComponent(projectId)}`,
    method: 'GET',
    token,
    orgId,
    fetchImpl,
  });
  const existingToken = getAutomationBypassToken(project?.protectionBypass ?? null);

  if (existingToken) {
    return existingToken;
  }

  const protectionBypassResponse = await vercelApiRequest({
    path: `/v1/projects/${encodeURIComponent(projectId)}/protection-bypass`,
    method: 'PATCH',
    token,
    orgId,
    body: {},
    fetchImpl,
  });
  const generatedToken = getAutomationBypassToken(protectionBypassResponse?.protectionBypass ?? null);

  if (!generatedToken) {
    throw new Error(`Vercel project ${projectId} did not return an automation protection bypass token.`);
  }

  return generatedToken;
}

async function main() {
  const outputPath = getArgValue('output');
  const explicitToken = getEnvValue('VERCEL_PROTECTION_BYPASS') || getEnvValue('VERCEL_AUTOMATION_BYPASS_SECRET');
  const token = getRequiredEnvValue('VERCEL_TOKEN');
  const orgId = getRequiredEnvValue('VERCEL_ORG_ID');
  const projectId = getRequiredEnvValue('VERCEL_PROJECT_ID');
  const protectionBypassToken = await resolveProtectionBypassToken({
    explicitToken,
    token,
    orgId,
    projectId,
    fetchImpl: fetch,
  });

  if (outputPath) {
    writeFileSync(resolveOutputPath(outputPath), `${protectionBypassToken}\n`, 'utf8');
    return;
  }

  process.stdout.write(`${protectionBypassToken}\n`);
}

const isDirectExecution =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;

if (isDirectExecution) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : 'Unknown Vercel protection bypass error.');
    process.exit(1);
  });
}
