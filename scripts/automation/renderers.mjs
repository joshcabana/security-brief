#!/usr/bin/env node

import matter from 'gray-matter';
import path from 'node:path';
import { countWords, escapeRegex, FINDING_CATEGORIES, REPO_ROOT, slugify } from './common.mjs';

const CTA_LINE = '**Stay ahead of AI security threats.** Subscribe to the AI Security Brief newsletter for weekly intelligence. [Subscribe now →](/newsletter)';
const NEWSLETTER_ISSUE_PATTERN = /^# Newsletter Issue #(\d+) — AI Security Brief$/m;

const CATEGORY_MAP = {
  Regulation: 'Privacy',
  Attack: 'AI Threats',
  Vulnerability: 'AI Threats',
  Defence: 'AI Threats',
  Incident: 'AI Threats',
  Framework: 'AI Threats',
};

function quote(value) {
  return JSON.stringify(value);
}

function renderFrontmatter(frontmatter) {
  const lines = ['---'];

  for (const [key, value] of Object.entries(frontmatter)) {
    if (Array.isArray(value)) {
      lines.push(`${key}:`);
      for (const item of value) {
        lines.push(`  - ${quote(item)}`);
      }
      continue;
    }

    lines.push(`${key}: ${typeof value === 'boolean' ? String(value) : quote(String(value))}`);
  }

  lines.push('---', '');
  return lines.join('\n');
}

export function validateFindingCategory(value) {
  if (!FINDING_CATEGORIES.includes(value)) {
    throw new Error(`Invalid finding category: ${value}`);
  }
}

export function renderHarvestMarkdown({ date, weekNumber, findings }) {
  const sections = findings.map((finding, index) => {
    validateFindingCategory(finding.category);
    return [
      `### ${index + 1}. ${finding.headline}`,
      `**Summary:** ${finding.summary}`,
      `**Key Implication:** ${finding.implication}`,
      `**Source:** [${finding.source_name}](${finding.source_url})`,
      `**Category:** ${finding.category}`,
      '',
    ].join('\n');
  });

  return [
    renderFrontmatter({
      date,
      week_number: String(weekNumber),
      finding_count: String(findings.length),
    }),
    `# AI Security Harvest — Week of ${date}`,
    '',
    ...sections,
    '---',
    `*Harvested by AI Security Brief on ${date}*`,
    '',
  ].join('\n');
}

export function parseHarvestMarkdown(markdown) {
  const { content } = matter(markdown);
  const pattern = /###\s+\d+\.\s+(.+?)\n\*\*Summary:\*\*\s+(.+?)\n\*\*Key Implication:\*\*\s+(.+?)\n\*\*Source:\*\*\s+\[(.+?)\]\((https?:\/\/[^\s)]+)\)\n\*\*Category:\*\*\s+(.+?)\n/gs;
  const findings = [];
  let match = pattern.exec(content);

  while (match) {
    findings.push({
      headline: match[1].trim(),
      summary: match[2].trim(),
      implication: match[3].trim(),
      source_name: match[4].trim(),
      source_url: match[5].trim(),
      category: match[6].trim(),
    });
    match = pattern.exec(content);
  }

  return findings;
}

export function resolveArticleCategory(findingCategory) {
  return CATEGORY_MAP[findingCategory] ?? 'AI Threats';
}

function calculateReadTime(text) {
  return `${Math.max(5, Math.round(countWords(text) / 180))} min`;
}

