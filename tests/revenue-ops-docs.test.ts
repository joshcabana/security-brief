import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const repoRoot = process.cwd();
const readmePath = path.join(repoRoot, 'README.md');
const launchChecklistPath = path.join(repoRoot, 'docs', 'launch-checklist.md');
const revenueOpsRunbookPath = path.join(repoRoot, 'docs', 'revenue-ops-runbook.md');
const founderSalesAssetPackPath = path.join(repoRoot, 'docs', 'founder-sales-asset-pack.md');
const manualCrmTemplatePath = path.join(repoRoot, 'ops', 'manual-crm-template.csv');

test('README surfaces the new revenue ops docs and manual CRM starter', () => {
  const readmeSource = readFileSync(readmePath, 'utf8');

  assert.match(readmeSource, /docs\/revenue-ops-runbook\.md/);
  assert.match(readmeSource, /docs\/founder-sales-asset-pack\.md/);
  assert.match(readmeSource, /ops\/manual-crm-template\.csv/);
  assert.match(readmeSource, /NEXT_PUBLIC_ASSESSMENT_BOOKING_URL/);
  assert.match(readmeSource, /NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL/);
});

test('launch checklist includes live assessment booking and payment env setup', () => {
  const launchChecklistSource = readFileSync(launchChecklistPath, 'utf8');

  assert.match(launchChecklistSource, /NEXT_PUBLIC_ASSESSMENT_BOOKING_URL/);
  assert.match(launchChecklistSource, /NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL/);
  assert.match(launchChecklistSource, /NEXT_PUBLIC_LINKEDIN_PROFILE_URL/);
  assert.match(launchChecklistSource, /redeploy again before trusting the live `?\/assessment`? page/i);
  assert.match(launchChecklistSource, /verify:production -- --base-url https:\/\/aithreatbrief\.com/);
  assert.match(launchChecklistSource, /docs\/revenue-ops-runbook\.md/);
  assert.match(launchChecklistSource, /docs\/founder-sales-asset-pack\.md/);
});

test('revenue ops runbook covers follow-up rules, payment rules, testimonial capture, retainer timing, and reporting', () => {
  assert.equal(existsSync(revenueOpsRunbookPath), true);
  const runbookSource = readFileSync(revenueOpsRunbookPath, 'utf8');

  assert.match(runbookSource, /## Lead follow-up rules/);
  assert.match(runbookSource, /## Invoice and payment rules/);
  assert.match(runbookSource, /## Delivery, testimonial, and upsell timing/);
  assert.match(runbookSource, /## Weekly reporting/);
  assert.match(runbookSource, /trigger a fresh production deployment before you trust `?\/assessment`?/i);
  assert.match(runbookSource, /verify:production -- --base-url https:\/\/aithreatbrief\.com/);
  assert.match(runbookSource, /`new lead`/);
  assert.match(runbookSource, /`retainer pitch`/);
  assert.match(runbookSource, /`closed won`/);
  assert.match(runbookSource, /`closed lost`/);
});

test('founder sales asset pack contains the promised LinkedIn, outreach, proposal, payment, testimonial, and upsell templates', () => {
  assert.equal(existsSync(founderSalesAssetPackPath), true);
  const assetPackSource = readFileSync(founderSalesAssetPackPath, 'utf8');

  assert.match(assetPackSource, /## LinkedIn positioning/);
  assert.match(assetPackSource, /## Connection request templates/);
  assert.match(assetPackSource, /## Follow-up templates/);
  assert.match(assetPackSource, /## Fit-call replies/);
  assert.match(assetPackSource, /## One-page assessment scope/);
  assert.match(assetPackSource, /## Proposal template/);
  assert.match(assetPackSource, /## Invoice or payment email/);
  assert.match(assetPackSource, /## Testimonial request/);
  assert.match(assetPackSource, /## Retainer upsell email/);
});

test('manual CRM template is tracked and keeps the core revenue-stage columns', () => {
  assert.equal(existsSync(manualCrmTemplatePath), true);
  const crmTemplateSource = readFileSync(manualCrmTemplatePath, 'utf8');

  assert.match(crmTemplateSource, /^created_at,lead_name,company,title,email,lead_source,asset_requested,owner,stage,next_action,next_action_due_at,/m);
  assert.match(crmTemplateSource, /new lead/);
});
