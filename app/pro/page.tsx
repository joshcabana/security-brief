import type { Metadata } from 'next';
import Link from 'next/link';
import ProCTAButton from '@/components/ProCTAButton';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { siteConfig } from '@/lib/site';
import {
  Shield,
  Zap,
  Lock,
  FileText,
  Check,
  Brain,
  Database,
} from 'lucide-react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/pro',
  title: 'AI Security Brief Pro',
  description:
    'Overview of AI Security Brief Pro, including the current waitlist state and planned member content.',
  openGraphTitle: 'AI Security Brief Pro',
  openGraphDescription:
    'Overview of AI Security Brief Pro, including the current waitlist state and planned member content.',
  twitterTitle: 'AI Security Brief Pro',
  twitterDescription:
    'Overview of AI Security Brief Pro, including the current waitlist state and planned member content.',
});

const proFeatures = [
  {
    icon: Brain,
    title: 'Technical Briefings',
    description:
      'Longer-form analysis of AI security issues, architecture tradeoffs, and mitigation patterns.',
  },
  {
    icon: Lock,
    title: 'Member-Only Content',
    description:
      'Reserved articles and report sections are routed through the Pro upgrade flow.',
  },
  {
    icon: Database,
    title: 'Archive Access',
    description:
      'The Pro tier is intended to include access to a searchable archive of deeper briefings.',
  },
  {
    icon: FileText,
    title: 'Research Reports',
    description:
      'Report-style pages and longer research material are part of the paid-content plan.',
  },
  {
    icon: Shield,
    title: 'Disclosure-First Coverage',
    description:
      'Tooling coverage is paired with disclosure language when affiliate links are present.',
  },
  {
    icon: Zap,
    title: 'Launch Updates',
    description:
      'The current upgrade flow collects waitlist signups until paid access is confirmed live.',
  },
];

const freeVsPro = [
  { feature: 'Weekly email briefings', free: true, pro: true },
  { feature: 'Public blog articles', free: true, pro: true },
  { feature: 'Member-only content access', free: false, pro: true },
  { feature: 'Searchable archive access', free: false, pro: true },
  { feature: 'Research report access', free: false, pro: true },
  { feature: 'Paid-tier launch updates', free: false, pro: true },
];

const operationalNotes = [
  {
    title: 'Current checkout state',
    description:
      'The repository uses an environment flag to decide whether `/upgrade` redirects to checkout or captures waitlist signups.',
  },
  {
    title: 'Current public content',
    description:
      'Public briefings remain available through the blog and archive pages while paid access is not live.',
  },
  {
    title: 'Current disclosure model',
    description:
      'Affiliate language is disclosed in articles and supporting policy pages rather than hidden in marketing copy.',
  },
];

