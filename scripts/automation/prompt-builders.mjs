/**
 * @param {{
 *   effectiveDate: string,
 *   articlePlan: Array<{ slug: string, category: string, headline: string }>,
 *   harvestSourcePack: string,
 * }} input
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildArticleFactoryPrompts(input) {
  return {
    systemPrompt:
      'You are the article generation engine for AI Security Brief. Return strict JSON only. No markdown fences. Use only the supplied weekly harvest source pack. Do not cite URLs that are not in the source pack. Every article must include a named human author object and explicit primary sources. Brand-level bylines are forbidden.',
    userPrompt: [
      `Write 2 AI-assisted security briefings for ${input.effectiveDate}.`,
      'Use these exact target slugs and topics:',
      ...input.articlePlan.map(
        (item) => `- slug: ${item.slug} | category: ${item.category} | finding: ${item.headline}`,
      ),
      '',
      'Weekly harvest source pack:',
      input.harvestSourcePack,
      '',
      'Return JSON in this shape:',
      '{"articles":[{"slug":"string","title":"string","excerpt":"string","meta_title":"string","meta_description":"string","keywords":["a","b","c","d","e"],"author":{"name":"Josh Cabana","role":"Editor & Publisher","profileUrl":"https://...","bio":"optional"},"intro":["paragraph"],"sections":[{"heading":"string","paragraphs":["paragraph","paragraph"]}],"key_takeaways":["item"],"primarySources":[{"url":"https://...","title":"string","date":"optional","excerpt":"optional"}]}]}',
      'Requirements:',
      '- Exactly 2 articles.',
      '- Each article should render to roughly 950-1200 words after markdown rendering.',
      '- The author object is required on every article. Use the named human byline Josh Cabana with the role Editor & Publisher unless explicitly instructed otherwise. Do not use AI Security Brief or any brand name as the author.',
      '- Intro must contain exactly 2 substantial paragraphs.',
      '- 4 or 5 H2 sections.',
      '- Every section must contain exactly 2 substantial paragraphs.',
      '- 4 to 5 key takeaways.',
      '- Include at least 3 primarySources, and every primary source URL must come from the weekly harvest source pack.',
      '- Keep tone authoritative, data-driven, and written for tech professionals and IT decision-makers.',
      '- Do not invent statistics or sources. When the source pack is sparse, prefer careful analysis and defensive guidance over unsupported claims.',
      '- The rendered article template appends one newsletter CTA using the exact path pattern /newsletter?source=article-<slug>-cta. Write body copy that leads naturally into that CTA and do not add extra CTA blocks or promotional sections.',
    ].join('\n'),
  };
}

/**
 * @param {{
 *   effectiveDate: string,
 *   issueNumber: number,
 *   harvestFindings: Array<{ headline: string, summary: string, source_name: string, source_url: string }>,
 *   datedArticles: Array<{ slug: string, title: string, excerpt: string }>,
 *   selectedProgram: { name: string },
 *   toolPlaceholder: string,
 * }} input
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildNewsletterCompilerPrompts(input) {
  return {
    systemPrompt:
      'You are the newsletter editor for AI Security Brief. Return strict JSON only. No markdown fences. Do not publish or reference any email platform UI.',
    userPrompt: [
      `Compile the weekly newsletter draft for ${input.effectiveDate}.`,
      `Issue number: ${input.issueNumber}.`,
      `Top three weekly findings:\n${input.harvestFindings
        .slice(0, 3)
        .map((finding, index) => `${index + 1}. ${finding.headline} - ${finding.summary}`)
        .join('\n')}`,
      `Article drafts:\n${input.datedArticles
        .slice(0, 2)
        .map((article) => `- ${article.title} (/blog/${article.slug}) - ${article.excerpt}`)
        .join('\n')}`,
      `Signals 1 and 2 must use these exact article fields in this order:\n1. article_slug=${input.datedArticles[0].slug} | article_title=${input.datedArticles[0].title}\n2. article_slug=${input.datedArticles[1].slug} | article_title=${input.datedArticles[1].title}`,
      `If Signal 3 cites a source instead of an article, it must use one of these exact source pairs:\n${input.harvestFindings
        .slice(0, 3)
        .map((finding) => `- source_name=${finding.source_name} | source_url=${finding.source_url}`)
        .join('\n')}`,
      `Tool of the week: ${input.selectedProgram.name} with placeholder ${input.toolPlaceholder}`,
      'Return JSON in this shape:',
      '{"subject_lines":["string","string"],"preview_text":"string","intro":["paragraph","paragraph"],"signals":[{"headline":"string","summary":"string","article_slug":"string|null","article_title":"string|null","source_name":"string|null","source_url":"https://...|null"}],"tool_of_week":{"program_name":"string","description":"string","placeholder":"[AFFILIATE:KEY]"},"next_week":["item","item","item"]}',
      'Requirements:',
      '- Exactly 3 signals.',
      '- Signals 1 and 2 must link to the two current article drafts using the exact slug and title pairs listed above.',
      '- Signal 3 may link to a source URL if there is no draft article, but the source_name and source_url must be copied exactly from the allowed harvest source pairs above.',
      '- Keep the preview text under 150 characters.',
      '- Keep subject lines under 50 characters.',
      '- Subject line A and subject line B must use deliberately different angles rather than minor wording variations.',
      '- Frame the article CTAs as the main analysis for the week and the tool CTA as the practical follow-through for readers who want to act on the briefing.',
    ].join('\n'),
  };
}

/**
 * @param {{
 *   title: string,
 *   slug: string,
 *   excerpt: string,
 *   bodyExcerpt: string,
 * }} input
 * @returns {{ systemPrompt: string, userPrompt: string }}
 */
export function buildSeoOptimiserPrompts(input) {
  return {
    systemPrompt:
      'You are the SEO metadata optimiser for AI Security Brief, an elite enterprise B2B threat intelligence platform. Return strict JSON only. No markdown fences.',
    userPrompt: [
      'Optimise metadata for this AI security article draft.',
      `Title: ${input.title}`,
      `Slug: ${input.slug}`,
      `Excerpt: ${input.excerpt}`,
      `Body:\n${input.bodyExcerpt}`,
      'Return JSON in this shape:',
      '{"meta_title":"string","meta_description":"string","keywords":["one","two","three","four","five"]}',
      'Requirements:',
      '- meta_title 50-60 characters.',
      '- meta_description 150-160 characters.',
      '- exactly 5 focus keywords.',
      '- Target enterprise B2B decision makers (CISOs, SecOps leads). Focus keywords must reflect high-intent enterprise security terms, NOT consumer terms.',
      "- Preserve the article's internal-link strategy and affiliate-placeholder behavior. Do not suggest removing or rewriting internal links or affiliate placeholders.",
    ].join('\n'),
  };
}
