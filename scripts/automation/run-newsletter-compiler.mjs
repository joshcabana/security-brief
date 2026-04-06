#!/usr/bin/env node

import path from 'node:path';
import { promises as fs } from 'node:fs';
import matter from 'gray-matter';
import {
  DEFAULT_GITHUB_MODELS_MODEL,
  REPO_ROOT,
  fileExists,
  readText,
  writeText,
} from './common.mjs';
import { requestJsonFromGitHubModels } from './github-models.mjs';
import {
  extractNewsletterIssueNumber,
  getNextNewsletterIssueNumber,
  parseAffiliatePrograms,
  parseAffiliatePlaceholderMap,
  parseHarvestMarkdown,
  renderNewsletterDraft,
} from './renderers.mjs';
import { finishAutomationRun, prepareAutomationRun, requireEnvVars } from './workflow.mjs';

function validateNewsletterPayload(payload, validArticleMap, validHarvestSourceMap) {
  if (
    !payload ||
    typeof payload !== 'object' ||
    !Array.isArray(payload.subject_lines) ||
    payload.subject_lines.length !== 2 ||
    typeof payload.preview_text !== 'string' ||
    !Array.isArray(payload.intro) ||
    !Array.isArray(payload.signals) ||
    payload.signals.length !== 3 ||
    !payload.tool_of_week ||
    !Array.isArray(payload.next_week) ||
    payload.next_week.length < 2
  ) {
    throw new Error('Newsletter payload is missing required fields.');
  }

  if (!payload.tool_of_week || typeof payload.tool_of_week.description !== 'string') {
    throw new Error('Newsletter payload must include a valid tool_of_week block.');
  }

  const firstTwoSignals = payload.signals.slice(0, 2);
  const seenArticleSlugs = new Set();
  for (const signal of firstTwoSignals) {
    if (
      typeof signal?.article_slug !== 'string' ||
      typeof signal?.article_title !== 'string' ||
      !validArticleMap.has(signal.article_slug)
    ) {
      throw new Error('The first two newsletter signals must reference the current weekly article drafts.');
    }

    if (seenArticleSlugs.has(signal.article_slug)) {
      throw new Error('The first two newsletter signals must reference two distinct weekly article drafts.');
    }
    seenArticleSlugs.add(signal.article_slug);

    const expectedTitle = validArticleMap.get(signal.article_slug)?.title;
    if (expectedTitle && expectedTitle !== signal.article_title) {
      throw new Error(`Newsletter signal title mismatch for ${signal.article_slug}.`);
    }
  }

  const thirdSignal = payload.signals[2];
  if (thirdSignal?.source_url !== null && thirdSignal?.source_url !== undefined) {
    if (
      typeof thirdSignal.source_url !== 'string' ||
      typeof thirdSignal.source_name !== 'string' ||
      !validHarvestSourceMap.has(thirdSignal.source_url)
    ) {
      throw new Error('Signal 3 may only cite a source URL from the current weekly harvest.');
    }

    const expectedSourceName = validHarvestSourceMap.get(thirdSignal.source_url)?.source_name;
    if (expectedSourceName && expectedSourceName !== thirdSignal.source_name) {
      throw new Error(`Signal 3 source_name mismatch for ${thirdSignal.source_url}.`);
    }
  }
}

