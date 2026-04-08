#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import matter from 'gray-matter';
import { validateAuthorObject, validatePrimarySources } from './article-trust.mjs';

const ROOT = process.cwd();
const DEFAULT_CONTENT_DIRS = [path.join(ROOT, 'blog'), path.join(ROOT, 'reviews')];
const DEFAULT_OUTPUT_PATH = path.join(ROOT, 'artifacts', 'verify-trust.html');

function getArgValue(name) {
  const flag = `--${name}`;
  const index = process.argv.indexOf(flag);

  if (index === -1 || index === process.argv.length - 1) {
    return null;
  }

  return process.argv[index + 1];
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function createGateResult(name) {
  return {
    name,
    passed: 0,
    failed: 0,
  };
}

export function renderTrustDashboardHtml(report) {
  const failureRows = report.failures.length === 0
    ? '<tr><td colspan="4">No trust failures detected.</td></tr>'
    : report.failures.map((failure) => `
      <tr>
        <td>${escapeHtml(failure.fileName)}</td>
        <td>${escapeHtml(failure.slug)}</td>
        <td>${escapeHtml(failure.gate)}</td>
        <td>${escapeHtml(failure.message)}</td>
      </tr>
    `).join('');

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>verify:trust dashboard</title>
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #0d1117; color: #e6edf3; margin: 0; padding: 32px; }
      main { max-width: 1100px; margin: 0 auto; }
      h1, h2 { margin: 0 0 16px; }
      .meta, .card, table { background: #161b22; border: 1px solid #30363d; border-radius: 12px; }
      .meta, .grid { margin-bottom: 24px; }
      .meta { padding: 20px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
      .card { padding: 20px; }
      .label { color: #8b949e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 8px; }
      .value { font-size: 28px; font-weight: 700; }
      .ok { color: #3fb950; }
      .fail { color: #f85149; }
      table { width: 100%; border-collapse: collapse; overflow: hidden; }
      th, td { padding: 12px 14px; border-bottom: 1px solid #21262d; text-align: left; vertical-align: top; }
      th { color: #8b949e; font-size: 12px; text-transform: uppercase; letter-spacing: 0.08em; }
      tr:last-child td { border-bottom: none; }
    </style>
  </head>
  <body>
    <main>
      <h1>verify:trust dashboard</h1>
      <div class="meta">
        <div><strong>Checked at:</strong> ${escapeHtml(report.checkedAt)}</div>
        <div><strong>Article count:</strong> ${escapeHtml(report.articleCount)}</div>
        <div><strong>Correction rate:</strong> ${escapeHtml(report.correctionRate)}</div>
      </div>
      <div class="grid">
        <div class="card">
          <div class="label">Author Accountability</div>
          <div class="value ${report.authorAccountability.failed === 0 ? 'ok' : 'fail'}">${escapeHtml(report.authorAccountability.passed)} pass / ${escapeHtml(report.authorAccountability.failed)} fail</div>
        </div>
        <div class="card">
          <div class="label">Source Quality</div>
          <div class="value ${report.sourceQuality.failed === 0 ? 'ok' : 'fail'}">${escapeHtml(report.sourceQuality.passed)} pass / ${escapeHtml(report.sourceQuality.failed)} fail</div>
        </div>
        <div class="card">
          <div class="label">Overall</div>
          <div class="value ${report.ok ? 'ok' : 'fail'}">${report.ok ? 'PASS' : 'FAIL'}</div>
        </div>
      </div>
      <h2>Failures</h2>
      <table>
        <thead>
          <tr>
            <th>File</th>
            <th>Slug</th>
            <th>Gate</th>
            <th>Message</th>
          </tr>
        </thead>
        <tbody>${failureRows}</tbody>
      </table>
    </main>
  </body>
</html>
`;
}

async function readMarkdownEntries(directory) {
  try {
    return (await fs.readdir(directory))
      .filter((entry) => entry.endsWith('.md'))
      .sort((left, right) => left.localeCompare(right))
      .map((fileName) => ({
        fileName,
        filePath: path.join(directory, fileName),
      }));
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') {
      return [];
    }

    throw error;
  }
}

export async function buildTrustReport(contentDirs = DEFAULT_CONTENT_DIRS) {
  const entries = (await Promise.all(contentDirs.map((directory) => readMarkdownEntries(directory)))).flat();
  const authorAccountability = createGateResult('author accountability');
  const sourceQuality = createGateResult('source quality');
  const failures = [];

  for (const { fileName, filePath } of entries) {
    const source = await fs.readFile(filePath, 'utf8');
    const { data } = matter(source);
    const slug = typeof data.slug === 'string' ? data.slug.trim() : fileName.replace(/\.md$/, '');

    try {
      validateAuthorObject(data.author, fileName);
      authorAccountability.passed += 1;
    } catch (error) {
      authorAccountability.failed += 1;
      failures.push({
        fileName,
        slug,
        gate: 'author accountability',
        message: error instanceof Error ? error.message : 'Unknown author validation error.',
      });
    }

    try {
      validatePrimarySources(data.primarySources, fileName);
      sourceQuality.passed += 1;
    } catch (error) {
      sourceQuality.failed += 1;
      failures.push({
        fileName,
        slug,
        gate: 'source quality',
        message: error instanceof Error ? error.message : 'Unknown source validation error.',
      });
    }
  }

  return {
    checkedAt: new Date().toISOString(),
    articleCount: entries.length,
    authorAccountability,
    sourceQuality,
    correctionRate: 'N/A until structured corrections dataset exists',
    failures,
    ok: authorAccountability.failed === 0 && sourceQuality.failed === 0,
  };
}

async function writeDashboard(outputPath, html) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, html, 'utf8');
}

function printTerminalSummary(report, outputPath) {
  console.log('SCAN SUMMARY');
  console.log(`checked_at=${report.checkedAt}`);
  console.log(`article_count=${report.articleCount}`);
  console.log(`author_accountability_pass=${report.authorAccountability.passed}`);
  console.log(`author_accountability_fail=${report.authorAccountability.failed}`);
  console.log(`source_quality_pass=${report.sourceQuality.passed}`);
  console.log(`source_quality_fail=${report.sourceQuality.failed}`);
  console.log(`correction_rate=${report.correctionRate}`);
  console.log(`dashboard=${outputPath}`);

  if (report.failures.length > 0) {
    for (const failure of report.failures) {
      console.log(`FAIL ${failure.gate} ${failure.fileName}: ${failure.message}`);
    }
  } else {
    console.log('PASS all trust gates');
  }
}

export async function main() {
  const blogDir = getArgValue('blog-dir');
  const outputPath = getArgValue('output') || DEFAULT_OUTPUT_PATH;
  const report = await buildTrustReport(blogDir ? [blogDir] : DEFAULT_CONTENT_DIRS);
  const html = renderTrustDashboardHtml(report);

  await writeDashboard(outputPath, html);
  printTerminalSummary(report, outputPath);

  if (!report.ok) {
    process.exitCode = 1;
  }
}

if (import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}
