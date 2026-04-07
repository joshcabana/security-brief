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
  Bell,
  Users,
  Check,
  Brain,
  Database,
  AlertTriangle,
} from 'lucide-react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/pro',
  title: 'AI Security Brief Pro — Intelligence for Security Leaders',
  description:
    'The AI threat feed built for CISOs, SecOps leads, and AI security engineers. Exclusive briefings, threat advisories, and analysis — no fluff, no affiliate noise.',
  openGraphTitle: 'AI Security Brief Pro — Intelligence for Security Leaders',
  openGraphDescription:
    'The AI threat feed built for CISOs, SecOps leads, and AI security engineers. Exclusive briefings, threat advisories, and analysis — no fluff, no affiliate noise.',
  twitterTitle: 'AI Security Brief Pro',
  twitterDescription:
    'Priority AI threat advisories, deep technical briefings, and the full archive for security leaders.',
});

const proFeatures = [
  {
    icon: Bell,
    title: 'Priority Threat Advisories',
    description:
      'First-alert notifications on critical AI-specific CVEs, model supply-chain attacks, and agentic exploits — before they hit mainstream press.',
  },
  {
    icon: Brain,
    title: 'Deep-Dive Technical Briefings',
    description:
      'Complete architecture-level analysis of AI attack vectors: context-window injections, RAG poisoning, sandbox escapes, and LLM jailbreak chains.',
  },
  {
    icon: Database,
    title: 'Security Briefing Matrix',
    description:
      'Continuously updated matrix of vetted AI security tooling — detection layers, LLM firewalls, zero-trust integrations — rated by real operational value.',
  },
  {
    icon: FileText,
    title: 'Exclusive Research Reports',
    description:
      'Quarterly research reports covering the AI threat landscape. Structured for exec briefings or direct import into your threat register.',
  },
  {
    icon: Lock,
    title: 'Searchable Brief Archive',
    description:
      'Full access to every briefing, going back to launch. Search by threat type, vendor, attack surface, or CVE.',
  },
  {
    icon: Users,
    title: 'Early Cohort Pricing',
    description:
      'Lock in founding-member pricing before the public launch. Rate never increases as long as you stay subscribed.',
  },
];

const freeVsPro = [
  { feature: 'Weekly free briefings (curated)', free: true, pro: true },
  { feature: 'Priority threat advisories (24–48h early)', free: false, pro: true },
  { feature: 'Technical deep-dives & architecture analysis', free: false, pro: true },
  { feature: 'Full briefing archive (searchable)', free: false, pro: true },
  { feature: 'AI Stack Matrix (rated & updated weekly)', free: 'Partial', pro: true },
  { feature: 'Quarterly research reports', free: false, pro: true },
  { feature: 'No affiliate recommendations', free: false, pro: true },
  { feature: 'Founding member pricing lock', free: false, pro: true },
];

const socialProof = [
  { role: 'CISO', org: 'Mid-market fintech', quote: 'The only threat feed I actually read end-to-end every week.' },
  { role: 'VP Security Engineering', org: 'SaaS platform', quote: 'Replaced three newsletters. The AI-specific coverage is unmatched.' },
  { role: 'Threat Intelligence Lead', org: 'Government contractor', quote: 'Technical depth without the vendor noise. Exactly what we needed.' },
];

