# LinkedIn Campaign Playbook — AI Security Brief Pro
_Last updated: 2026-04-03 | Owner: Josh Cabana_

---

## 🔴 STEP 0: Fix Account Access (Blocker)

Account `509494393` exists but the Josh Cabana LinkedIn profile lacks access.

### Who created it?
Check which LinkedIn account owns it:
1. Log into **every** LinkedIn account you have (personal, company, old email)
2. On each, go to: `https://www.linkedin.com/campaignmanager/accounts`
3. The one that shows account `509494393` in the list is the owner

### Grant Josh Cabana access:
1. From the **owner account**, go to:  
   `https://www.linkedin.com/campaignmanager/accounts/509494393/settings/users`
2. Click **Add user**
3. Search for `Josh Cabana`
4. Set role → **Account Manager**
5. Save

### Alternative — fresh account path:
If the original account is unreachable (lost email, etc.):
- Create a new ad account under Josh Cabana's profile
- URL: `https://www.linkedin.com/campaignmanager/accounts` → Create account
- Link to **AI Security Brief** company page
- Resume from Step 1 below

---

## ✅ STEP 1: Pause All Existing Active Campaigns

Before building new campaigns, kill any active ones that send traffic to
pages that aren't `/pro`.

1. Go to: `https://www.linkedin.com/campaignmanager/accounts/509494393/campaigns`
2. Filter: Status → **Active / Delivering**
3. Select all → Status → **Pause**
4. Confirm pause

**Why:** No paid AI traffic should land on free sub opt-ins or affiliate/tools pages.
The only valid conversion destination right now is `aithreatbrief.com/pro`.

---

## ✅ STEP 2: Set Up LinkedIn Insight Tag + Conversion Tracking

The tag code is already in `app/layout.tsx`. You just need the Partner ID.

### Get your Partner ID:
1. Campaign Manager → Account Settings → Insight Tag
2. Copy the **Partner ID** (numeric string, e.g. `1234567`)

### Add to production env:
```bash
# In your Vercel dashboard → Project Settings → Environment Variables
NEXT_PUBLIC_LINKEDIN_PARTNER_ID=1234567
```

### Create Conversion Events:
1. Campaign Manager → Account Assets → Conversions
2. Click **Create conversion**
3. Event: **Pro Signup Click**
   - Name: `pro_signup_click`
   - Category: Lead
   - URL rule: contains `/pro` AND click on `#pro-cta-pricing` or `#pro-cta-hero`
4. Create second conversion:
   - Name: `beehiiv_pro_redirect`
   - Category: Purchase
   - URL rule: contains `beehiiv.com/subscribe`

---

## ✅ STEP 3: Create Campaign Group

1. Campaign Manager → **Create campaign**
2. Campaign Group name: `AI Security Brief — Pro Launch 2026-Q2`
3. Status: Active (but campaigns inside will be paused until ready)

---

## ✅ STEP 4: Build Campaign A — "Paid-First Newsletter" (Priority)

### Campaign settings:
| Field | Value |
|---|---|
| Objective | Website Conversions |
| Conversion goal | pro_signup_click |
| Campaign name | `Pro-Launch-A — CISO-SecOps — Article Ad` |
| Format | Single Image Ad |
| Bid strategy | Maximum Delivery (auto) |
| Daily budget | $50/day |
| Schedule | Start immediately, no end date |
| Audience network | OFF |
| LinkedIn Audience Expansion | OFF |

### Targeting:
| Filter | Values |
|---|---|
| Locations | United States, United Kingdom, Australia, Canada |
| Languages | English |
| Job titles | CISO, Chief Security Officer, VP of Security, Head of Security, Security Operations Manager, Director of Cybersecurity, Threat Intelligence Lead, AI Security Engineer |
| Skills | Cybersecurity, Threat Intelligence, AI Security, Security Operations, Zero Trust, Cloud Security, SIEM |
| Seniority | Director, VP, C-Suite, Senior |
| Industries | Computer Software, Internet, Financial Services, Government Administration, Defense, Healthcare |
| Company size | 200–10,000 employees |

**Do NOT use:** LinkedIn Audience Expansion, Lookalike audiences (not enough data yet)

### Ad Creative A1 — Direct Offer:
```
Headline (70 chars):
The AI Threat Feed Built for Security Leaders

Intro text (150 chars):
3 briefings/week. Zero fluff. CISOs and SecOps leads use AI Security Brief
Pro to stay ahead of AI-powered threats — before they become incidents.

CTA button: Learn More
Destination URL: https://aithreatbrief.com/pro?utm_source=linkedin&utm_medium=paid&utm_campaign=pro-launch-a&utm_content=direct-offer
```