export function renderArticleMarkdown({ article, date }) {
  const intro = article.intro.map((paragraph) => paragraph.trim()).join('\n\n');
  const sections = article.sections
    .map((section) => [`## ${section.heading}`, '', ...section.paragraphs.map((paragraph) => paragraph.trim()), ''].join('\n'))
    .join('\n');
  const keyTakeaways = [
    '## Key Takeaways',
    '',
    ...article.key_takeaways.map((item) => `- ${item.trim()}`),
    '',
  ].join('\n');
  const references = [
    '## References',
    '',
    ...article.references.map(
      (reference, index) =>
        `${index + 1}. ${reference.source_name} — ${reference.title}. [${reference.url}](${reference.url})`,
    ),
    '',
  ].join('\n');
  const body = [
    `# ${article.title}`,
    '',
    intro,
    '',
    sections.trim(),
    '',
    keyTakeaways.trim(),
    '',
    references.trim(),
    '',
    CTA_LINE,
    '',
  ].join('\n');

  const frontmatter = renderFrontmatter({
    title: article.title,
    slug: article.slug,
    date,
    author: 'AI Security Brief',
    excerpt: article.excerpt,
    category: article.category,
    featured: false,
    meta_title: article.meta_title,
    meta_description: article.meta_description,
    keywords: article.keywords,
    read_time: calculateReadTime(body),
  });

  return `${frontmatter}${body}`;
}

export function parseAffiliatePlaceholderMap(markdown) {
  const placeholderPattern = /\[AFFILIATE:([A-Z0-9]+)\]\s*→/g;
  const placeholders = new Map();
  let match = placeholderPattern.exec(markdown);

  while (match) {
    placeholders.set(match[1], `[AFFILIATE:${match[1]}]`);
    match = placeholderPattern.exec(markdown);
  }

  return placeholders;
}

