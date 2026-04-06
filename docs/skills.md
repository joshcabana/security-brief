# Perplexity Computer Skills — AI Security Brief

> Legacy reference only. Production automation now runs through GitHub Actions + GitHub Models. Do not use these Computer skills as the live weekly pipeline.
>
> 5 reusable skills for the AI Security Brief content pipeline.  
> Copy each skill's text block and paste it into **Computer → Skills → Create Skill**.

---

## SKILL 1 — Weekly AI Security Harvest

**Name:** `weekly-ai-security-harvest`

**Description:** Deep research the top 5-7 AI security and privacy developments from the past 7 days. Structure findings as headline, summary, key implication, and source URL. Save output as a markdown harvest file to the GitHub repo ai-security-brief /harvests/ folder.

**Instructions:**

```
---
name: weekly-ai-security-harvest
description: Deep research the top 5-7 AI security and privacy developments from the past 7 days. Structure findings as headline, summary, key implication, and source URL. Save output as a markdown harvest file to the GitHub repo ai-security-brief /harvests/ folder.
metadata:
  author: ai-security-brief
  version: '1.0'
---

# Weekly AI Security Harvest

## When to Use This Skill

Use this skill every Monday (or on manual trigger) to gather the latest AI security and privacy intelligence for the week.

## Instructions

1. **Research Phase**: Use search_web to find the top 5-7 AI security and privacy developments from the past 7 days. Focus on:
   - AI-powered cyberattacks (new techniques, incidents, threat reports)
   - AI model vulnerabilities (prompt injection, jailbreaks, data poisoning)
   - Privacy regulation updates (global, with emphasis on Australia, EU, US)
   - AI security tools and defences (new releases, updates, research)
   - Enterprise AI security incidents (breaches, exploits, advisories)
   - Agentic AI security developments (frameworks, standards, vulnerabilities)

2. **Structure each finding as:**
   ```
   ### [NUMBER]. [HEADLINE]
   **Summary:** [2-sentence summary of the development]
   **Key Implication:** [1 sentence on what this means for security professionals]
   **Source:** [Source name](URL)
   **Category:** [One of: Attack, Vulnerability, Regulation, Defence, Incident, Framework]
   ```

3. **Quality filters:**
   - Only include developments from the past 7 days
   - Prioritise authoritative sources (vendor threat reports, government advisories, peer-reviewed research, major tech publications)
   - Verify each source URL is accessible and real
   - Rank findings by severity/impact (highest first)

4. **Save the file:**
   - Filename format: `harvest-YYYY-MM-DD.md` (use today's date)
   - Include a YAML frontmatter block with: date, week_number, finding_count
   - Push to the GitHub repo `ai-security-brief` in the `/harvests/` folder
   - Use the GitHub MCP tools: first call list_external_tools to find the GitHub connector, then use create_or_update_file to push the file

5. **Output template:**
   ```markdown
   ---
   date: YYYY-MM-DD
   week_number: [ISO week number]
   finding_count: [number]
   ---

   # AI Security Harvest — Week of [DATE]

   [FINDINGS 1-7 using the structure above]

   ---
   *Harvested by AI Security Brief on [DATE]*
   ```
```

---

## SKILL 2 — Article Factory

**Name:** `article-factory`

**Description:** Read the latest harvest file from /harvests/ in the ai-security-brief GitHub repo. Write 2 x 950-word SEO articles on the top 2 findings. Format as markdown with SEO metadata, 4 real citations, Key Takeaways, and newsletter CTA. Push to /blog/ in the GitHub repo.

**Instructions:**