export default function ProPage() {
  const checkoutLive = siteConfig.beehiiv.checkoutLive;
  const primaryCtaLabel = checkoutLive ? 'Continue to Pro Access' : 'Join the Pro Waitlist';
  const heroSupportCopy = checkoutLive
    ? 'Paid access is live through the current Beehiiv checkout flow.'
    : 'Paid access is not live yet. Join the waitlist for launch updates.';
  const pricingSupportCopy = checkoutLive
    ? 'Upgrade flow is active.'
    : 'Waitlist signup is active. No card required.';
  const statusBadge = checkoutLive ? 'Paid access live' : 'Waitlist open';
  const summaryHeading = checkoutLive ? 'What Pro includes' : 'What Pro is intended to include';

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <section className="relative overflow-hidden pt-24 pb-20">
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(0,180,255,0.12)_0%,transparent_70%)]"
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_1px_1px,rgba(0,180,255,0.07)_1px,transparent_0)] bg-[size:28px_28px]"
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-mono font-bold uppercase tracking-widest border bg-[rgba(0,180,255,0.08)] border-[rgba(0,180,255,0.3)] text-[var(--accent)]"
          >
            <span className="relative flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-[var(--accent)]"
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2 bg-[var(--accent)]"
              />
            </span>
            {statusBadge}
          </div>

          <h1
            className="text-5xl sm:text-6xl lg:text-7xl font-extrabold mb-6 text-[var(--text-primary)] tracking-[-0.03em]"
          >
            AI Security Brief Pro
            <span
              className="block bg-[linear-gradient(135deg,#00b4ff_0%,#0086bd_60%,#00e5ff_100%)] text-transparent bg-clip-text"
            >
              Member Content Overview
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            This page describes the current Pro access flow and the member-content structure reflected in the repository.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <ProCTAButton id="pro-cta-hero" variant="primary">
              {primaryCtaLabel}
            </ProCTAButton>
            <ProCTAButton id="pro-cta-sample" variant="ghost" href="/blog">
              Read public briefings
            </ProCTAButton>
          </div>

          <p className="text-xs font-mono text-[var(--text-faint)]">
            {heroSupportCopy}
          </p>
        </div>
      </section>

      <section
        className="py-16 border-y border-[var(--border-subtle)] bg-[var(--surface)]"
        aria-label="Operational notes"
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {operationalNotes.map((item) => (
              <div
                key={item.title}
                className="rounded-lg p-6 transition-all duration-200 border border-[var(--border)] bg-[rgba(13,17,23,0.6)]"
              >
                <p className="text-sm font-bold mb-3 text-[var(--text-primary)]">
                  {item.title}
                </p>
                <p className="text-sm leading-relaxed text-[var(--text-muted)]">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" aria-label="Pro features">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label mb-4">Coverage</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-[var(--text-primary)]">
              {summaryHeading}
            </h2>
            <p className="mt-4 text-lg text-[var(--text-muted)]">
              These items are derived from the current site structure and upgrade flow.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proFeatures.map((feature, i) => {
              const Icon = feature.icon;
              // noinspection HtmlInlineStyle
              // noinspection HtmlInlineStyle
              return (
                <div
                  key={feature.title}
                  className="card p-6 group cursor-default"
                  {...{ style: { animationDelay: `${i * 0.05}s` } }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-110 bg-[rgba(0,180,255,0.1)] border border-[rgba(0,180,255,0.2)]"
                  >
                    <Icon size={18} className="text-[var(--accent)]" />
                  </div>
                  <h3 className="font-bold text-base mb-2 text-[var(--text-primary)]">
                    {feature.title}
                  </h3>
                  <p className=" ">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section
        className="py-24 border-y bg-[var(--surface)] border-[var(--border-subtle)]"
        aria-label="Free vs Pro comparison"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-4">Comparison</p>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">
              Free vs. Pro
            </h2>
          </div>

          <div
            className="rounded-xl overflow-hidden border border-[var(--border)]"
          >
            <div
              className="grid grid-cols-3 px-6 py-4 text-xs font-mono font-bold uppercase tracking-widest bg-[rgba(0,180,255,0.06)] border-b border-[var(--border)]"
            >
              <div className="text-[var(--text-muted)]">Feature</div>
              <div className="text-center text-[var(--text-muted)]">Free</div>
              <div className="text-center text-[var(--accent)]">Pro</div>
            </div>

            {freeVsPro.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-3 px-6 py-4 items-center text-sm transition-colors duration-150 hover:bg-white/[0.02] ${i < freeVsPro.length - 1 ? 'border-b border-[var(--border-subtle)]' : ''}`}
              >
                <div className="text-[var(--text-body)]">{row.feature}</div>
                <div className="flex justify-center">
                  {row.free ? (
                    <Check size={16} className="text-[var(--success)]" />
                  ) : (
                    <span className="text-[var(--text-faint)]">—</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {row.pro ? (
                    <Check size={16} className="text-[var(--accent)]" />
                  ) : (
                    <span className="text-[var(--text-faint)]">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24" aria-label="Illustrative member briefing preview">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-4">Preview</p>
            <h2 className="text-3xl font-extrabold text-[var(--text-primary)]">
              Illustrative member briefing format
            </h2>
          </div>

          <div
            className="rounded-xl p-6 font-mono text-sm bg-[var(--surface)] border border-[rgba(0,180,255,0.3)] shadow-[0_0_40px_rgba(0,180,255,0.08)]"
          >
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-[var(--border)]">
              <Shield size={16} className="text-[var(--accent)]" />
              <span className="font-bold text-xs uppercase tracking-widest text-[var(--accent)]">
                Example structure
              </span>
              <span className="ml-auto text-xs text-[var(--text-faint)]">Preview only</span>
            </div>
            <p className="mb-3 text-[var(--accent)] font-bold">
              Member briefings summarize the issue, affected systems, and mitigation direction.
            </p>
            <p className="text-xs leading-relaxed mb-4 text-[var(--text-muted)]">
              The current repository includes public briefings, report previews, and paywalled content placeholders. Pro pages are intended to expand on that structure with longer-form analysis and archive access.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border-subtle)]">
              {[
                { label: 'Summary', value: 'Issue overview' },
                { label: 'Scope', value: 'Affected surface' },
                { label: 'Action', value: 'Mitigation path' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs text-[var(--text-faint)]">{item.label}</p>
                  <p className="font-bold text-[var(--text-primary)]">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 text-xs border-t border-[var(--border-subtle)] text-[var(--text-faint)]">
              Reserved content is routed through the current Pro upgrade flow.
            </div>
          </div>
        </div>
      </section>

      <section
        className="py-24 relative overflow-hidden bg-[var(--surface)] border-t border-[var(--border-subtle)]"
        aria-label="Pro access"
      >
        <div
          className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_70%_80%_at_50%_100%,rgba(0,180,255,0.07)_0%,transparent_70%)]"
          aria-hidden="true"
        />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-mono font-bold uppercase tracking-widest bg-[rgba(0,180,255,0.08)] border border-[rgba(0,180,255,0.2)] text-[var(--accent)]"
          >
            <Zap size={12} />
            {statusBadge}
          </div>

          <div
            className="rounded-2xl p-10 mb-8 border border-[rgba(0,180,255,0.4)] bg-[rgba(13,17,23,0.8)] shadow-[0_0_60px_rgba(0,180,255,0.1)]"
          >
            <div className="mb-6">
              <span className="text-3xl font-extrabold text-[var(--text-primary)]">
                {checkoutLive ? 'Pro access' : 'Waitlist'}
              </span>
            </div>
            <p className="text-sm mb-8 text-[var(--text-muted)]">
              {heroSupportCopy}
            </p>

            <ul className="space-y-3 mb-10 text-left max-w-sm mx-auto">
              {[
                'Public briefings remain available today',
                'Upgrade flow lives at /upgrade',
                'Waitlist signup uses the current subscribe endpoint',
                'Research-report previews already exist in the app',
                'Archive and member-content routes can expand from this base',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-[var(--text-body)]">
                  <Check size={16} className="mt-0.5 flex-shrink-0 text-[var(--accent)]" />
                  {item}
                </li>
              ))}
            </ul>

            <ProCTAButton
              id="pro-cta-pricing"
              variant="primary"
              className="block w-full py-4 rounded-lg font-bold text-base text-center transition-all duration-200 justify-center"
            >
              {primaryCtaLabel}
            </ProCTAButton>
            <p className="mt-4 text-xs text-[var(--text-faint)]">
              {pricingSupportCopy}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Shield size={14} className="text-[var(--accent)]" />
              Affiliate disclosures when applicable
            </div>
            <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
              <Lock size={14} className="text-[var(--accent)]" />
              Waitlist state reflected in the app
            </div>
          </div>

          <p className="mt-10 text-sm text-[var(--text-faint)]">
            Prefer the free tier first?{' '}
            <Link href="/subscribe" className="text-[var(--accent)]">
              Subscribe here →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
