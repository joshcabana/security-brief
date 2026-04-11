'use client';

/**
 * PricingTiers
 * Three-tier pricing cards: Free / Pro ($39/mo or $390/yr) / Enterprise.
 * Stripe checkout CTA on Pro. Enterprise contact form link.
 * Used on /pricing and /pro pages.
 */

import { useState } from 'react';
import Link from 'next/link';
import { Check, Zap, Building2, Lock } from 'lucide-react';

const FREE_FEATURES = [
  'Weekly AI threat briefings',
  'Access to all editorial articles',
  'Security tools directory',
  'RSS feed + newsletter',
  'Community discussion',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Full AI Security Stack Matrix',
  'Pro-only deep dives & exploits',
  'PDF downloads of every brief',
  'Private RSS member feed',
  'Early access (48h before public)',
  'Ad-free reading experience',
  'Member dashboard + saved briefs',
  'Readiness score tracker',
  'Priority email Q&A',
];

const ENTERPRISE_FEATURES = [
  'Everything in Pro',
  'Up to 25 team seats',
  'White-label PDF reports',
  'Dedicated Slack channel',
  'Custom threat hunt requests',
  'Monthly 1:1 briefing call',
  'API access to content feed',
  'Invoice billing / PO supported',
  'SLA + priority response',
];

interface PricingTiersProps {
  /** Whether to show the yearly/monthly toggle */
  showToggle?: boolean;
  /** Highlight a specific tier */
  highlight?: 'free' | 'pro' | 'enterprise';
}

export default function PricingTiers({
  showToggle = true,
  highlight = 'pro',
}: PricingTiersProps) {
  const [yearly, setYearly] = useState(true);

  const proPrice = yearly ? '$390' : '$39';
  const proPeriod = yearly ? '/year' : '/month';
  const proSaving = yearly ? 'Save 16% vs monthly' : null;

  return (
    <div className="w-full">
      {/* Toggle */}
      {showToggle && (
        <div className="flex items-center justify-center gap-4 mb-10">
          <span
            className={`text-sm font-medium transition-colors ${!yearly ? 'text-white' : 'text-slate-500'}`}
          >
            Monthly
          </span>
          <button
            role="switch"
            aria-checked={yearly}
            onClick={() => setYearly(!yearly)}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              yearly ? 'bg-cyan-500' : 'bg-slate-700'
            }`}
            id="pricing-toggle"
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                yearly ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
          <span
            className={`text-sm font-medium transition-colors ${yearly ? 'text-white' : 'text-slate-500'}`}
          >
            Yearly{' '}
            <span className="text-xs text-cyan-400 font-bold ml-1">
              Save 16%
            </span>
          </span>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* Free */}
        <div
          className={`rounded-2xl border p-8 flex flex-col gap-6 transition-all ${
            highlight === 'free'
              ? 'border-cyan-500/50 bg-slate-900'
              : 'border-slate-800 bg-slate-900/50'
          }`}
        >
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-slate-500 mb-2">
              Free
            </div>
            <div className="text-4xl font-black text-white mb-1">$0</div>
            <div className="text-sm text-slate-500">Forever free</div>
          </div>

          <Link
            href="/subscribe"
            id="pricing-free-cta"
            className="w-full text-center py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-300 font-semibold text-sm transition-colors"
          >
            Subscribe Free
          </Link>

          <ul className="space-y-3">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                <Check size={15} className="text-slate-500 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Pro — highlighted */}
        <div
          className={`rounded-2xl border p-8 flex flex-col gap-6 relative overflow-hidden transition-all ${
            highlight === 'pro'
              ? 'border-cyan-500/60 bg-slate-900 shadow-[0_0_40px_rgba(34,211,238,0.07)]'
              : 'border-slate-800 bg-slate-900/50'
          }`}
        >
          {/* Popular badge */}
          <div className="absolute top-0 right-0">
            <div className="bg-cyan-500 text-slate-950 text-xs font-black px-3 py-1 rounded-bl-xl">
              MOST POPULAR
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <Zap size={14} className="text-cyan-400" />
              <div className="text-xs font-mono uppercase tracking-widest text-cyan-400">
                Pro
              </div>
            </div>
            <div className="flex items-baseline gap-1 mb-1">
              <div className="text-4xl font-black text-white">{proPrice}</div>
              <div className="text-slate-500 text-sm">{proPeriod}</div>
            </div>
            {proSaving && (
              <div className="text-xs text-cyan-400 font-semibold">{proSaving}</div>
            )}
          </div>

          <Link
            href="/api/stripe/checkout?plan=pro"
            id="pricing-pro-cta"
            className="w-full text-center py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
          >
            Start Pro — {proPrice}{proPeriod}
          </Link>

          <ul className="space-y-3">
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-300">
                <Check size={15} className="text-cyan-400 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Enterprise */}
        <div
          className={`rounded-2xl border p-8 flex flex-col gap-6 transition-all ${
            highlight === 'enterprise'
              ? 'border-cyan-500/50 bg-slate-900'
              : 'border-slate-800 bg-slate-900/50'
          }`}
        >
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Building2 size={14} className="text-slate-400" />
              <div className="text-xs font-mono uppercase tracking-widest text-slate-500">
                Enterprise
              </div>
            </div>
            <div className="text-4xl font-black text-white mb-1">Custom</div>
            <div className="text-sm text-slate-500">From $999/month</div>
          </div>

          <a
            href="mailto:intel@aithreatbrief.com?subject=Enterprise%20Enquiry"
            id="pricing-enterprise-cta"
            className="w-full text-center py-3 rounded-xl border border-slate-600 hover:border-slate-400 text-slate-300 font-semibold text-sm transition-colors flex items-center justify-center gap-2"
          >
            <Lock size={14} />
            Contact for Enterprise
          </a>

          <ul className="space-y-3">
            {ENTERPRISE_FEATURES.map((f) => (
              <li key={f} className="flex items-start gap-2.5 text-sm text-slate-400">
                <Check size={15} className="text-slate-400 mt-0.5 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Money-back guarantee */}
      <p className="text-center text-xs text-slate-600 mt-8">
        30-day money-back guarantee on Pro · Cancel anytime · No lock-in contracts
      </p>
    </div>
  );
}