```
---
name: article-factory
description: Read the latest harvest file from /harvests/ in the ai-security-brief GitHub repo. Write 2 x 950-word SEO articles on the top 2 findings. Format as markdown with SEO metadata, 4 real citations, Key Takeaways, and newsletter CTA. Push to /blog/ in the GitHub repo.
metadata:
  author: ai-security-brief
  version: '1.0'
---

# Article Factory

## When to Use This Skill

Use this skill after the Weekly AI Security Harvest has run, to produce blog content from the latest findings.

## Instructions

1. **Read the latest harvest:**
   - Use GitHub MCP tools to list files in the `ai-security-brief` repo's `/harvests/` folder
   - Read the most recent `harvest-YYYY-MM-DD.md` file
   - Identify the top 2 findings (highest severity/impact)

2. **For each of the 2 findings, write a 950-word article:**

   a. **Deep research**: Use search_web to gather additional context, data, statistics, and expert quotes on the topic. Find 4 real, authoritative sources with actual URLs.

   b. **Article structure:**
      - YAML frontmatter: title, slug, date, author ("AI Security Brief"), excerpt, meta_title (50-60 chars), meta_description (150-160 chars), keywords (5 focus keywords), read_time
      - Engaging intro hook (2-3 sentences)
      - 4-5 H2 sections with substantive content
      - Bold key statistics and findings
      - "Key Takeaways" section (4-5 bullet points)
      - 4 numbered citations with real URLs
      - Newsletter CTA: "**Stay ahead of AI security threats.** Subscribe to the AI Security Brief newsletter for weekly intelligence. [Subscribe now →](/newsletter)"

   c. **Tone**: Authoritative, edgy, data-driven. Write for tech professionals and IT decision-makers.

   d. **Slug format**: `kebab-case-topic-name.md`

3. **Push articles to GitHub:**
   - Save each article to `/blog/` in the `ai-security-brief` repo
   - Use GitHub MCP create_or_update_file for each article
   - Commit message: "Add articles: [article-1-slug], [article-2-slug]"

4. **Output summary**: List the 2 article titles, slugs, word counts, and the harvest file they were based on.
```

---

## SKILL 3 — Newsletter Compiler

**Name:** `newsletter-compiler`

**Description:** Read the latest /harvests/ file and 2 newest /blog/ posts from the ai-security-brief GitHub repo. Compile a newsletter draft using newsletter-issue-001.md as a template. Insert affiliate placeholders from affiliate-programs.md. Save as /drafts/newsletter-[DATE].md. Do NOT publish.

**Instructions:**

