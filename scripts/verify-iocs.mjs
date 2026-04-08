#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = process.cwd();
const EDITORIAL_DIR = path.join(ROOT, 'blog');
const DRAFTS_DIR = path.join(ROOT, 'drafts');
const OUTPUT_PATH = path.join(ROOT, 'artifacts', 'ioc-verification.json');
const REQUEST_TIMEOUT_MS = 15_000;
const RESPONSE_SIZE_LIMIT = 512_000;
const VT_API_KEY = process.env.VIRUSTOTAL_API_KEY?.trim() || process.env.VT_API_KEY?.trim() || '';
const NVD_API_KEY = process.env.NVD_API_KEY?.trim() || '';
const GROUP_LIST_URL = 'https://attack.mitre.org/groups/';

const APT_NAME_PATTERN = /\b(?:APT\d{1,3}|FIN\d{1,4}|UNC\d{1,5}|TA\d{3,4}|Lazarus Group|Volt Typhoon|Sandworm|Scattered Spider|Cozy Bear|Fancy Bear)\b/gi;
const ATTACK_ID_PATTERN = /\b(?:T\d{4}(?:\.\d{3})?|S\d{4}|G\d{4})\b/g;
const CVE_PATTERN = /\bCVE-\d{4}-\d{4,7}\b/gi;
const HASH_PATTERN = /\b(?:[A-Fa-f0-9]{32}|[A-Fa-f0-9]{40}|[A-Fa-f0-9]{64})\b/g;

function dedupe(values) {
  return [...new Set(values)];
}

function toSortedLowerSet(values) {
  return dedupe(values.map((value) => value.toLowerCase())).sort();
}

async function fetchWithTimeout(url, options = {}, fetchImpl = fetch) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetchImpl(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json, text/html;q=0.9',
        ...(options.headers ?? {}),
      },
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

async function readResponseBody(response) {
  const reader = response.body?.getReader();

  if (!reader) {
    return response.text();
  }

  let total = 0;
  const chunks = [];

  while (true) {
    const { done, value } = await reader.read();

    if (done) {
      break;
    }

    total += value.byteLength;
    if (total > RESPONSE_SIZE_LIMIT) {
      throw new Error(`Response exceeded ${RESPONSE_SIZE_LIMIT} bytes.`);
    }

    chunks.push(value);
  }

  return Buffer.concat(chunks).toString('utf8');
}

