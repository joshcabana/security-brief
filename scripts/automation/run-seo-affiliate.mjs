#!/usr/bin/env node

import path from 'node:path';
import matter from 'gray-matter';
import {
  DEFAULT_GITHUB_MODELS_MODEL,
  REPO_ROOT,
  listChangedBlogFilesAgainstMain,
  readText,
  runContentManifestCheck,
  runContentManifestWrite,
  writeText,
} from './common.mjs';
import { requestJsonFromGitHubModels } from './github-models.mjs';
import { injectAffiliatePlaceholders, parseAffiliatePlaceholderMap } from './renderers.mjs';
import { finishAutomationRun, prepareAutomationRun, requireEnvVars } from './workflow.mjs';

function validateSeoPayload(payload) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    typeof payload.meta_title !== 'string' ||
    typeof payload.meta_description !== 'string' ||
    !Array.isArray(payload.keywords) ||
    payload.keywords.length !== 5
  ) {
    throw new Error('SEO payload must include meta_title, meta_description, and exactly 5 keywords.');
  }
}

async function main() {
  requireEnvVars(['GITHUB_TOKEN']);

  const context = await prepareAutomationRun({
    kind: 'content',
    schedule: { weekday: 'monday', hour: 15, graceHours: 1 },
  });

  if (context.skipped) {
    return;
  }

  const model = process.env.GITHUB_MODELS_MODEL?.trim() || DEFAULT_GITHUB_MODELS_MODEL;
  const changedFiles = await listChangedBlogFilesAgainstMain();

  if (changedFiles.length === 0) {
    throw new Error('SEO optimiser could not find any blog drafts in the current weekly content branch.');
  }

  const affiliatePrograms = await readText(path.join(REPO_ROOT, 'affiliate-programs.md'));
  const placeholders = parseAffiliatePlaceholderMap(affiliatePrograms);
  const updatedFiles = [];

  for (const relativePath of changedFiles) {
    const filePath = path.join(REPO_ROOT, relativePath);
    const source = await readText(filePath);
    const parsed = matter(source);
    const updates = {};

    if (
      typeof parsed.data.meta_title !== 'string' ||
      typeof parsed.data.meta_description !== 'string' ||
      !Array.isArray(parsed.data.keywords) ||
      parsed.data.keywords.length !== 5
    ) {
      const seo = await requestJsonFromGitHubModels({
        model,
        maxTokens: 1500,
        systemPrompt:
          'You are the SEO metadata optimiser for AI Security Brief. Return strict JSON only. No markdown fences.',
        userPrompt: [
          `Optimise metadata for this AI security article draft.`,
          `Title: ${parsed.data.title}`,
          `Slug: ${parsed.data.slug}`,
          `Excerpt: ${parsed.data.excerpt}`,
          `Body:\n${parsed.content.slice(0, 4000)}`,
          'Return JSON in this shape:',
          '{"meta_title":"string","meta_description":"string","keywords":["one","two","three","four","five"]}',
          'Requirements:',
          '- meta_title 50-60 characters.',
          '- meta_description 150-160 characters.',
          '- exactly 5 focus keywords.',
        ].join('\n'),
        validate: validateSeoPayload,
      });

      updates.meta_title = seo.meta_title;
      updates.meta_description = seo.meta_description;
      updates.keywords = seo.keywords;
    }

    const injected = injectAffiliatePlaceholders(parsed.content, placeholders);
    const nextContent = injected.markdown;
    const nextFrontmatter = {
      ...parsed.data,
      ...updates,
    };
    const nextSource = matter.stringify(nextContent, nextFrontmatter);

    if (nextSource !== source) {
      await writeText(filePath, nextSource);
      updatedFiles.push(
        `${relativePath}${injected.injected.length > 0 ? ` (affiliate mentions: ${injected.injected.join(', ')})` : ''}`,
      );
    }
  }

  if (updatedFiles.length === 0) {
    await finishAutomationRun({
      context,
      commitMessage: `automation: refresh SEO metadata ${context.effectiveDate}`,
      model,
      outputs: ['SEO optimiser found no metadata or affiliate changes to apply.'],
      notes: ['No-op run. Changed weekly drafts were already complete.'],
    });
    return;
  }

  await runContentManifestWrite();
  await runContentManifestCheck();

  await finishAutomationRun({
    context,
    commitMessage: `automation: optimise SEO metadata ${context.effectiveDate}`,
    model,
    outputs: updatedFiles.map((entry) => `Updated: \`${entry}\``),
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
