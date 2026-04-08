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
import { guardedText, requestJsonFromGitHubModels } from './github-models.mjs';
import {
  buildSeoOptimiserContext,
  buildSeoOptimiserPrompts,
} from './prompt-builders.mjs';
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

  const affiliatePrograms = await readText(path.join(REPO_ROOT, 'docs', 'affiliate-programs.md'));
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
      const seoContext = buildSeoOptimiserContext({
        title: String(parsed.data.title),
        slug: String(parsed.data.slug),
        excerpt: String(parsed.data.excerpt),
        bodyExcerpt: parsed.content.slice(0, 4000),
      });
      const prompts = buildSeoOptimiserPrompts({
        title: String(parsed.data.title),
        slug: String(parsed.data.slug),
        excerpt: String(parsed.data.excerpt),
        bodyExcerpt: parsed.content.slice(0, 4000),
      });
      const seo = await requestJsonFromGitHubModels({
        model,
        maxTokens: 1500,
        systemPrompt: prompts.systemPrompt,
        userPrompt: prompts.userPrompt,
        guardedText: guardedText(seoContext),
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
      allowedPaths: ['blog', 'content-manifest.json'],
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
    allowedPaths: ['blog', 'content-manifest.json'],
    outputs: updatedFiles.map((entry) => `Updated: \`${entry}\``),
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
