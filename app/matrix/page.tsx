import type { Metadata } from 'next';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { serializeJsonForHtml } from '@/lib/json-escape.mjs';
import InteractiveMatrix from './InteractiveMatrix';
import UpgradeWall from '@/components/UpgradeWall';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/matrix',
  title: 'AI Security Stack Matrix — Searchable Tool Directory',
  description:
    'A continuously updated, searchable, filterable directory of vetted AI security tools — LLM firewalls, SAST/DAST, cloud security, identity, endpoint, compliance, and privacy.',
  openGraphTitle: 'AI Security Stack Matrix — AI Security Brief',
  openGraphDescription:
    'Searchable, filterable directory of vetted AI security tools for teams building with LLMs.',
});

const TOOLS = [
  { id: 'lakera', name: 'Lakera Guard', category: 'LLM Firewall', strength: 'Prompt Injection Blocking', pricing: 'Enterprise', tier: 'pro' as const, score: 4.7 },
  { id: 'protectai', name: 'ProtectAI Radar', category: 'SAST / DAST', strength: 'MLSecOps Scanning', pricing: 'Free Tier', tier: 'free' as const, score: 4.3 },
  { id: 'rebuff', name: 'Rebuff', category: 'LLM Firewall', strength: 'Multi-layer Prompt Defence', pricing: 'Open Source', tier: 'free' as const, score: 4.1 },
  { id: 'lasso', name: 'Lasso Security', category: 'LLM Firewall', strength: 'GenAI Data Leak Prevention', pricing: 'Enterprise', tier: 'pro' as const, score: 4.4 },
  { id: '1password', name: '1Password for Business', category: 'Identity & Auth', strength: 'Zero-knowledge Vault', pricing: 'From $7.99/user/mo', tier: 'free' as const, score: 4.8 },
  { id: 'auth0', name: 'Auth0 / Okta', category: 'Identity & Auth', strength: 'CIAM & Workforce IAM', pricing: 'Enterprise', tier: 'free' as const, score: 4.5 },
  { id: 'wiz', name: 'Wiz', category: 'Cloud Security', strength: 'Agentless CSPM', pricing: 'Enterprise', tier: 'pro' as const, score: 4.9 },
  { id: 'crowdstrike', name: 'CrowdStrike Falcon', category: 'Endpoint & XDR', strength: 'NGAV + EDR + Threat Intel', pricing: 'Enterprise', tier: 'pro' as const, score: 4.8 },
  { id: 'sentinelone', name: 'SentinelOne', category: 'Endpoint & XDR', strength: 'Autonomous AI EDR', pricing: 'Enterprise', tier: 'pro' as const, score: 4.6 },
  { id: 'vanta', name: 'Vanta', category: 'Compliance', strength: 'SOC2/ISO27001 Automation', pricing: 'Enterprise', tier: 'free' as const, score: 4.5 },
  { id: 'drata', name: 'Drata', category: 'Compliance', strength: 'Continuous Audit Monitoring', pricing: 'Enterprise', tier: 'free' as const, score: 4.4 },
  { id: 'nordvpn', name: 'NordVPN', category: 'Network Privacy', strength: 'Threat Protection Pro', pricing: 'From $3.09/mo', tier: 'free' as const, score: 4.7 },
  { id: 'mullvad', name: 'Mullvad VPN', category: 'Network Privacy', strength: 'No-account Privacy', pricing: '€5/mo flat', tier: 'free' as const, score: 4.6 },
  { id: 'protonvpn', name: 'Proton VPN', category: 'Network Privacy', strength: 'Open Source, Swiss Law', pricing: 'Free – $9.99/mo', tier: 'free' as const, score: 4.5 },
  { id: 'bitwarden', name: 'Bitwarden', category: 'Identity & Auth', strength: 'Open Source Vault', pricing: 'Free – $3/mo', tier: 'free' as const, score: 4.7 },
  { id: 'protonmail', name: 'Proton Mail', category: 'Email Security', strength: 'E2E Encrypted, Zero-access', pricing: 'Free – €9.99/mo', tier: 'free' as const, score: 4.6 },
  { id: 'incogni', name: 'Incogni', category: 'Privacy & Data Removal', strength: 'Automated Broker Removal', pricing: 'From $6.49/mo', tier: 'free' as const, score: 4.2 },
  { id: 'calypso', name: 'CalypsoAI', category: 'LLM Firewall', strength: 'Policy Engine for AI', pricing: 'Enterprise', tier: 'pro' as const, score: 4.3 },
  { id: 'snyk', name: 'Snyk', category: 'SAST / DAST', strength: 'Dev-first Supply Chain', pricing: 'Free Tier', tier: 'free' as const, score: 4.5 },
  { id: 'orca', name: 'Orca Security', category: 'Cloud Security', strength: 'Agentless + AI Risk', pricing: 'Enterprise', tier: 'pro' as const, score: 4.7 },
];

const CATEGORIES = Array.from(new Set(TOOLS.map(t => t.category))).sort();

function generateMatrixJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Security Stack Matrix — AI Security Brief',
    description: 'Continuously updated directory of vetted AI security tools.',
    url: 'https://aithreatbrief.com/matrix',
    numberOfItems: TOOLS.length,
    itemListElement: TOOLS.map((tool, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'SoftwareApplication',
        name: tool.name,
        applicationCategory: tool.category,
        description: tool.strength,
      },
    })),
  };
}

export default function MatrixPage() {
  const jsonLd = generateMatrixJsonLd();

  return (
    <div className="bg-[#0a0a0a] min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(jsonLd) }}
      />

      {/* Header */}
      <section className="relative overflow-hidden border-b border-slate-800 py-16">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(34,211,238,0.06)_0%,transparent_55%)] pointer-events-none" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <div className="section-label mb-3">Curated Intelligence</div>
              <h1 className="text-white mb-4">AI Security Stack Matrix</h1>
              <p className="text-lg max-w-2xl text-slate-400">
                A continually updated directory of vetted agentic AI security tools, red team
                scanners, and privacy frameworks — searchable, filterable, and sortable.
              </p>
              <p className="mt-3 text-xs text-slate-600">
                <span className="border-b border-dashed border-slate-600 cursor-help" title="Some tools are affiliate partners. Details in each tool card.">
                  Transparency disclosure
                </span>{' '}
                · Last updated April 2026 · {TOOLS.length} tools indexed
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href="/tools"
                className="btn-secondary text-sm"
              >
                View full tool pages →
              </Link>
              <Link
                href="/pricing"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm font-bold transition-all shadow-glow-sm"
              >
                Unlock Pro filters
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Matrix Section */}
      <section className="py-8">
        <div className="max-w-[90rem] mx-auto px-4 sm:px-6 lg:px-8">
          <UpgradeWall type="matrix">
            <InteractiveMatrix tools={TOOLS} categories={CATEGORIES} />
          </UpgradeWall>
        </div>
      </section>
    </div>
  );
}