```
---
name: newsletter-compiler
description: Read the latest /harvests/ file and 2 newest /blog/ posts from the ai-security-brief GitHub repo. Compile a newsletter draft using newsletter-issue-001.md as a template. Insert affiliate placeholders from affiliate-programs.md. Do NOT publish.
metadata:
  author: ai-security-brief
  version: '1.0'
---

# Newsletter Compiler

## When to Use This Skill

Use this skill after Article Factory has run, to compile a newsletter draft from the latest content.

## Instructions

1. **Gather inputs from GitHub repo `ai-security-brief`:**
   - Read the latest file in `/harvests/` (the weekly harvest)
   - Read the 2 newest files in `/blog/` (the articles just created)
   - Read `newsletter-issue-001.md` (the template)
   - Read `affiliate-programs.md` (for affiliate placeholders)

2. **Compile the newsletter draft using this structure:**

   ```markdown
   # Newsletter Issue #[NUMBER] — AI Security Brief

   ## Email Configuration

   **Subject Line A/B Options:**
   - **A**: [Compelling subject line based on top story — under 50 chars]
   - **B**: [Alternative angle — under 50 chars]

   **Preview Text:** [1-sentence preview summarising the 3 signals — under 150 chars]

   ---

   ## Email Body

   [HEADER — same as template]

   THE BRIEF — [DATE] | Issue #[NUMBER]

   ---

   [INTRO — 2-3 sentences contextualising this week's developments]

   ---

   ### 📡 SIGNAL 1: [Top harvest finding headline]
   [3-4 sentence summary with key stat in bold]
   **[Read the full analysis → Article Title](/blog/slug)**

   ---

   ### 📡 SIGNAL 2: [Second harvest finding headline]
   [3-4 sentence summary with key stat in bold]
   **[Read the full analysis → Article Title](/blog/slug)**

   ---

   ### 📡 SIGNAL 3: [Third harvest finding — may not have a full article]
   [3-4 sentence summary with key stat in bold]
   [Source link if no full article]

   ---

   ### 🛡️ TOOL OF THE WEEK: [Rotate through affiliate-programs.md]
   [2-3 sentence description of the tool and why it's relevant this week]
   **[Try [Tool Name] → [AFFILIATE:TOOLNAME]](/tools)**

   ---

   [CLOSING + NEXT WEEK PREVIEW]
   [SUBSCRIBE CTA + FOOTER — same as template]
   ```

3. **Affiliate rotation:** Cycle through the 8 programs in affiliate-programs.md. Use the placeholder format `[AFFILIATE:TOOLNAME]` so links can be replaced before publishing.

4. **Save draft:**
   - Filename: `newsletter-YYYY-MM-DD.md`
   - Push to `/drafts/` folder in GitHub repo
   - Do NOT publish to Beehiiv — this is a draft for human review

5. **Output**: Confirm the draft was saved, list the 3 signals and Tool of the Week selected.
```

---

## SKILL 4 — SEO + Affiliate Optimizer

**Name:** `seo-affiliate-optimizer`

**Description:** Scan all /blog/ markdown files in the ai-security-brief GitHub repo that are missing SEO metadata. Add meta title, meta description, and 5 focus keywords. Inject affiliate links from affiliate-programs.md where tools are mentioned. Commit changes.

**Instructions:**

```
---
name: seo-affiliate-optimizer
description: Scan all /blog/ markdown files in the ai-security-brief GitHub repo that are missing SEO metadata. Add meta title, meta description, and 5 focus keywords. Inject affiliate links from affiliate-programs.md where tools are mentioned. Commit changes.
metadata:
  author: ai-security-brief
  version: '1.0'
---

# SEO + Affiliate Optimizer

## When to Use This Skill

Use this skill weekly to ensure all blog posts have complete SEO metadata and relevant affiliate links.

## Instructions

1. **Scan blog posts:**
   - Use GitHub MCP tools to list all `.md` files in `/blog/` of the `ai-security-brief` repo
   - Read each file and check its YAML frontmatter for:
     - `meta_title` (should be 50-60 characters)
     - `meta_description` (should be 150-160 characters)
     - `keywords` (should have exactly 5 focus keywords)
   - Track which files are missing any of these fields

2. **Fix missing SEO metadata:**
   For each file missing metadata:
   - Read the article content
   - Generate an SEO-optimised `meta_title` (50-60 chars, include primary keyword)
   - Generate an SEO-optimised `meta_description` (150-160 chars, compelling, include primary keyword)
   - Generate 5 focus keywords based on the article content (mix of short-tail and long-tail)
   - Update the YAML frontmatter with the new fields

3. **Inject affiliate links:**
   - Read `affiliate-programs.md` from the repo root for the tool list and placeholder format
   - Scan each article body for mentions of these tools/services:
     - NordVPN, Nord → `[AFFILIATE:NORDVPN]`
     - Proton, ProtonMail, Proton Mail, Proton VPN → `[AFFILIATE:PROTON]`
     - Surfshark → `[AFFILIATE:SURFSHARK]`
     - 1Password → `[AFFILIATE:1PASSWORD]`
     - Malwarebytes → `[AFFILIATE:MALWAREBYTES]`
     - PureVPN → `[AFFILIATE:PUREVPN]`
     - CyberGhost → `[AFFILIATE:CYBERGHOST]`
     - Jasper → `[AFFILIATE:JASPER]`
   - Where a tool is mentioned but NOT already linked, wrap the first mention in a link:
     `[Tool Name](AFFILIATE_PLACEHOLDER)`
   - Do NOT add links if the tool isn't naturally mentioned — no forced insertions

4. **Commit changes:**
   - Update each modified file using GitHub MCP create_or_update_file
   - Commit message: "SEO + affiliate optimization: [number] files updated"

5. **Output summary:**
   - List files that were updated
   - For each: what SEO fields were added, what affiliate links were injected
   - List any files that were already fully optimised (no changes needed)
```

---

## SKILL 5 — Performance Logger

**Name:** `performance-logger`

**Description:** Pull Beehiiv API stats (subscribers, open rate, click rate) using runtime environment variables for `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID`. Append a weekly row to /logs/performance-log.md in the GitHub repo. Flag if open rate drops below 35%.

**Instructions:**

```
---
name: performance-logger
description: Pull Beehiiv API stats (subscribers, open rate, click rate) using runtime environment variables for BEEHIIV_API_KEY and BEEHIIV_PUBLICATION_ID. Append a weekly row to /logs/performance-log.md in the GitHub repo. Flag if open rate drops below 35%.
metadata:
  author: ai-security-brief
  version: '1.0'
---

# Performance Logger

## When to Use This Skill

Use this skill weekly (Sunday evening) to log newsletter performance metrics and flag any issues.

## Instructions

1. **Retrieve API credentials:**
   - Read `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` from runtime environment variables or a secure secret store
   - Do not commit or persist Beehiiv secrets back into the GitHub repo
   - If not available, report that API keys are not configured and stop

2. **Pull Beehiiv stats via API:**
   - Use bash with curl to call the Beehiiv API:
   ```bash
   # Get publication stats
   curl -s -H "Authorization: Bearer $BEEHIIV_API_KEY" \
     "https://api.beehiiv.com/v2/publications/$BEEHIIV_PUBLICATION_ID" | python3 -m json.tool

   # Get recent post stats
   curl -s -H "Authorization: Bearer $BEEHIIV_API_KEY" \
     "https://api.beehiiv.com/v2/publications/$BEEHIIV_PUBLICATION_ID/posts?limit=5" | python3 -m json.tool

   # Get subscriber count
   curl -s -H "Authorization: Bearer $BEEHIIV_API_KEY" \
     "https://api.beehiiv.com/v2/publications/$BEEHIIV_PUBLICATION_ID/subscriptions?limit=1" | python3 -m json.tool
   ```
   - Extract: total subscribers, average open rate, average click rate, top clicked link from most recent issue

3. **Read existing performance log:**
   - Use GitHub MCP to read `/logs/performance-log.md` from the repo
   - If it doesn't exist, create it with this header:
   ```markdown
   # AI Security Brief — Performance Log

   | Date | Subscribers | Open Rate | Click Rate | Top Link | Alerts |
   |------|------------|-----------|------------|----------|--------|
   ```

4. **Append new row:**
   - Add a new row with today's date and the metrics
   - If open rate < 35%, add "⚠️ LOW OPEN RATE" in the Alerts column
   - If subscriber count decreased from last entry, add "📉 SUBSCRIBER DROP" in Alerts

5. **Push updated log:**
   - Use GitHub MCP create_or_update_file to update `/logs/performance-log.md`
   - Commit message: "Performance log: [DATE] — [subscriber count] subs, [open rate]% open"

6. **Alert if needed:**
   - If open rate < 35%: Output a clear warning with the current rate and the previous rate
   - Suggest actions: review subject lines, check send time, audit content relevance
   - If subscriber count dropped: Note the change and suggest investigating unsubscribe reasons

7. **Output summary:**
   - Current metrics: subscribers, open rate, click rate
   - Week-over-week change for each metric
   - Any alerts triggered
   - Link to the updated performance log in the repo
```

---

## Legacy Order of Operations

If you reuse these legacy Computer skills manually, run them in this order:
1. **Weekly AI Security Harvest**
2. **Article Factory**
3. **Newsletter Compiler**
4. **SEO + Affiliate Optimizer**
5. **Performance Logger**

Production scheduling no longer uses Zapier or Perplexity Computer. The live automation schedule now lives in GitHub Actions and is documented in `zapier-setup.md`.
