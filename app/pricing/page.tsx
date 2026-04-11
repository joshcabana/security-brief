import type { Metadata } from 'next';
import Link from 'next/link';
import PricingTiers from '@/components/PricingTiers';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { Shield, Clock, Award } from 'lucide-react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/pricing',
  title: 'Pricing — Pro Intelligence Access for Security Teams',
  description:
    'Unlock the full AI Security Stack Matrix, Pro-only deep dives, PDF exports, and a member dashboard. $39/mo or $390/yr. 30-day money-back guarantee.',
  openGraphTitle: 'Pro Intelligence Access — AI Security Brief',
  openGraphDescription:
    'Full AI threat intelligence for security teams who need the signal, not the noise. $39/mo or $390/yr.',
});

const FAQS = [
  {
    q: 'What\'s included in Pro that Free doesn\'t have?',
    a: 'Pro unlocks the full interactive AI Security Stack Matrix with advanced filters and CSV/PDF export, Pro-only deep-dive briefings and exploit analyses, downloadable PDFs of every brief, a private RSS member feed, early access 48 hours before public, an ad-free experience, and the member dashboard with readiness score.',
  },
  {
    q: 'Can I try before committing?',
    a: 'We offer a 30-day money-back guarantee — no questions asked. If you\'re not getting value within the first month, contact us and we\'ll refund fully.',
  },
  {
    q: 'What\'s the AI Agent Security Readiness Review?',
    a: 'A fixed-scope consulting engagement ($3,500–$15k AUD) where I personally audit your AI stack, map attack surface, and deliver a threat model with prioritised remediations. Separate from the subscription — see the Assessment page.',
  },
  {
    q: 'Can I pay with a card from outside Australia?',
    a: 'Yes — Stripe handles all billing in USD. You can pay with any major card from any country. Enterprise customers can request invoice billing.',
  },
  {
    q: 'What is Enterprise?',
    a: 'Enterprise adds team seats (up to 25), white-label PDF reports, a dedicated Slack channel for your team, monthly 1:1 briefing calls, custom threat hunt requests, and API access to the content feed. Pricing starts at $999/month — contact us for a quote.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. Cancel from the customer portal at any time. You keep access until the end of the billing period and are never charged again.',
  },
];

const TRUST_BADGES = [
  { icon: Shield, label: '30-day money-back guarantee' },
  { icon: Clock, label: 'Cancel anytime, no lock-in' },
  { icon: Award, label: '100% independent editorial' },
];

export default function PricingPage() {
  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-800 py-20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.05)_0%,transparent_60%)] pointer-events-none" />
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-800/50 text-xs font-mono font-bold text-cyan-400 mb-6">
            Intelligence-grade threat research
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight mb-6">
            Simple, transparent{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
              pricing
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8 leading-relaxed">
            Start free. Upgrade when you need the full matrix, Pro-only briefs, and PDF exports.
            Built for security teams who need signal — not noise.
          </p>

          {/* Trust badges */}
          <div className="flex flex-wrap justify-center gap-4 mb-4">
            {TRUST_BADGES.map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-slate-500">
                <Icon size={13} className="text-slate-600" />
                {label}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <PricingTiers showToggle highlight="pro" />
        </div>
      </section>

      {/* High-ticket assessment CTA */}
      <section className="py-16 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-900/50 p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_50%,rgba(34,211,238,0.04)_0%,transparent_60%)]" />
            <div className="relative">
              <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-3">
                High-ticket advisory
              </div>
              <h2 className="text-3xl font-black text-white mb-4">
                AI Agent Security Readiness Review
              </h2>
              <p className="text-slate-400 max-w-xl mx-auto mb-6 leading-relaxed">
                A fixed-scope engagement where your AI stack gets a proper threat model, attack
                surface map, and a prioritised remediation memo — delivered in 7 business days.
                For when you need expertise, not just articles.
              </p>
              <div className="flex flex-wrap justify-center gap-3 mb-8">
                {['AUD 3,500 fixed fee', '7 business day turnaround', 'Full remediation memo', '60-min readout call'].map((item) => (
                  <span
                    key={item}
                    className="px-3 py-1.5 rounded-full border border-slate-700 bg-slate-800/60 text-xs font-mono text-slate-300"
                  >
                    {item}
                  </span>
                ))}
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link
                  href="/assessment"
                  id="pricing-assessment-cta"
                  className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.25)]"
                >
                  Book the Readiness Review
                </Link>
                <Link
                  href="/report/2026-ai-threat-landscape"
                  className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-medium text-sm transition-colors"
                >
                  Preview a sample report first
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 border-t border-slate-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-black text-white mb-12 text-center">
            Frequently asked questions
          </h2>
          <div className="space-y-6">
            {FAQS.map(({ q, a }) => (
              <div
                key={q}
                className="border border-slate-800 rounded-xl p-6 hover:border-slate-700 transition-colors"
              >
                <h3 className="text-base font-bold text-white mb-3">{q}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 border-t border-slate-800 text-center">
        <div className="max-w-xl mx-auto px-4">
          <p className="text-slate-500 text-sm mb-4">
            Questions before you upgrade?
          </p>
          <a
            href="mailto:intel@aithreatbrief.com"
            className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold transition-colors"
          >
            Email intel@aithreatbrief.com →
          </a>
        </div>
      </section>
    </div>
  );
}
