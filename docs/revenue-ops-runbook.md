# Revenue Ops Runbook

> Canonical operator runbook for turning the assessment-first funnel into weekly revenue activity.

## What this runbook covers

- Weekly publishing and CTA review
- Lead follow-up rules
- Invoice and payment rules
- Testimonial capture
- Retainer upsell timing
- Manual CRM usage
- Weekly reporting definitions

Use this alongside:

- `docs/founder-sales-asset-pack.md`
- `ops/manual-crm-template.csv`
- `docs/automation-architecture.md`

## Revenue stack

- Public funnel: `/assessment`, report preview, lead magnet, `/about`, `/subscribe`, `/pro`
- Lead capture: `/api/lead-capture`
- Email backbone: Beehiiv
- Weekly automation: GitHub Actions workflows for harvest, articles, newsletter, SEO, and performance
- Manual CRM: `ops/manual-crm-template.csv`

## Live env setup

These values are optional in code, but they are revenue blockers in practice.

```bash
vercel env add NEXT_PUBLIC_ASSESSMENT_BOOKING_URL production
vercel env add NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL production
vercel env add NEXT_PUBLIC_LINKEDIN_PROFILE_URL production
```

Expected live behavior:

- Booking URL set: `/assessment` sends qualified buyers to a real fit-call flow
- Payment URL set: `/assessment` shows a direct payment CTA for the fixed-fee review
- Booking URL missing: page falls back to LinkedIn messaging
- Payment URL missing: payment CTA is hidden and invoicing stays manual

Run `pnpm verify:ops` after updating envs. Missing booking or payment URLs should be treated as warnings to clear before pushing hard on outbound.

After changing any of these public envs in Vercel, trigger a fresh production deployment before you trust `/assessment`. The route is prerendered, so env changes do not become visible on the live page until a new deployment is active.

Recommended post-change sequence:

1. Update the Vercel production envs.
2. Redeploy production.
3. Run `npx pnpm@10.23.0 verify:ops` locally so the local runtime contract matches the intended live state.
4. Run `npx pnpm@10.23.0 verify:production -- --base-url https://aithreatbrief.com`.
5. Open `https://aithreatbrief.com/assessment` and confirm the CTA state matches the envs you just deployed.

## Weekly cadence

### Sunday

1. Review the `Performance Logger` output and log any anomalies.
2. Check subscriber growth, open rate, click rate, and top link.
3. Update the manual CRM scorecard for the week.

### Monday

1. Review `Weekly Harvest` output.
2. Review `Article Factory` drafts.
3. Review `Newsletter Compiler` draft.
4. Review `SEO Affiliate Optimiser` changes.
5. Merge only after human review.
6. Publish the newsletter manually in Beehiiv.
7. Post or repurpose one LinkedIn insight from the week's content.

### Tuesday to Friday

1. Publish four founder-led LinkedIn posts across the week.
2. Send ten targeted connection requests across the week.
3. Send five follow-ups across the week.
4. Reply to new qualified leads inside one business hour.
5. Move every touched lead to a new CRM stage before ending the day.

## Publish checklist

Use this every Monday before any content goes live.

1. Confirm the weekly content PR exists and is still draft.
2. Review every generated markdown file for source fidelity and tone.
3. Confirm `/assessment` remains the primary CTA on the final linked pages.
4. Confirm no article invents a live affiliate URL.
5. Confirm the newsletter draft still points to the report or assessment where relevant.
6. Merge the reviewed PR.
7. Publish or schedule the newsletter in Beehiiv.
8. Log the publish date and issue URL in your weekly notes.

## Lead follow-up rules

### Stage values

Use only these stages in the manual CRM:

- `new lead`
- `qualified`
- `call booked`
- `proposal sent`
- `paid`
- `delivered`
- `retainer pitch`
- `closed won`
- `closed lost`

### Response SLA

- `assessment-page`, `report-teaser`, `linkedin-organic`, and `linkedin-document-ad` leads: reply within 1 business hour
- all other qualified inbound leads: reply within 4 business hours
- newsletter-only readers with no buying signal: route to nurture, not a custom audit conversation

### Qualification rule

Move a lead to `qualified` only if all are true:

- work email is valid
- clear business use case or security problem exists
- team is shipping or planning AI features, agents, copilots, or LLM workflows
- buyer is willing to consider a fixed-fee diagnostic

If not qualified:

- move to `closed lost`
- record a short reason
- send a newsletter or report CTA instead of a custom audit offer

## Invoice and payment rules

- No unpaid custom audits.
- Use the fixed-fee assessment first: `AUD 3,500`.
- Send the scope and payment link the same day as the fit call.
- Proposal expiry: 7 days.
- Work starts only after payment is confirmed.
- If payment is not received within 7 days, close the opportunity or restart from a fresh fit check.

### Same-day send flow

1. Move lead to `proposal sent`.
2. Send the proposal template from `docs/founder-sales-asset-pack.md`.
3. Send the payment email the same day.
4. When payment lands, move the lead to `paid`.
5. Lock the delivery window and kickoff inputs immediately.

## Delivery, testimonial, and upsell timing

### Delivery

- Standard delivery window: 7 business days
- Deliverables: threat map, top risks, remediation memo, 60-minute readout
- After readout, move the lead to `delivered`

### Testimonial timing

- Ask within 24 hours of the readout
- Request one short result-focused quote and permission level:
  - full name + company
  - first name + title only
  - anonymous company description

### Retainer upsell timing

Pitch the retainer when one of these is true:

- there are 2 or more follow-on workstreams
- the team needs implementation review over the next month
- leadership wants recurring AI security guidance

Timing:

- best moment: during the readout close if the need is obvious
- fallback: within 48 hours after delivery

Move the lead to `retainer pitch` when the offer is sent.

## Manual CRM use

Use `ops/manual-crm-template.csv` as the source of truth.

Required fields to keep current:

- `stage`
- `lead_source`
- `owner`
- `first_response_at`
- `qualified_at`
- `call_booked_at`
- `proposal_sent_at`
- `paid_at`
- `delivered_at`
- `retainer_pitch_at`
- `outcome_notes`

Rules:

- update the row on every meaningful touch
- never leave a qualified lead without a next action
- log the reason for every `closed lost`

## Weekly reporting

Track these five numbers every Sunday:

1. `leads by source`
   Count CRM rows grouped by `lead_source`.
2. `calls booked`
   Count rows with `stage` at or beyond `call booked`.
3. `paid diagnostics`
   Count rows with `stage` at or beyond `paid`.
4. `time to follow-up`
   Measure the hours between `created_at` and `first_response_at`.
5. `diagnostic-to-retainer conversion`
   Divide rows that reached `retainer pitch` and then `closed won` by rows that reached `paid`.

### Weekly review questions

- Which source produced the most qualified leads?
- Which post or report CTA generated the fastest replies?
- Where did opportunities stall: qualification, booking, proposal, or payment?
- Did every delivered diagnostic trigger a testimonial ask and a retainer decision?

## Founder-only work

Keep these manual on purpose:

- personal LinkedIn posting
- connection requests and DMs
- live fit calls
- payment approval or invoice send if a payment link is not used
- the final readout and relationship management

Everything else should be made repeatable through the workflows, docs, templates, and CRM discipline above.