### Ad Creative A2 — Threat Intelligence Angle:
```
Headline:
RAG Pipeline Attacks Are Now In the Wild — Are You Briefed?

Intro text:
AI Security Brief Pro delivers priority threat advisories 48 hours before
mainstream press. CISOs, SecOps leads, and AI security engineers rely on us
to stay ahead. Founding rate: $9/mo.

CTA button: Learn More
Destination URL: https://aithreatbrief.com/pro?utm_source=linkedin&utm_medium=paid&utm_campaign=pro-launch-a&utm_content=threat-angle
```

### Ad Creative A3 — No-Noise Positioning:
```
Headline:
The one security newsletter that has no vendor affiliates

Intro text:
Most "security briefings" are sponsored content in disguise. AI Security
Brief Pro is editorially independent, technically deep, and written for
practitioners — not executives who don't read footnotes.

CTA button: Learn More  
Destination URL: https://aithreatbrief.com/pro?utm_source=linkedin&utm_medium=paid&utm_campaign=pro-launch-a&utm_content=no-noise
```

---

## ✅ STEP 5: Build Campaign B — Document/Article Ad

### Campaign settings:
| Field | Value |
|---|---|
| Objective | Website Conversions |
| Conversion goal | pro_signup_click |
| Campaign name | `Pro-Launch-B — CISO-SecOps — Document Ad` |
| Format | Document Ad (newsletter/article format) |
| Daily budget | $50/day |

*Same targeting as Campaign A.*

### Document Ad content:
Upload a 1-page PDF teaser of the "2026 AI Threat Landscape Report"
(use the lead-magnet PDF at `/lead-magnet`)
- Cover page → inside shows 3 blurred/redacted data tables
- Last page: "Full report + weekly Pro briefings at aithreatbrief.com/pro"

This format gets 3–5x more LinkedIn impressions than standard image ads
because LinkedIn promotes native document consumption.

---

## ✅ STEP 6: Campaign Launch Criteria

Do NOT launch campaigns until ALL of these are true:

- [ ] `/pro` page is live at `aithreatbrief.com/pro`
- [ ] Beehiiv Pro tier checkout is live (real subscription page, not waitlist)
- [ ] LinkedIn Insight Tag firing (verify in Campaign Manager → Insight Tag status)
- [ ] Conversions configured in Campaign Manager
- [ ] UTM parameters added to all destination URLs
- [ ] Google/Vercel Analytics showing `/pro` page loads correctly
- [ ] Tools Matrix page no longer shows broken affiliate links (purge done)

---

## 📊 STEP 7: Post-Launch Metrics & Optimization

### Check at Day 3:
- CTR < 0.3%? → Kill the underperforming ad, keep the best 2
- CPL > $80? → Tighten targeting to Director/VP/C-Suite only
- 0 conversions? → Check the Insight Tag is firing on `/pro`

### Check at Day 7:
- Winning ad? → Duplicate and A/B test headline variations
- Add retargeting campaign: target users who visited `/pro` but didn't convert
  - Budget: $20/day, duration: 30 days post-visit
  - Message: "Founding rate ends soon" urgency frame

### Check at Day 14:
- If CPL < $50: scale winning campaigns to $100/day
- If CPL $50–$80: maintain, optimize creative only
- If CPL > $80: pause and review targeting

### North Star Metrics:
| Metric | Target |
|---|---|
| CTR | > 0.4% |
| CPL (cost per Pro subscriber) | < $60 |
| Conversion rate on `/pro` page | > 4% |
| First 30-day Pro subscribers | 25–50 |

---

## 🔧 Maintenance

- **Weekly:** Review spend, CTR, CPL per campaign
- **Bi-weekly:** Refresh ad creative (LinkedIn fatigues fast)
- **Monthly:** Add new threat-relevant ad copy tied to current events
- **Pause trigger:** Any campaign hitting $200 spend with 0 conversions

---

## Campaign IDs (fill in after creation)

| Campaign | ID | Status | Launched |
|---|---|---|---|
| Pro-Launch-A — Image Ad | TBD | Not created | — |
| Pro-Launch-B — Document Ad | TBD | Not created | — |
| Retargeting — /pro visitors | TBD | Not created | — |
