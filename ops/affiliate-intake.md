# Affiliate Intake — AI Security Brief

This file is the canonical source for affiliate application copy for AI Security Brief.

> ⚠️ **Security:** Real personal and business details are stored locally only — never in this repo.
> Fill placeholders from your local `~/.ai-security-brief/intake-private.md` before submitting any application.

---

## Current application status

Updated: 18 March 2026

- NordVPN: **Live in production** — deployed in 3 articles + `/tools` (PR #24)
- PureVPN: **Live in production** — deployed in OpenClaw article + `/tools` (PR #25)
- 1Password / CJ: **Application pending advertiser approval** (CID 7901635, advertiser 5140517, verified 18 March 2026). Do not reapply.
- Malwarebytes: Partnerize account created; access expired, re-verification needed
- Proton: **Live in production** — CJ links deployed on `/tools` via runtime env vars (`AFFILIATE_PROTON_VPN`, `AFFILIATE_PROTON_MAIL`). CJ advertiser 5227916 verified 18 March 2026. Direct Proton Partners approval also available as fallback.
- Surfshark: **Live** — approved March 2026
- Incogni: **Live** — auto-eligible via Surfshark approval
- CyberGhost: Rejected at login gate; support follow-up sent
- Jasper AI: Rejected — no public signup path available

---

## Canonical business details (placeholders)

- Legal name: `[YOUR_LEGAL_NAME]`
- Business name: CABANA COLLECTIONS
- ABN: `[YOUR_ABN]`
- Business address: `[YOUR_STREET], [SUBURB] [STATE] [POSTCODE], Australia`
- Phone: `[YOUR_PHONE]`
- Contact email: `[YOUR_CONTACT_EMAIL]`
- Website: https://aithreatbrief.com

> Real values live in `~/.ai-security-brief/intake-private.md` on your local machine only.

---

## Business description

AI Security Brief is an independent publisher covering AI-powered cybersecurity threats, privacy tools, prompt-injection risk, agent security, and defensive controls for technology professionals and IT decision-makers. The site publishes practical analysis, tool roundups, and weekly intelligence digests with an Australia/APAC-aware angle where relevant. Coverage focuses on security outcomes, privacy risk reduction, and trustworthy tooling rather than generic technology news.

---

## Traffic / audience statement

AI Security Brief launched in March 2026 and is in the early growth phase. The site is building its audience through weekly editorial publishing, a Beehiiv newsletter, organic search, and direct referral traffic from security and privacy content distribution.

Use this wording when a form asks about current traffic, size, or maturity:

> AI Security Brief launched in March 2026 and is an early-stage but live publication. Traffic is currently modest because the site is new, but it is growing through weekly publishing, newsletter distribution, search visibility, and security/privacy-focused editorial content.

---

## Promotional methods

Use this wording when a form asks how the products will be promoted:

> Products will be promoted through editorial reviews, comparison articles, weekly AI security and privacy briefings, newsletter placements, and curated tool/resource pages on aithreatbrief.com. Promotion is content-led and audience-aligned, with a focus on transparent recommendations for security-conscious readers rather than coupon or incentive traffic.

Short-form version:

> Editorial reviews, comparison articles, newsletter placements, and curated security-tools pages.

---

## Application answer blocks

Replace all `[PLACEHOLDER]` values from your local private intake file before submitting.

### NordVPN

- Account type: Company
- Company / business name: AI Security Brief
- First name: `[YOUR_FIRST_NAME]`
- Last name: `[YOUR_LAST_NAME]`
- Email: `[YOUR_CONTACT_EMAIL]`
- Website: https://aithreatbrief.com
- Business description:

> AI Security Brief is an independent publication covering AI-powered cyber threats, privacy tools, and defensive security strategies for technical and business decision-makers.

- Traffic / audience:

> The site launched in March 2026 and is in active growth. Audience development is driven by weekly publishing, newsletter distribution, search visibility, and direct referral traffic from AI security and privacy content.

- Promotional methods:

> Editorial reviews, comparison pieces, newsletter placements, and curated tool pages for a security-focused audience.

---

### Proton

- Company / Name: `[YOUR_NAME]` / AI Security Brief
- Website: https://aithreatbrief.com
- Address 1: `[YOUR_STREET]`
- Address 2: leave blank unless required
- City: `[YOUR_SUBURB]`
- Country: Australia
- State / territory: Australian Capital Territory
- Postcode / ZIP: `[YOUR_POSTCODE]`
- Phone: `[YOUR_PHONE]`
- Contact email: `[YOUR_CONTACT_EMAIL]`
- Business description:

> AI Security Brief is an independent AI security and privacy publication focused on cybersecurity threats, privacy regulation, secure communications, and practical defensive tooling.

- Traffic / audience:

> AI Security Brief launched in March 2026 and is a live publication in early growth. Current traffic is modest but growing through weekly editorial publishing, newsletter distribution, and search/referral discovery.

- Promotional methods:

> Proton products would be promoted through privacy tool reviews, Australia/APAC privacy regulation coverage, newsletter recommendations, and curated tools pages relevant to readers seeking encrypted communication and secure identity tooling.

---

### 1Password / CJ

- Company / account name: `[YOUR_NAME]` / AI Security Brief
- Country: Australia
- Email: `[YOUR_CONTACT_EMAIL]`
- Website: https://aithreatbrief.com
- ABN: `[YOUR_ABN]`
- Business description:

> AI Security Brief publishes independent analysis for readers who care about AI-enabled threats, password hygiene, identity security, privacy tooling, and practical defensive controls.

- Traffic / audience:

> The site launched in March 2026 and is in early growth. It is a live publication with weekly content output, newsletter distribution, and ongoing search/referral acquisition.

- Promotional methods:

> 1Password would be promoted through password-manager comparisons, security best-practice content, tool roundups, and newsletter placements aimed at technical readers and security-conscious professionals.

---

## Local private intake file

Create this file on your local machine only — never push it to git:

**Path:** `~/.ai-security-brief/intake-private.md`

```
# Private intake — AI Security Brief (DO NOT COMMIT)
# Store real values here. Never push this file.

Legal name:
Business name: CABANA COLLECTIONS
ABN:
Address line 1:
Suburb:
State: Australian Capital Territory
Postcode:
Phone:
Contact email:
```

Add to your global gitignore as a safeguard:

```bash
echo "$HOME/.ai-security-brief/" >> ~/.gitignore_global
git config --global core.excludesfile ~/.gitignore_global
```

---

## Repo handling note

No credentials, passwords, API keys, login links, recovery secrets, or real personal/business contact details are stored in this repo. This file contains only reusable copy templates and safe placeholder wording for affiliate forms.