async function main() {
  requireEnvVars(['GITHUB_TOKEN']);

  const context = await prepareAutomationRun({
    kind: 'content',
    schedule: { weekday: 'monday', hour: 13, graceHours: 1 },
  });

  if (context.skipped) {
    return;
  }

  const model = process.env.GITHUB_MODELS_MODEL?.trim() || 'openai/gpt-4.1';
  const harvestPath = path.join(REPO_ROOT, 'harvests', `harvest-${context.effectiveDate}.md`);
  const draftPath = path.join(REPO_ROOT, 'drafts', `newsletter-${context.effectiveDate}.md`);

  if (!(await fileExists(harvestPath))) {
    throw new Error(`Missing prerequisite harvest file: harvests/harvest-${context.effectiveDate}.md`);
  }

  if ((await fileExists(draftPath)) && !context.options.force) {
    await finishAutomationRun({
      context,
      commitMessage: `automation: refresh newsletter draft ${context.effectiveDate}`,
      model,
      outputs: [`Newsletter draft already exists: \`drafts/newsletter-${context.effectiveDate}.md\``],
      notes: ['No-op run. Weekly newsletter draft is already present.'],
    });
    return;
  }

  const blogDirectory = path.join(REPO_ROOT, 'blog');
  const articleFiles = (await fs.readdir(blogDirectory)).filter((entry) => entry.endsWith('.md')).sort();
  const datedArticles = [];

  for (const fileName of articleFiles) {
    const source = await readText(path.join(blogDirectory, fileName));
    const parsed = matter(source);
    if (parsed.data?.date === context.effectiveDate) {
      datedArticles.push({
        slug: String(parsed.data.slug),
        title: String(parsed.data.title),
        excerpt: String(parsed.data.excerpt),
        path: `blog/${fileName}`,
      });
    }
  }

  if (datedArticles.length < 2) {
    throw new Error(`Newsletter compiler requires 2 dated article drafts for ${context.effectiveDate}.`);
  }

  const articleMap = new Map(datedArticles.map((article) => [article.slug, article]));

  const harvestFindings = parseHarvestMarkdown(await readText(harvestPath));
  const harvestSourceMap = new Map(harvestFindings.map((finding) => [finding.source_url, finding]));
  const affiliatePrograms = await readText(path.join(REPO_ROOT, 'affiliate-programs.md'));
  const placeholders = parseAffiliatePlaceholderMap(affiliatePrograms);
  const programs = parseAffiliatePrograms(affiliatePrograms);
  const selectedProgram = programs[(Number(context.identity.weekKey.split('-')[1]) - 1) % programs.length];
  const toolPlaceholder = selectedProgram ? placeholders.get(selectedProgram.placeholderKey) : null;

  if (!toolPlaceholder || !selectedProgram) {
    throw new Error('Affiliate program rotation could not be resolved from affiliate-programs.md');
  }

  const draftFiles = (await fs.readdir(path.join(REPO_ROOT, 'drafts'))).filter((entry) => entry.startsWith('newsletter-') && entry.endsWith('.md'));
  const existingIssueNumbers = [];
  const publishedIssuePath = path.join(REPO_ROOT, 'newsletter-issue-001.md');

  if (await fileExists(publishedIssuePath)) {
    const publishedIssueNumber = extractNewsletterIssueNumber(await readText(publishedIssuePath));

    if (!publishedIssueNumber) {
      throw new Error('Published newsletter issue numbering could not be parsed from newsletter-issue-001.md.');
    }

    existingIssueNumbers.push(publishedIssueNumber);
  }

  let currentDraftIssueNumber = null;

  for (const draftFile of draftFiles) {
    const draftFilePath = path.join(REPO_ROOT, 'drafts', draftFile);
    const draftIssueNumber = extractNewsletterIssueNumber(await readText(draftFilePath));

    if (!draftIssueNumber) {
      throw new Error(`Existing draft issue numbering could not be parsed from drafts/${draftFile}.`);
    }

    existingIssueNumbers.push(draftIssueNumber);

    if (draftFilePath === draftPath) {
      currentDraftIssueNumber = draftIssueNumber;
    }
  }

  const issueNumber = getNextNewsletterIssueNumber({
    existingIssueNumbers,
    currentDraftIssueNumber,
  });

  const payload = await requestJsonFromGitHubModels({
    model,
    maxTokens: 4500,
    systemPrompt:
      'You are the newsletter editor for AI Security Brief. Return strict JSON only. No markdown fences. Do not publish or reference any email platform UI.',
    userPrompt: [
      `Compile the weekly newsletter draft for ${context.effectiveDate}.`,
      `Issue number: ${issueNumber}.`,
      `Top three weekly findings:\n${harvestFindings.slice(0, 3).map((finding, index) => `${index + 1}. ${finding.headline} — ${finding.summary}`).join('\n')}`,
      `Article drafts:\n${datedArticles.slice(0, 2).map((article) => `- ${article.title} (/blog/${article.slug}) — ${article.excerpt}`).join('\n')}`,
      `Signals 1 and 2 must use these exact article fields in this order:\n1. article_slug=${datedArticles[0].slug} | article_title=${datedArticles[0].title}\n2. article_slug=${datedArticles[1].slug} | article_title=${datedArticles[1].title}`,
      `If Signal 3 cites a source instead of an article, it must use one of these exact source pairs:\n${harvestFindings.slice(0, 3).map((finding) => `- source_name=${finding.source_name} | source_url=${finding.source_url}`).join('\n')}`,
      `Tool of the week: ${selectedProgram.name} with placeholder ${toolPlaceholder}`,
      'Return JSON in this shape:',
      '{"subject_lines":["string","string"],"preview_text":"string","intro":["paragraph","paragraph"],"signals":[{"headline":"string","summary":"string","article_slug":"string|null","article_title":"string|null","source_name":"string|null","source_url":"https://...|null"}],"tool_of_week":{"program_name":"string","description":"string","placeholder":"[AFFILIATE:KEY]"},"next_week":["item","item","item"]}',
      'Requirements:',
      '- Exactly 3 signals.',
      '- Signals 1 and 2 must link to the two current article drafts using the exact slug and title pairs listed above.',
      '- Signal 3 may link to a source URL if there is no draft article, but the source_name and source_url must be copied exactly from the allowed harvest source pairs above.',
      '- Keep the preview text under 150 characters.',
      '- Keep subject lines under 50 characters.',
    ].join('\n'),
    validate: (value) => validateNewsletterPayload(value, articleMap, harvestSourceMap),
  });

  const draft = renderNewsletterDraft({
    date: context.effectiveDate,
    issueNumber,
    subjectLines: payload.subject_lines,
    previewText: payload.preview_text,
    intro: payload.intro,
    signals: payload.signals,
    toolOfWeek: {
      ...payload.tool_of_week,
      program_name: selectedProgram.name,
      placeholder: toolPlaceholder,
    },
    nextWeek: payload.next_week,
  });

  await writeText(draftPath, draft);

  await finishAutomationRun({
    context,
    commitMessage: `automation: add newsletter draft ${context.effectiveDate}`,
    model,
    outputs: [`Newsletter draft generated: \`drafts/newsletter-${context.effectiveDate}.md\``],
    notes: context.options.force ? ['Forced regeneration requested. Existing newsletter draft was overwritten.'] : [],
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