async function readMarkdownFiles(directory) {
  try {
    const entries = await fs.readdir(directory);
    const markdownFiles = entries.filter((entry) => entry.endsWith('.md')).sort();
    return Promise.all(markdownFiles.map(async (fileName) => ({
      fileName,
      source: await fs.readFile(path.join(directory, fileName), 'utf8'),
    })));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export function extractIocsFromText(source) {
  return {
    cves: dedupe(source.match(CVE_PATTERN) ?? []).sort(),
    attackIds: dedupe(source.match(ATTACK_ID_PATTERN) ?? []).sort(),
    hashes: dedupe(source.match(HASH_PATTERN) ?? []).sort(),
    aptGroups: dedupe(source.match(APT_NAME_PATTERN) ?? []).sort(),
  };
}

async function verifyCve(cveId, fetchImpl = fetch) {
  const url = new URL('https://services.nvd.nist.gov/rest/json/cves/2.0');
  url.searchParams.set('cveId', cveId);

  const headers = {};
  if (NVD_API_KEY) {
    headers.apiKey = NVD_API_KEY;
  }

  const response = await fetchWithTimeout(url.toString(), { headers }, fetchImpl);
  if (!response.ok) {
    return { ok: false, detail: `NVD returned ${response.status}` };
  }

  const payload = JSON.parse(await readResponseBody(response));
  return {
    ok: Array.isArray(payload.vulnerabilities) && payload.vulnerabilities.length > 0,
    detail: 'Validated with NVD CVE API',
  };
}

async function verifyHash(hash, fetchImpl = fetch) {
  if (!VT_API_KEY) {
    return { ok: false, detail: 'VirusTotal API key missing.' };
  }

  const response = await fetchWithTimeout(
    `https://www.virustotal.com/api/v3/files/${hash}`,
    {
      headers: {
        'x-apikey': VT_API_KEY,
      },
    },
    fetchImpl,
  );

  if (response.status === 404) {
    return { ok: false, detail: 'VirusTotal has no report for this hash.' };
  }

  if (!response.ok) {
    return { ok: false, detail: `VirusTotal returned ${response.status}` };
  }

  return {
    ok: true,
    detail: 'Validated with VirusTotal file report API',
  };
}

async function verifyAttackId(attackId, fetchImpl = fetch) {
  let pathPrefix = 'techniques';

  if (attackId.startsWith('G')) {
    pathPrefix = 'groups';
  } else if (attackId.startsWith('S')) {
    pathPrefix = 'software';
  }

  const response = await fetchWithTimeout(`https://attack.mitre.org/${pathPrefix}/${attackId}/`, {}, fetchImpl);
  return {
    ok: response.ok,
    detail: response.ok ? `Validated with MITRE ATT&CK ${pathPrefix} page` : `MITRE ATT&CK returned ${response.status}`,
  };
}

async function verifyAptGroupName(groupName, groupListingHtmlPromise) {
  const groupListingHtml = (await groupListingHtmlPromise).toLowerCase();
  const normalized = groupName.toLowerCase();

  return {
    ok: groupListingHtml.includes(normalized),
    detail: 'Validated against MITRE ATT&CK group index',
  };
}

async function getMitreGroupListing(fetchImpl = fetch) {
  const response = await fetchWithTimeout(GROUP_LIST_URL, {}, fetchImpl);
  if (!response.ok) {
    throw new Error(`MITRE ATT&CK group index returned ${response.status}.`);
  }

  return readResponseBody(response);
}

async function verifyCollection(kind, values, verifyFn) {
  const records = [];

  for (const value of values) {
    const verdict = await verifyFn(value);
    records.push({
      value,
      kind,
      ok: verdict.ok,
      detail: verdict.detail,
    });
  }

  return records;
}

export async function buildIocVerificationReport({ fetchImpl = fetch } = {}) {
  const [editorialFiles, draftFiles] = await Promise.all([
    readMarkdownFiles(EDITORIAL_DIR),
    readMarkdownFiles(DRAFTS_DIR),
  ]);
  const groupListingHtmlPromise = getMitreGroupListing(fetchImpl);
  const entries = [];
  const failures = [];

  for (const file of [...editorialFiles, ...draftFiles]) {
    const extracted = extractIocsFromText(file.source);
    const verifications = [
      ...(await verifyCollection('cve', extracted.cves, (value) => verifyCve(value, fetchImpl))),
      ...(await verifyCollection('attack_id', extracted.attackIds, (value) => verifyAttackId(value, fetchImpl))),
      ...(await verifyCollection('hash', extracted.hashes, (value) => verifyHash(value, fetchImpl))),
      ...(await verifyCollection('apt_group', extracted.aptGroups, (value) => verifyAptGroupName(value, groupListingHtmlPromise))),
    ];

    for (const verification of verifications) {
      if (!verification.ok) {
        failures.push({
          fileName: file.fileName,
          ...verification,
        });
      }
    }

    if (extracted.hashes.length > 0 && !VT_API_KEY) {
      failures.push({
        fileName: file.fileName,
        kind: 'hash',
        value: '(hashes present)',
        ok: false,
        detail: 'VirusTotal API key missing while hashes are present in content.',
      });
    }

    entries.push({
      fileName: file.fileName,
      cves: toSortedLowerSet(extracted.cves),
      attackIds: extracted.attackIds,
      hashes: toSortedLowerSet(extracted.hashes),
      aptGroups: extracted.aptGroups,
      verified: verifications,
      ok: verifications.every((verification) => verification.ok) && !(extracted.hashes.length > 0 && !VT_API_KEY),
    });
  }

  return {
    checkedAt: new Date().toISOString(),
    ok: failures.length === 0,
    entries,
    failures,
  };
}

async function main() {
  const report = await buildIocVerificationReport();

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
  await fs.writeFile(OUTPUT_PATH, `${JSON.stringify(report, null, 2)}\n`, 'utf8');

  console.log(`checked_at=${report.checkedAt}`);
  console.log(`output=${OUTPUT_PATH}`);
  console.log(`ok=${report.ok}`);
  console.log(`entries=${report.entries.length}`);
  console.log(`failures=${report.failures.length}`);

  if (!report.ok) {
    for (const failure of report.failures) {
      console.log(`FAIL ${failure.fileName} ${failure.kind} ${failure.value}: ${failure.detail}`);
    }

    process.exitCode = 1;
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
