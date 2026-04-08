import type { Metadata } from 'next';
import Link from 'next/link';
import React from 'react';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { siteConfig } from '@/lib/site';
import { Check, FileSearch, Shield, Zap } from 'lucide-react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/assessment',
  title: 'AI Agent Security Readiness Review',
  description:
    'Fixed-scope AI application security review for teams shipping agents, copilots, and LLM workflows.',
  openGraphTitle: 'AI Agent Security Readiness Review',
  openGraphDescription:
    'Fixed-scope AI application security review for teams shipping agents, copilots, and LLM workflows.',
  twitterTitle: 'AI Agent Security Readiness Review',
  twitterDescription:
    'Threat map, top risks, remediation memo, and readout for teams shipping AI systems.',
});

const deliverables = [
  'Threat map across your agent, copilot, and LLM workflow surfaces',
  'Top 5 risks ranked by exploitability and business impact',
  'Remediation memo with fast, concrete fixes your team can apply',
  '60-minute readout with implementation priorities and next actions',
];

const fitSignals = [
  'Shipping agents, copilots, or LLM workflows into production.',
  'Need a fixed-scope threat map before launch, rollout, or expansion.',
  'Want concrete remediation priorities within 7 business days.',
];

const offerLadder = [
  {
    title: 'AI Agent Security Readiness Review',
    price: siteConfig.offers.assessment.priceLabel,
    description:
      'Best first step for teams that need an opinionated risk review before shipping or expanding AI features.',
  },
  {
    title: 'Prompt Injection / Agent Risk Workshop',
    price: siteConfig.offers.assessment.workshopPriceLabel,
    description:
      'Focused workshop for teams that want shared language, threat modeling, and concrete hardening priorities.',
  },
  {
    title: 'Fractional AI Security Advisor',
    price: siteConfig.offers.assessment.retainerPriceLabel,
    description:
      'Ongoing support for roadmap review, architecture guidance, and follow-through after the initial diagnostic.',
  },
];