export function parseAffiliatePrograms(markdown) {
  const lines = markdown.split('\n');
  const programs = [];

  for (const line of lines) {
    if (!line.startsWith('|') || line.includes('Program') || line.includes('---')) {
      continue;
    }

    const cells = line
      .split('|')
      .map((entry) => entry.trim())
      .filter(Boolean);

    if (cells.length < 3) {
      continue;
    }

    const rawName = cells[1].replace(/\*\*/g, '').trim();
    const placeholderKey = rawName
      .replace(/\s*\(.+?\)/g, '')
      .replace(/\s+/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .toUpperCase();

    programs.push({
      name: rawName,
      placeholderKey,
    });
  }

  return programs;
}

export function injectAffiliatePlaceholders(markdown, placeholders) {
  const replacements = [
    ['NordVPN', 'NORDVPN'],
    ['Proton', 'PROTON'],
    ['Surfshark', 'SURFSHARK'],
    ['1Password', '1PASSWORD'],
    ['Malwarebytes', 'MALWAREBYTES'],
    ['PureVPN', 'PUREVPN'],
    ['CyberGhost', 'CYBERGHOST'],
    ['Jasper AI', 'JASPER'],
    ['Jasper', 'JASPER'],
  ];

  let output = markdown;
  const injected = [];

  for (const [label, key] of replacements) {
    const placeholder = placeholders.get(key);
    if (!placeholder || output.includes(placeholder)) {
      continue;
    }

    const pattern = new RegExp(`\\b${escapeRegex(label)}\\b`, 'i');
    if (!pattern.test(output)) {
      continue;
    }

    output = output.replace(pattern, (match) => `${match} (${placeholder})`);
    injected.push(label);
  }

  return {
    markdown: output,
    injected,
  };
}

export function renderNewsletterDraft({
  date,
  issueNumber,
  subjectLines,
  previewText,
  intro,
  signals,
  toolOfWeek,
  nextWeek,
}) {
  const signalBlocks = signals.map((signal, index) => {
    const block = [
      `### 📡 SIGNAL ${index + 1}: ${signal.headline}`,
      signal.summary,
    ];

    if (signal.article_slug && signal.article_title) {
      block.push(`**[Read the full analysis → ${signal.article_title}](/blog/${signal.article_slug})**`);
    } else if (signal.source_url) {
      block.push(`**[Source → ${signal.source_name}](${signal.source_url})**`);
    }

    return block.join('\n\n');
  });

  const lines = [
    `# Newsletter Issue #${issueNumber} — AI Security Brief`,
    '',
    '## Email Configuration',
    '',
    '**Subject Line A/B Options:**',
    `- **A**: ${subjectLines[0]}`,
    `- **B**: ${subjectLines[1]}`,
    '',
    `**Preview Text:** ${previewText}`,
    '',
    '---',
    '',
    '## Email Body',
    '',
    '### Header',
    '',
    '**AI SECURITY BRIEF**  ',
    '*Intelligence on AI-Powered Threats & Privacy Defence*',
    '',
    `THE BRIEF — ${date} | Issue #${issueNumber}`,
    '',
    '---',
    '',
    ...intro,
    '',
    '---',
    '',
    signalBlocks.join('\n\n---\n\n'),
    '',
    '---',
    '',
    `### 🛡️ TOOL OF THE WEEK: ${toolOfWeek.program_name}`,
    toolOfWeek.description,
    `**[Try ${toolOfWeek.program_name} → ${toolOfWeek.placeholder}](/tools)**`,
    '',
    '---',
    '',
    "### What's Next",
    '',
    ...nextWeek.map((item) => `- ${item}`),
    '',
    '---',
    '',
    '### Stay Sharp',
    '',
    'AI Security Brief publishes every Monday. Forward this to a colleague who should be reading it.',
    '',
    'Was this forwarded to you? **[Subscribe here →](/newsletter)**',
    '',
    '---',
    '',
    '*You’re receiving this because you subscribed to AI Security Brief.*  ',
    '*[Unsubscribe](#) | [Preferences](#) | [View in browser](#)*  ',
    '',
    '*© 2026 AI Security Brief. All rights reserved.*',
    '',
  ];

  return lines.join('\n');
}

export function extractNewsletterIssueNumber(markdown) {
  const match = String(markdown).match(NEWSLETTER_ISSUE_PATTERN);

  if (!match) {
    return null;
  }

  const issueNumber = Number(match[1]);
  return Number.isInteger(issueNumber) && issueNumber > 0 ? issueNumber : null;
}

export function getNextNewsletterIssueNumber({ existingIssueNumbers, currentDraftIssueNumber }) {
  if (Number.isInteger(currentDraftIssueNumber) && currentDraftIssueNumber > 0) {
    return currentDraftIssueNumber;
  }

  const validIssueNumbers = existingIssueNumbers.filter((value) => Number.isInteger(value) && value > 0);
  return validIssueNumbers.length === 0 ? 1 : Math.max(...validIssueNumbers) + 1;
}

function buildDatedSlug(baseSlug, dateString, index = null) {
  return index ? `${baseSlug}-${dateString}-${index}` : `${baseSlug}-${dateString}`;
}

function sortCurrentWeekSlugCandidates(baseSlug, dateString, left, right) {
  const datedSlug = buildDatedSlug(baseSlug, dateString);
  const rank = (slug) => {
    if (slug === baseSlug) {
      return 0;
    }

    if (slug === datedSlug) {
      return 1;
    }

    return 2;
  };

  const numericSuffix = (slug) => {
    const match = slug.match(new RegExp(`^${escapeRegex(datedSlug)}-(\\d+)$`));
    return match ? Number(match[1]) : Number.MAX_SAFE_INTEGER;
  };

  return rank(left.slug) - rank(right.slug) || numericSuffix(left.slug) - numericSuffix(right.slug) || left.slug.localeCompare(right.slug);
}

function listCurrentWeekSlugCandidates(baseSlug, existingArticles, dateString) {
  const datedSlug = buildDatedSlug(baseSlug, dateString);
  const datedPattern = new RegExp(`^${escapeRegex(datedSlug)}(?:-(\\d+))?$`);

  return existingArticles
    .filter((entry) => entry.date === dateString && (entry.slug === baseSlug || datedPattern.test(entry.slug)))
    .sort((left, right) => sortCurrentWeekSlugCandidates(baseSlug, dateString, left, right));
}

function slugExists(slug, existingArticles, reservedSlugs) {
  return reservedSlugs.has(slug) || existingArticles.some((entry) => entry.slug === slug);
}

export function resolveUniqueSlug(baseSlug, existingArticles, reservedSlugs, dateString) {
  const currentWeekCandidate = listCurrentWeekSlugCandidates(baseSlug, existingArticles, dateString).find(
    (entry) => !reservedSlugs.has(entry.slug),
  );

  if (currentWeekCandidate) {
    return currentWeekCandidate.slug;
  }

  if (!slugExists(baseSlug, existingArticles, reservedSlugs)) {
    return baseSlug;
  }

  const datedSlug = buildDatedSlug(baseSlug, dateString);
  if (!slugExists(datedSlug, existingArticles, reservedSlugs)) {
    return datedSlug;
  }

  let index = 2;
  while (slugExists(buildDatedSlug(baseSlug, dateString, index), existingArticles, reservedSlugs)) {
    index += 1;
  }
  return buildDatedSlug(baseSlug, dateString, index);
}

export function buildExpectedArticlePlan(findings, existingArticles, dateString) {
  const reservedSlugs = new Set();
  const existingBaseSlugs = new Set(
    existingArticles.map((entry) => entry.slug.replace(/-\d{4}-\d{2}-\d{2}(?:-\d+)?$/, '')),
  );

  // Filter out findings whose topic already has a published article (dedup).
  // A finding is considered duplicate if its slugified headline matches the base
  // slug of any existing article (ignoring date suffixes added by prior runs).
  const novelFindings = findings.filter((finding) => {
    const baseSlug = slugify(finding.headline);
    return !existingBaseSlugs.has(baseSlug);
  });

  // Fall back to all findings if filtering leaves fewer than 2 (edge case:
  // every harvest finding already has a published article).
  const candidateFindings = novelFindings.length >= 2 ? novelFindings : findings;

  return candidateFindings.slice(0, 2).map((finding) => {
    const baseSlug = slugify(finding.headline);
    const slug = resolveUniqueSlug(baseSlug, existingArticles, reservedSlugs, dateString);
    reservedSlugs.add(slug);

    return {
      slug,
      headline: finding.headline,
      finding,
      category: resolveArticleCategory(finding.category),
      filePath: path.join(REPO_ROOT, 'blog', `${slug}.md`),
    };
  });
}

export function findRedundantCurrentWeekArticleFiles(findings, existingArticles, plannedSlugs, dateString) {
  const stalePaths = new Set();

  for (const finding of findings.slice(0, 2)) {
    const baseSlug = slugify(finding.headline);
    const candidates = listCurrentWeekSlugCandidates(baseSlug, existingArticles, dateString);

    for (const candidate of candidates) {
      if (!plannedSlugs.has(candidate.slug)) {
        stalePaths.add(candidate.filePath);
      }
    }
  }

  return Array.from(stalePaths).sort();
}

export function upsertPerformanceLog(existingMarkdown, row) {
  const lines = existingMarkdown.trimEnd().split('\n');
  const headerLines = lines.filter((line) => !line.startsWith('|') || line.includes('Date') || line.includes('------'));
  const tableRows = lines.filter((line) => line.startsWith('|') && !line.includes('Date') && !line.includes('------'));
  const filteredRows = tableRows.filter((line) => !line.startsWith('| — |'));
  const rowMap = new Map();

  for (const current of filteredRows) {
    const parts = current.split('|').map((entry) => entry.trim());
    const date = parts[1];
    if (date) {
      rowMap.set(date, current);
    }
  }

  rowMap.set(
    row.date,
    `| ${row.date} | ${row.subscribers} | ${row.openRate} | ${row.clickRate} | ${row.topLink} | ${row.alerts} |`,
  );

  const sortedRows = Array.from(rowMap.entries())
    .sort((left, right) => right[0].localeCompare(left[0]))
    .map((entry) => entry[1]);

  return [
    '# AI Security Brief — Performance Log',
    '',
    '| Date | Subscribers | Open Rate | Click Rate | Top Link | Alerts |',
    '|------|------------|-----------|------------|----------|--------|',
    ...sortedRows,
    '',
  ].join('\n');
}
