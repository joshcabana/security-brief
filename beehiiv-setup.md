# Beehiiv Setup Guide — AI Security Brief Newsletter

## Step 1: Create Beehiiv Account

1. Go to [beehiiv.com](https://www.beehiiv.com/) and sign up for a free account (or Scale plan for full features)
2. Choose publication name: **AI Security Brief**
3. Set publication URL: `aisecuritybrief.beehiiv.com` (or custom domain later)

## Step 2: Configure Publication Settings

### Branding
- **Publication Name**: AI Security Brief
- **Tagline**: Intelligence on AI-Powered Threats & Privacy Defence
- **Logo**: Upload the shield logo SVG from the website `/public/` folder
- **Colors**: 
  - Primary: `#00b4ff` (electric blue)
  - Background: `#0d1117` (dark)
  - Text: `#e6edf3` (light gray)
  - Card background: `#161b22`

### Sender Settings
- **From Name**: AI Security Brief
- **From Email**: `newsletter@yourdomain.com` (set up after domain purchase)
- **Reply-to**: `editor@yourdomain.com`

## Step 3: Configure Email Template

### Header
- Shield logo (centered or left-aligned)
- Publication name in Inter Bold, #ffffff
- Tagline in Inter Regular, #8b949e

### Body Template Structure
```
[LOGO]
[PUBLICATION NAME]

THE BRIEF — [DATE]

[INTRO PARAGRAPH]

---

📡 SIGNAL 1: [HEADLINE]
[2-3 sentence summary]
[Read more →]

---

📡 SIGNAL 2: [HEADLINE]
[2-3 sentence summary]
[Read more →]

---

📡 SIGNAL 3: [HEADLINE]
[2-3 sentence summary]
[Read more →]

---

🛡️ TOOL OF THE WEEK
[Tool name + description + affiliate link]

---

[NEWSLETTER CTA / SHARE PROMPT]
[FOOTER WITH UNSUBSCRIBE]
```

### Footer
- "You're receiving this because you subscribed to AI Security Brief"
- Unsubscribe link (Beehiiv handles this automatically)
- Social links
- © 2026 AI Security Brief

## Step 4: Connect the Site Signup Route

1. Generate a Beehiiv API key with subscriber write access
2. Upload the protected PDF to your chosen delivery host and copy the final shareable URL
3. Add these values to your local or hosted runtime environment:
   - `BEEHIIV_API_KEY`
   - `BEEHIIV_PUBLICATION_ID`
   - Optional: `BEEHIIV_WELCOME_AUTOMATION_ID` if you want the subscribe route to enroll a Beehiiv welcome automation instead of sending the default welcome email
4. Keep the site form pointing at `/api/subscribe`
5. Submit a test signup from `/newsletter` and verify Beehiiv records the subscriber
6. Confirm the form shows a real success or failure message instead of a silent fallback
7. Paste the final PDF URL directly into the Beehiiv welcome email or welcome automation content

Optional: create an embedded Beehiiv form later if you want a hosted fallback, but the site no longer depends on iframe embed code.

### Protected Welcome Download Contract

- The subscribe route only validates the request, rate limits the caller, and creates the Beehiiv subscription.
- The PDF link is managed directly inside Beehiiv's welcome email or welcome automation content.
- The app no longer signs or injects lead-magnet URLs at subscribe time.
- If `BEEHIIV_WELCOME_AUTOMATION_ID` is set, the route suppresses Beehiiv's default welcome email and enrolls the subscriber into that automation to avoid duplicate welcome sends.

## Step 5: Enable API Access

1. Go to **Settings** → **Integrations** → **API**
2. Generate API key
3. Copy API key to your `.env.local` or hosted environment as `BEEHIIV_API_KEY`
4. Note your Publication ID for the Performance Logger skill

### API Endpoints You'll Use
- `GET /v2/publications/{pub_id}/subscriptions` — subscriber count
- `GET /v2/publications/{pub_id}/stats` — open rate, click rate
- `POST /v2/publications/{pub_id}/subscriptions` — add subscriber

## Step 6: Configure Automations

### Welcome Sequence
1. **Email 1** (Immediate): Welcome + what to expect + link to best articles
2. **Email 2** (Day 3): "The AI Threat Landscape in 2026" — curated from your top article
3. **Email 3** (Day 7): "Your Security Stack" — tool recommendations with affiliate links

### Referral Program (Optional)
- Enable Beehiiv's built-in referral program
- Milestones: 3 referrals → exclusive report, 10 referrals → tool discount code

## Step 7: Publish Issue #1

1. Use the content from `newsletter-issue-001.md` in this repo
2. Preview → Test send to yourself
3. Schedule or publish
4. Verify tracking is working in Beehiiv analytics

## First Live Send and Metrics Runbook

Use this runbook to close the remaining operator checklist after the first Beehiiv issue is scheduled or published.

### 1. Verify local runtime readiness

Create or update `.env.local` with the live Beehiiv and site values:

```bash
cat > .env.local <<'EOF'
BEEHIIV_API_KEY=your-beehiiv-api-key
BEEHIIV_PUBLICATION_ID=pub_your-publication-id
NEXT_PUBLIC_SITE_URL=https://aithreatbrief.com
NEXT_PUBLIC_SITE_NAME=AI Security Brief
# Optional: uncomment if you are using a Beehiiv automation instead of the default welcome email
# BEEHIIV_WELCOME_AUTOMATION_ID=aut_your-welcome-automation-id
EOF
chmod 600 .env.local
npx pnpm verify:ops
```

Expected result: `verify:ops` reports all required runtime variables as set. If it fails, stop and fix the missing variable before publishing.

### 2. Transfer the current newsletter draft into Beehiiv

Source draft for issue #1: `drafts/newsletter-2026-03-24.md`

1. Open Beehiiv and create or confirm the current post in the AI Security Brief publication.
2. Copy the draft title, subject line, preview text, and body from `drafts/newsletter-2026-03-24.md`.
3. Send a test email to yourself.
4. Verify the article links, unsubscribe footer, and `/tools` CTA render correctly.
5. Schedule or publish the post to Email and Web.
6. Copy the resulting Beehiiv post URL in the form `https://app.beehiiv.com/posts/<post-id>`.

Evidence you need from this step:

- Beehiiv post URL
- Published date in plain language, for example `30 March 2026`
- Final post title exactly as published

### 3. Apply publication evidence to the completion guide

After the post is live, export the Beehiiv evidence and run the completion-guide updater:

```bash
export BEEHIIV_PUBLICATION_URL='https://app.beehiiv.com/posts/<post-id>'
export BEEHIIV_PUBLISHED_AT='30 March 2026'
export BEEHIIV_POST_TITLE='Your exact Beehiiv post title'
python3 scripts/update-completion-guide.py
```

Expected result: the script updates the completion guide and prints `Publication evidence applied successfully.`

### 4. Wait for real metrics, then refresh the performance log

Do not log placeholder numbers. Wait until Beehiiv shows non-empty open and click metrics for the published post.

Recommended path: trigger the existing GitHub workflow so the log update follows the same production automation path.

GitHub CLI:

```bash
gh workflow run "Performance Logger" --ref main -f run_date=YYYY-MM-DD -f dry_run=false
gh run list --workflow "Performance Logger" --limit 1
gh run watch <run-id>
```

GitHub UI:

1. Open the `Performance Logger` workflow in GitHub Actions.
2. Click `Run workflow`.
3. Set `run_date` to the Australia/Sydney date you want recorded in `logs/performance-log.md`.
4. Leave `dry_run` as `false`.
5. Run the workflow and wait for completion.

Expected result: the workflow opens or updates the weekly performance PR with a real row in `logs/performance-log.md` showing subscribers, open rate, click rate, and top link.

### 5. Verify the closeout evidence

Confirm all of the following before marking the first-send checklist complete:

1. `npx pnpm verify:ops` passes locally.
2. The Beehiiv post is live on Email and Web.
3. `scripts/update-completion-guide.py` succeeded with real publication evidence.
4. `logs/performance-log.md` contains a row with real metrics rather than `—`.
5. `STATUS.md` can be updated truthfully to mark the first-send task complete.

## API Key Storage

Add to your `.env.local` file or hosting provider environment:
```
BEEHIIV_API_KEY=your_api_key_here
BEEHIIV_PUBLICATION_ID=your_pub_id_here
# Optional: route welcome emails through a Beehiiv automation instead of the default welcome email
# BEEHIIV_WELCOME_AUTOMATION_ID=aut_your_welcome_automation_id
```

These are used by the site subscribe route and by Skill 5 (Performance Logger) to pull newsletter stats automatically. Do not commit them to Git.