export default function AssessmentPage() {
  const assessment = siteConfig.offers.assessment;
  const contactEmail = 'hello@aisecuritybrief.com';
  const hasBookingUrl = Boolean(assessment.bookingUrl);
  const bookingUrl = assessment.bookingUrl ?? siteConfig.founder.linkedInUrl;
  const bookingLabel = hasBookingUrl ? 'Book the 15-minute fit call' : 'Message Josh on LinkedIn';
  const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent('AI Agent Security Readiness Review')}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      <section className="relative overflow-hidden pt-24 pb-20 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[linear-gradient(to_bottom,#020617,#0f172a)]">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none bg-[radial-gradient(ellipse_at_80%_0%,rgba(6,182,212,0.08)_0%,transparent_60%)]" aria-hidden="true" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-100 dark:bg-cyan-900/30 border border-cyan-200 dark:border-cyan-800 text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider mb-6">
            Primary Offer
          </div>

          <div className="grid lg:grid-cols-[1.4fr_0.9fr] gap-12 items-start">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
                AI Agent Security
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">
                  Readiness Review
                </span>
              </h1>
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mb-8">
                A fixed-scope review for teams shipping agents, copilots, and LLM workflows that need a sharp threat map before problems become incidents.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm font-mono text-cyan-700 dark:text-cyan-400">
                  {assessment.priceLabel}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm font-mono text-cyan-700 dark:text-cyan-400">
                  Delivery in {assessment.deliveryWindow}
                </span>
                <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-sm font-mono text-cyan-700 dark:text-cyan-400">
                  Free 15-minute fit call
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-cyan-500 border border-cyan-400 text-slate-950 font-extrabold hover:bg-cyan-400 transition-all shadow-[0_0_24px_rgba(34,211,238,0.25)]"
                >
                  <Zap size={18} />
                  {bookingLabel}
                </a>
                <Link
                  href={assessment.previewReportPath}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 font-bold hover:border-cyan-400 transition-colors"
                >
                  <FileSearch size={18} />
                  Start with the report preview
                </Link>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-500">
                No unpaid custom audits.{' '}
                {hasBookingUrl ? (
                  <>Fit call first. Payment is collected before delivery via invoice or payment link.</>
                ) : (
                  <>
                    Live scheduling is not configured yet. Use{' '}
                    <a
                      href={siteConfig.founder.linkedInUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
                    >
                      LinkedIn
                    </a>{' '}
                    or{' '}
                    <a href={contactHref} className="font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                      {contactEmail}
                    </a>{' '}
                    and mention the readiness review.
                  </>
                )}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 p-6 shadow-xl dark:shadow-none">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-500">
                  <Shield size={20} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Engagement summary</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Best for AI product, platform, and security teams</p>
                </div>
              </div>

              <ul className="space-y-3">
                {deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                    <Check size={16} className="mt-0.5 flex-shrink-0 text-cyan-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
                <p className="text-xs font-bold uppercase tracking-wider text-cyan-700 dark:text-cyan-400">
                  Best fit
                </p>
                <ul className="mt-3 space-y-3">
                  {fitSignals.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-slate-700 dark:text-slate-300">
                      <Check size={16} className="mt-0.5 flex-shrink-0 text-cyan-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-10 items-start">
            <div>
              <div className="section-label mb-4">Offer ladder</div>
              <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">
                Start with a diagnostic, then deepen support only if needed
              </h2>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                The point of the first engagement is speed and clarity. You leave with a prioritized risk picture, not a vague consulting retainer.
              </p>
            </div>

            <div className="space-y-4">
              {offerLadder.map((offer) => (
                <div
                  key={offer.title}
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-5"
                >
                  <div className="flex items-center justify-between gap-4 mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{offer.title}</h3>
                    <span className="text-xs font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
                      {offer.price}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{offer.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-[1fr_0.95fr] gap-12 items-start">
          <div>
            <div className="section-label mb-4">Process</div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-6">
              Simple commercial rules, fast delivery
            </h2>
            <div className="space-y-4">
              {[
                'Free 15-minute fit call to confirm scope and urgency.',
                'Proposal or payment link issued only for the fixed-scope review.',
                'Payment collected before delivery; proposal terms expire after 7 days.',
                'Review delivered within 7 business days, then covered in a 60-minute readout.',
              ].map((step, index) => (
                <div key={step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <p className="pt-1 text-slate-700 dark:text-slate-300">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 p-5">
              <p className="text-sm text-slate-700 dark:text-slate-300">
                If you only want the free material first, start with the report preview and newsletter. If you already know the fixed-scope review is the right next step, use the direct contact block.
              </p>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-xl dark:shadow-none">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Free path for teams still qualifying the review</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
              Use the preview report and newsletter if you want the research first. The paid review remains the direct path for teams that already know they need an operator-led risk picture.
            </p>

            <LeadCaptureForm
              buttonText="Send the preview report"
              source="assessment-page"
              asset="report-teaser"
              successTitle="Preview request queued"
              successMessageOverride="Check your inbox — the preview report and next steps are on the way."
            />

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col gap-3">
              <Link href={assessment.previewReportPath} className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                Read the gated report preview
              </Link>
              <Link href="/subscribe" className="text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline">
                Stay on the free weekly briefing
              </Link>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 p-5">
              <p className="text-sm font-bold text-slate-900 dark:text-white">Ready to move now?</p>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                {hasBookingUrl
                  ? 'Book the fit call to confirm scope. If scope is already confirmed, the fixed-fee payment CTA appears below when it is live.'
                  : 'If you already know the fixed-scope review is the right move, use LinkedIn or email directly while live scheduling is unavailable.'}
              </p>

              <div className="mt-4 flex flex-col gap-3">
                <a
                  href={bookingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-cyan-500 border border-cyan-400 text-slate-950 font-extrabold hover:bg-cyan-400 transition-all"
                >
                  <Zap size={18} />
                  {bookingLabel}
                </a>
                <a
                  href={contactHref}
                  className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-200 font-bold hover:border-cyan-400 transition-colors"
                >
                  Email {contactEmail}
                </a>
              </div>

              {assessment.paymentUrl ? (
                <a
                  href={assessment.paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-bold hover:bg-slate-800 dark:hover:bg-slate-700 transition-colors w-full"
                >
                  Secure the review
                </a>
              ) : (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-500">
                  Payment links are issued after the fit call and expire after 7 days.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
