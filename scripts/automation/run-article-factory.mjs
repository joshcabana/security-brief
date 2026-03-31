#!/usr/bin/env node

import path from 'node:path';
import { promises as fs } from 'node:fs';
import matter from 'gray-matter';
import {
  DEFAULT_GITHUB_MODELS_MODEL,
  REPO_ROOT,
  countWords,
  fileExists,
  readText,
  runContentManifestCheck,
  runContentManifestWrite,
  writeText,
} from './common.mjs';
import { requestJsonFromGitHubModels } from './github-models.mjs';
import {
  buildExpectedArticlePlan,
  findRedundantCurrentWeekArticleFiles,
  parseHarvestMarkdown,
  renderArticleMarkdown,
} from './renderers.mjs';
import { finishAutomationRun, prepareAutomationRun, requireEnvVars } from './workflow.mjs';

function validateArticlePayload(payload, expectedSlugs, allowedReferences) {
  if (!payload || typeof payload !== 'object' || !Array.isArray(payload.articles) || payload.articles.length !== 2) {
    throw new Error('Article payload must contain exactly 2 articles.');
  }

  const slugs = new Set();

  for (const article of payload.articles) {
    if (
      typeof article?.slug !== 'string' ||
      typeof article?.title !== 'string' ||
      typeof article?.excerpt !== 'string' ||
      typeof article?.meta_title !== 'string' ||
      typeof article?.meta_description !== 'string' ||
      !Array.isArray(article?.keywords) ||
      !Array.isArray(article?.intro) ||
      !Array.isArray(article?.sections) ||
      !Array.isArray(article?.key_takeaways) ||
      !Array.isArray(article?.references)
    ) {
      throw new Error('Article payload is missing required fields.');
    }

    if (!expectedSlugs.has(article.slug)) {
      throw new Error(`Unexpected article slug: ${article.slug}`);
    }

    if (slugs.has(article.slug)) {
      throw new Error(`Duplicate article slug returned: ${article.slug}`);
    }
    slugs.add(article.slug);

    if (article.keywords.length !== 5) {
      throw new Error(`Article ${article.slug} must include exactly 5 keywords.`);
    }

    if (article.sections.length < 4 || article.sections.length > 5) {
      throw new Error(`Article ${article.slug} must include 4 or 5 sections.`);
    }

    for (const section of article.sections) {
      if (
        typeof section?.heading !== 'string' ||
        !Array.isArray(section?.paragraphs) ||
        section.paragraphs.length < 2
      ) {
        throw new Error(`Article ${article.slug} must include sections with headings and at least 2 paragraphs.`);
      }
    }

    if (article.references.length < 4) {
      throw new Error(`Article ${article.slug} must include at least 4 references.`);
    }

    for (const reference of article.references) {
      if (
        typeof reference?.title !== 'string' ||
        typeof reference?.source_name !== 'string' ||
        typeof reference?.url !== 'string' ||
        !/^https?:\/\//.test(reference.url)
      ) {
        throw new Error(`Article ${article.slug} contains an invalid reference.`);
      }

      if (!allowedReferences.has(reference.url)) {
        throw new Error(`Article ${article.slug} cited a reference outside the current harvest: ${reference.url}`);
      }
    }
  }
}