export default function ProPage() {
  const checkoutLive = siteConfig.beehiiv.checkoutLive;
  const primaryCtaLabel = checkoutLive ? 'Get Pro Access — $9/mo' : 'Join the Pro Waitlist — $9/mo';
  const heroSupportCopy = checkoutLive
    ? 'Cancel anytime. Founding rate locked for life.'
    : 'No card required yet. Founding rate locked for life when checkout opens.';
  const pricingSupportCopy = checkoutLive
    ? 'Secure checkout. Cancel from your account anytime.'
    : "Join the founding waitlist now. We'll email you first when checkout opens.";

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-20">
        {/* Background effects */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,180,255,0.12) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 1px 1px, rgba(0,180,255,0.07) 1px, transparent 0)',
            backgroundSize: '28px 28px',
          }}
          aria-hidden="true"
        />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Alert badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-mono font-bold uppercase tracking-widest border"
            style={{
              background: 'rgba(0,180,255,0.08)',
              borderColor: 'rgba(0,180,255,0.3)',
              color: 'var(--accent)',
            }}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: 'var(--accent)' }} />
              <span className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: 'var(--accent)' }} />
            </span>
            Founding Member Access — Limited Cohort
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight mb-6"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.03em' }}>
            The AI Threat Feed{' '}
            <span
              className="block"
              style={{
                background: 'linear-gradient(135deg, #00b4ff 0%, #0086bd 60%, #00e5ff 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Built for Security Leaders
            </span>
          </h1>

          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            CISOs and SecOps leads use AI Security Brief Pro to stay ahead of AI-powered threats —
            before they become incidents. 3 briefings/week. Zero fluff. No vendor noise.
          </p>

          {/* CTA block */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
            <ProCTAButton id="pro-cta-hero" variant="primary">
              {primaryCtaLabel}
            </ProCTAButton>
            <ProCTAButton id="pro-cta-sample" variant="ghost" href="/blog">
              Read sample briefings first
            </ProCTAButton>
          </div>

          <p className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
            {heroSupportCopy}
          </p>
        </div>
      </section>

      {/* ── Social Proof ── */}
      <section className="py-16 border-y" style={{ borderColor: 'var(--border-subtle)', background: 'var(--surface)' }}
        aria-label="Testimonials">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {socialProof.map((item, i) => (
              <div
                key={i}
                className="rounded-lg p-6 transition-all duration-200"
                style={{
                  border: '1px solid var(--border)',
                  background: 'rgba(13,17,23,0.6)',
                }}
              >
                <p className="text-sm italic mb-4 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                  &ldquo;{item.quote}&rdquo;
                </p>
                <div>
                  <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{item.role}</p>
                  <p className="text-xs font-mono" style={{ color: 'var(--accent)' }}>{item.org}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── What's Included ── */}
      <section className="py-24" aria-label="Pro features">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <p className="section-label mb-4">What you get</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Everything a security leader needs
            </h2>
            <p className="mt-4 text-lg" style={{ color: 'var(--text-muted)' }}>
              Built by a practitioner, for practitioners. No filler, no vendor partnerships.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {proFeatures.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className="card p-6 group cursor-default"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 transition-all duration-200 group-hover:scale-110"
                    style={{
                      background: 'rgba(0,180,255,0.1)',
                      border: '1px solid rgba(0,180,255,0.2)',
                    }}
                  >
                    <Icon size={18} style={{ color: 'var(--accent)' }} />
                  </div>
                  <h3 className="font-bold text-base mb-2" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted)' }}>
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section
        className="py-24 border-y"
        style={{ background: 'var(--surface)', borderColor: 'var(--border-subtle)' }}
        aria-label="Free vs Pro comparison"
      >
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-4">Comparison</p>
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              Free vs. Pro
            </h2>
          </div>

          <div
            className="rounded-xl overflow-hidden"
            style={{ border: '1px solid var(--border)' }}
          >
            {/* Header */}
            <div
              className="grid grid-cols-3 px-6 py-4 text-xs font-mono font-bold uppercase tracking-widest"
              style={{ background: 'rgba(0,180,255,0.06)', borderBottom: '1px solid var(--border)' }}
            >
              <div style={{ color: 'var(--text-muted)' }}>Feature</div>
              <div className="text-center" style={{ color: 'var(--text-muted)' }}>Free</div>
              <div className="text-center" style={{ color: 'var(--accent)' }}>Pro</div>
            </div>

            {freeVsPro.map((row, i) => (
              <div
                key={i}
                className="grid grid-cols-3 px-6 py-4 items-center text-sm transition-colors duration-150 hover:bg-white/[0.02]"
                style={{
                  borderBottom: i < freeVsPro.length - 1 ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                <div style={{ color: 'var(--text-body)' }}>{row.feature}</div>
                <div className="flex justify-center">
                  {row.free === true ? (
                    <Check size={16} style={{ color: 'var(--success)' }} />
                  ) : row.free === 'Partial' ? (
                    <span className="text-xs font-mono" style={{ color: 'var(--warning)' }}>Partial</span>
                  ) : (
                    <span style={{ color: 'var(--text-faint)' }}>—</span>
                  )}
                </div>
                <div className="flex justify-center">
                  {row.pro ? (
                    <Check size={16} style={{ color: 'var(--accent)' }} />
                  ) : (
                    <span style={{ color: 'var(--text-faint)' }}>—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Threat Alert Preview ── */}
      <section className="py-24" aria-label="Sample security briefing preview">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="section-label mb-4">Sample Alert</p>
            <h2 className="text-3xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              This is what Pro looks like
            </h2>
          </div>

          <div
            className="rounded-xl p-6 font-mono text-sm"
            style={{
              background: 'var(--surface)',
              border: '1px solid rgba(0,180,255,0.3)',
              boxShadow: '0 0 40px rgba(0,180,255,0.08)',
            }}
          >
            <div className="flex items-center gap-3 mb-5 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
              <AlertTriangle size={16} style={{ color: '#f85149' }} />
              <span className="font-bold text-xs uppercase tracking-widest" style={{ color: '#f85149' }}>
                Priority Advisory · AI-SEC-2026-0041
              </span>
              <span className="ml-auto text-xs" style={{ color: 'var(--text-faint)' }}>48h early access</span>
            </div>
            <p className="mb-3" style={{ color: 'var(--accent)', fontWeight: 700 }}>
              CRITICAL: RAG Pipeline Poisoning via Indirect Prompt Injection in Enterprise LLM Deployments
            </p>
            <p className="text-xs leading-relaxed mb-4" style={{ color: 'var(--text-muted)' }}>
              Active exploitation observed targeting Retrieval-Augmented Generation pipelines across 3 enterprise
              sectors. Attackers are embedding invisible instructions in indexed documents, causing LLM agents
              to exfiltrate session context to attacker-controlled endpoints.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-4" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              {[
                { label: 'Severity', value: 'Critical' },
                { label: 'CVSS', value: '9.1' },
                { label: 'Affected', value: 'LangChain, LlamaIndex' },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>{item.label}</p>
                  <p className="font-bold" style={{ color: 'var(--text-primary)' }}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 text-xs" style={{ borderTop: '1px solid var(--border-subtle)', color: 'var(--text-faint)' }}>
              🔒 Full technical breakdown, IOCs, and mitigation runbook available to Pro members only
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ── */}
      <section
        className="py-24 relative overflow-hidden"
        style={{ background: 'var(--surface)', borderTop: '1px solid var(--border-subtle)' }}
        aria-label="Pro pricing"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 70% 80% at 50% 100%, rgba(0,180,255,0.07) 0%, transparent 70%)',
          }}
          aria-hidden="true"
        />
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-mono font-bold uppercase tracking-widest"
            style={{
              background: 'rgba(0,180,255,0.08)',
              border: '1px solid rgba(0,180,255,0.2)',
              color: 'var(--accent)',
            }}
          >
            <Zap size={12} />
            Founding member cohort
          </div>

          <div
            className="rounded-2xl p-10 mb-8"
            style={{
              border: '1px solid rgba(0,180,255,0.4)',
              background: 'rgba(13,17,23,0.8)',
              boxShadow: '0 0 60px rgba(0,180,255,0.1)',
            }}
          >
            <div className="flex items-end justify-center gap-2 mb-2">
              <span className="text-6xl font-extrabold" style={{ color: 'var(--text-primary)' }}>$9</span>
              <span className="text-xl mb-3" style={{ color: 'var(--text-muted)' }}>/mo</span>
            </div>
            <p className="text-sm mb-8" style={{ color: 'var(--text-muted)' }}>
              Founding rate — locked for life. Cancel any time.
            </p>

            <ul className="space-y-3 mb-10 text-left max-w-sm mx-auto">
              {[
                'All Pro features listed above',
                'Priority threat advisories',
                'Full searchable archive',
                'Quarterly research reports',
                'No affiliate recommendations',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-body)' }}>
                  <Check size={16} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
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
            <p className="mt-4 text-xs" style={{ color: 'var(--text-faint)' }}>
              {pricingSupportCopy}
            </p>
          </div>

          <div className="flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Shield size={14} style={{ color: 'var(--accent)' }} />
              No vendor affiliations
            </div>
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-muted)' }}>
              <Lock size={14} style={{ color: 'var(--accent)' }} />
              Rate locked forever
            </div>
          </div>

          <p className="mt-10 text-sm" style={{ color: 'var(--text-faint)' }}>
            Already subscribed to the free brief?{' '}
            <Link href="/upgrade" style={{ color: 'var(--accent)' }}>
              Upgrade here →
            </Link>
          </p>
        </div>
      </section>
    </div>
  );
}