async function main() {
  requireEnvVars(['GITHUB_TOKEN']);

  const context = await prepareAutomationRun({
    kind: 'content',
    schedule: { weekday: 'monday', hour: 9, graceHours: 1 },
  });

  if (context.skipped) {
    return;
  }

  const model = process.env.GITHUB_MODELS_MODEL?.trim() || 'openai/gpt-4.1';
  const harvestPath = path.join(REPO_ROOT, 'harvests', `harvest-${context.effectiveDate}.md`);

  if (!(await fileExists(harvestPath))) {
    throw new Error(`Missing prerequisite harvest file: harvests/harvest-${context.effectiveDate}.md`);
  }

  const harvestMarkdown = await readText(harvestPath);
  const findings = parseHarvestMarkdown(harvestMarkdown);
  if (findings.length < 2) {
    throw new Error(`Harvest file ${path.basename(harvestPath)} does not contain enough findings to draft articles.`);
  }

  const existingArticleFiles = (await fs.readdir(path.join(REPO_ROOT, 'blog'))).filter((entry) => entry.endsWith('.md'));
  const existingArticles = await Promise.all(
    existingArticleFiles.map(async (entry) => {
      const filePath = path.join(REPO_ROOT, 'blog', entry);
      const parsed = matter(await readText(filePath));

      return {
        slug: typeof parsed.data.slug === 'string' ? String(parsed.data.slug) : entry.replace(/\.md$/, ''),
        date: typeof parsed.data.date === 'string' ? String(parsed.data.date) : '',
        filePath,
      };
    }),
  );
  const articlePlan = buildExpectedArticlePlan(findings, existingArticles, context.effectiveDate);
  const plannedSlugs = new Set(articlePlan.map((item) => item.slug));
  const staleDuplicateFiles = findRedundantCurrentWeekArticleFiles(
    findings,
    existingArticles,
    plannedSlugs,
    context.effectiveDate,
  );
  const existingTargets = await Promise.all(articlePlan.map(async (item) => fileExists(item.filePath)));

  if (existingTargets.every(Boolean) && !context.options.force) {
    if (staleDuplicateFiles.length > 0) {
      for (const stalePath of staleDuplicateFiles) {
        await fs.unlink(stalePath);
      }
      await runContentManifestWrite();
      await runContentManifestCheck();

      await finishAutomationRun({
        context,
        commitMessage: `automation: refresh articles ${context.effectiveDate}`,
        model,
        outputs: staleDuplicateFiles.map((stalePath) => `Removed stale duplicate: \`${path.relative(REPO_ROOT, stalePath)}\``),
        notes: ['Removed redundant same-week article drafts without regenerating content.'],
      });
      return;
    }

    await finishAutomationRun({
      context,
      commitMessage: `automation: refresh articles ${context.effectiveDate}`,
      model,
      outputs: articlePlan.map((item) => `Article already exists: \`blog/${item.slug}.md\``),
      notes: ['No-op run. Weekly article files are already present.'],
    });
    return;
  }

  const expectedSlugs = plannedSlugs;
  const allowedReferences = new Set(findings.map((finding) => finding.source_url));
  const harvestSourcePack = findings
    .map(
      (finding, index) => [
        `${index + 1}. ${finding.headline}`,
        `Category: ${finding.category}`,
        `Summary: ${finding.summary}`,
        `Implication: ${finding.implication}`,
        `Source: ${finding.source_name}`,
        `URL: ${finding.source_url}`,
      ].join('\n'),
    )
    .join('\n\n');

  const payload = await requestJsonFromGitHubModels({
    model,
    maxTokens: 7000,
    systemPrompt:
      'You are the article generation engine for AI Security Brief. Return strict JSON only. No markdown fences. Use only the supplied weekly harvest source pack. Do not cite URLs that are not in the source pack.',
    userPrompt: [
      `Write 2 SEO-ready AI security articles for ${context.effectiveDate}.`,
      'Use these exact target slugs and topics:',
      ...articlePlan.map((item) => `- slug: ${item.slug} | category: ${item.category} | finding: ${item.headline}`),
      '',
      'Weekly harvest source pack:',
      harvestSourcePack,
      '',
      'Return JSON in this shape:',
      '{"articles":[{"slug":"string","title":"string","excerpt":"string","meta_title":"string","meta_description":"string","keywords":["a","b","c","d","e"],"intro":["paragraph"],"sections":[{"heading":"string","paragraphs":["paragraph","paragraph"]}],"key_takeaways":["item"],"references":[{"source_name":"string","title":"string","url":"https://..."}]}]}',
      'Requirements:',
      '- Exactly 2 articles.',
      '- Each article should render to roughly 950-1200 words after markdown rendering.',
      '- Intro must contain exactly 2 substantial paragraphs.',
      '- 4 or 5 H2 sections.',
      '- Every section must contain exactly 2 substantial paragraphs.',
      '- 4 to 5 key takeaways.',
      '- Include 4 or 5 references, and every reference URL must come from the weekly harvest source pack.',
      '- Keep tone authoritative, data-driven, and written for tech professionals and IT decision-makers.',
      '- Do not invent statistics or sources. When the source pack is sparse, prefer careful analysis and defensive guidance over unsupported claims.',
    ].join('\n'),
    validate: (value) => validateArticlePayload(value, expectedSlugs, allowedReferences),
  });

  const outputs = [];

  for (const generated of payload.articles) {
    const planned = articlePlan.find((item) => item.slug === generated.slug);
    if (!planned) {
      throw new Error(`Generated article did not match the article plan: ${generated.slug}`);
    }

    const markdown = renderArticleMarkdown({
      date: context.effectiveDate,
      article: {
        ...generated,
        category: planned.category,
      },
    });

    if (countWords(markdown) < 850) {
      throw new Error(`Generated article ${generated.slug} is too short after rendering.`);
    }

    await writeText(planned.filePath, markdown);
    outputs.push(`Article generated: \`blog/${planned.slug}.md\``);
  }

  for (const stalePath of staleDuplicateFiles) {
    await fs.unlink(stalePath);
    outputs.push(`Removed stale duplicate: \`${path.relative(REPO_ROOT, stalePath)}\``);
  }

  await runContentManifestWrite();
  await runContentManifestCheck();

  await finishAutomationRun({
    context,
    commitMessage: `automation: add weekly articles ${context.effectiveDate}`,
    model,
    outputs,
    notes: context.options.force ? ['Forced regeneration requested. Existing article drafts were overwritten.'] : [],
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
