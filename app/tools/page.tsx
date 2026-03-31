import type { Metadata } from 'next';
import Link from 'next/link';
import { getAffiliateUrlByPriority } from '@/lib/affiliate-links';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/tools',
  title: 'Security Tools & Resources — Vetted VPNs, Password Managers & More',
  description:
    'Curated security tools for AI-era defence: VPNs, password managers, encrypted email, and endpoint protection — with clear affiliate disclosure.',
  openGraphTitle: 'Security Tools & Resources — Vetted VPNs, Password Managers & More',
  openGraphDescription:
    'Curated security tools for AI-era defence: VPNs, password managers, encrypted email, and endpoint protection — with clear affiliate disclosure.',
  twitterTitle: 'Security Tools & Resources',
  twitterDescription:
    'Curated security tools for AI-era defence: VPNs, password managers, encrypted email, and endpoint protection.',
});

interface Tool {
  name: string;
  description: string;
  highlight: string;
  price: string;
  url?: string;
  affiliateKeys?: readonly string[];
  fallbackUrl?: string;
  badge?: string;
  badgeColor?: string;
}

interface ToolCategory {
  id: string;
  icon: string;
  title: string;
  description: string;
  tools: Tool[];
}

const toolCategories: ToolCategory[] = [
  {
    id: 'vpns',
    icon: '🛡️',
    title: 'VPNs & Network Privacy',
    description:
      'Encrypt traffic, reduce exposure, and keep remote work less observable without turning your browsing habits into an intelligence feed for third parties.',
    tools: [
      {
        name: 'NordVPN',
        description:
          'Audited no-logs VPN with 6,000+ servers across 111 countries. Strong on threat protection features, including ad and malware blocking at the DNS layer.',
        highlight: 'Threat Protection Pro, RAM-only servers, WireGuard',
        price: 'From $3.09/mo',
        affiliateKeys: ['NORDVPN'],
        fallbackUrl: 'https://nordvpn.com',
        badge: 'Affiliate partner',
        badgeColor: '#3fb950',
      },
      {
        name: 'Mullvad VPN',
        description:
          'Zero-logs VPN operated from Sweden. Accepts cash and crypto. No account email required — just a 16-digit account number. Audited annually by independent firms.',
        highlight: 'No-account privacy, WireGuard, RAM-only servers',
        price: '€5/mo flat',
        url: 'https://mullvad.net',
        badge: 'Editors’ pick',
        badgeColor: '#00b4ff',
      },
      {
        name: 'Proton VPN',
        description:
          'Swiss-based, open-source VPN with a free tier. Built by the Proton ecosystem for encrypted communications and privacy-first workflows.',
        highlight: 'Free tier, open source, Swiss jurisdiction',
        price: 'Free – $9.99/mo',
        affiliateKeys: ['PROTON_VPN', 'PROTON'],
        fallbackUrl: 'https://protonvpn.com',
        badge: 'Best free option',
        badgeColor: '#3fb950',
      },
      {
        name: 'PureVPN',
        description:
          'No-log audited VPN with 6,000+ servers in 65+ countries. Offers dedicated IP, port forwarding, and split tunnelling — useful for security researchers who need stable egress without exposing a home address.',
        highlight: 'Dedicated IP, port forwarding, always-on audit',
        price: 'From $2.14/mo',
        affiliateKeys: ['PUREVPN'],
        fallbackUrl: 'https://www.purevpn.com',
        badge: 'Affiliate partner',
        badgeColor: '#3fb950',
      },
      {
        name: 'Surfshark',
        description:
          'Unlimited simultaneous devices, CleanWeb ad/malware blocking, and NoBorders mode for restricted networks. Independent audits by Deloitte. Strong value for teams protecting multiple endpoints.',
        highlight: 'Unlimited devices, CleanWeb, NoBorders',
        price: 'From $2.19/mo',
        affiliateKeys: ['SURFSHARK'],
        fallbackUrl: 'https://surfshark.com',
        badge: 'Affiliate partner',
        badgeColor: '#3fb950',
      },
    ],
  },
  {
    id: 'password-managers',
    icon: '🔑',
    title: 'Password Managers',
    description:
      'Zero-knowledge vaults that generate, store, and autofill strong unique passwords. High-ROI hardening for individuals and teams.',
    tools: [
      {
        name: 'Bitwarden',
        description:
          'Open-source, end-to-end encrypted password manager with a free individual tier. Self-hostable for teams and passkey-ready.',
        highlight: 'Open source, free tier, self-hostable',
        price: 'Free – $3/mo',
        url: 'https://bitwarden.com',
        badge: 'Open source',
        badgeColor: '#3fb950',
      },
      {
        name: '1Password',
        description:
          'Enterprise-grade password manager with Travel Mode, Watchtower breach monitoring, and strong SCIM/admin features for teams.',
        highlight: 'Travel Mode, Watchtower, enterprise SCIM',
        price: '$2.99/mo',
        url: 'https://1password.com',
        badge: 'Best for teams',
        badgeColor: '#00b4ff',
      },
    ],
  },
  {
    id: 'email-security',
    icon: '✉️',
    title: 'Email Security',
    description:
      'Encrypted email, disposable aliases, and phishing defence. Email remains the likeliest initial access point for most teams.',
    tools: [
      {
        name: 'Proton Mail',
        description:
          'End-to-end encrypted email from Switzerland. Zero-access encryption means even Proton cannot read your inbox.',
        highlight: 'E2E encryption, zero-access, Swiss law',
        price: 'Free – €9.99/mo',
        affiliateKeys: ['PROTON_MAIL', 'PROTON'],
        fallbackUrl: 'https://proton.me/mail',
        badge: 'Editors’ pick',
        badgeColor: '#00b4ff',
      },
      {
        name: 'SimpleLogin',
        description:
          'Email alias service that generates unique addresses per site to reduce breach fallout, spam, and address correlation.',
        highlight: 'Unlimited aliases, reply pseudonymously',
        price: 'Free – $4/mo',
        url: 'https://simplelogin.io',
      },
    ],
  },
  {
    id: 'endpoint-protection',
    icon: '💻',
    title: 'Endpoint Protection',
    description:
      'EDR, detection, and device hardening tools for workstations and servers. Behaviour-based visibility matters more than legacy signatures.',
    tools: [
      {
        name: 'Malwarebytes',
        description:
          'Real-time protection and malware remediation across consumer and small business environments, with a reputation for low operational drag.',
        highlight: 'Ransomware rollback, real-time protection',
        price: '$3.75/mo',
        url: 'https://malwarebytes.com',
      },
      {
        name: 'CrowdStrike Falcon Go',
        description:
          'Cloud-delivered endpoint protection that brings a lighter Falcon package into smaller environments without losing the threat intel edge.',
        highlight: 'AI-native EDR, threat intelligence, cloud-delivered',
        price: 'From $59.99/device/yr',
        url: 'https://crowdstrike.com',
        badge: 'Enterprise grade',
        badgeColor: '#d29922',
      },
    ],
  },
  {
    id: 'privacy-tools',
    icon: '🕵️',
    title: 'Privacy & Data Removal',
    description:
      'Tools that reduce your attack surface by minimising publicly available personal data — a practical first step against social engineering and OSINT-based targeting.',
    tools: [
      {
        name: 'Incogni',
        description:
          'Automated data broker removal service from Surfshark. Sends removal requests on your behalf to hundreds of data brokers, people-search sites, and marketing databases — and monitors for re-listing.',
        highlight: 'Automated broker removal, continuous monitoring',
        price: 'From $6.49/mo',
        affiliateKeys: ['INCOGNI'],
        fallbackUrl: 'https://incogni.com',
        badge: 'Affiliate partner',
        badgeColor: '#3fb950',
      },
    ],
  },
];

function generateToolsJsonLd() {
  const items = [
    { name: 'NordVPN', description: 'Advanced threat protection VPN with dark web monitoring.', category: 'VPN', rating: 4.7, price: '$3.09/mo' },
    { name: 'Proton VPN', description: 'Swiss-based, open-source VPN with a free tier.', category: 'VPN', rating: 4.5, price: 'Free – $9.99/mo' },
    { name: 'PureVPN', description: 'No-log audited VPN with 6,000+ servers in 65+ countries.', category: 'VPN', rating: 4.3, price: '$2.14/mo' },
    { name: 'Proton Mail', description: 'End-to-end encrypted email from Switzerland.', category: 'Email Security', rating: 4.6, price: 'Free – $12.99/mo' },
  ];

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Security Tools & Resources — AI Threat Brief',
    description: 'Curated security tools for AI-era defence: VPNs, password managers, encrypted email, and endpoint protection.',
    url: 'https://aithreatbrief.com/tools',
    numberOfItems: items.length,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Product',
        name: item.name,
        description: item.description,
        category: item.category,
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: item.rating,
          bestRating: 5,
          worstRating: 1,
          ratingCount: 1,
        },
        offers: {
          '@type': 'Offer',
          price: item.price,
          priceCurrency: 'USD',
          availability: 'https://schema.org/InStock',
        },
      },
    })),
  };
}

export default function ToolsPage() {
  const jsonLd = generateToolsJsonLd();

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #080c11, #0d1117)',
          borderBottom: '1px solid #21262d',
          paddingTop: '3.5rem',
          paddingBottom: '3.5rem',
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">Curated Arsenal</div>
          <h1 className="text-white mb-4">Security Tools &amp; Resources</h1>
          <p className="text-lg max-w-2xl" style={{ color: '#8b949e' }}>
            Curated tooling picks that line up with the threat and privacy themes covered across the briefing archive.
          </p>

          <div
            className="mt-6 inline-flex items-start gap-2 px-4 py-3 rounded-lg text-xs"
            style={{
              background: 'rgba(210,153,34,0.06)',
              border: '1px solid rgba(210,153,34,0.2)',
              color: '#8b949e',
              maxWidth: '42rem',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 16 16"
              fill="none"
              style={{ color: '#d29922', flexShrink: 0, marginTop: '1px' }}
              aria-hidden="true"
            >
              <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM0 8a8 8 0 1116 0A8 8 0 010 8z" fill="currentColor" opacity="0.3" />
              <path d="M8 4.5a.75.75 0 01.75.75v3a.75.75 0 01-1.5 0v-3A.75.75 0 018 4.5zm0 6.5a1 1 0 110-2 1 1 0 010 2z" fill="#d29922" />
            </svg>
            <span>
              <strong style={{ color: '#d29922' }}>Affiliate disclosure:</strong> some links on this page are affiliate links. We earn a small commission if you purchase — at no extra cost to you. We only list tools we recommend regardless.
            </span>
          </div>
        </div>
      </div>

      <div
        className="sticky top-16 z-40"
        style={{
          background: 'rgba(13,17,23,0.95)',
          borderBottom: '1px solid #21262d',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1 overflow-x-auto py-3" aria-label="Jump to category" style={{ scrollbarWidth: 'none' }}>
            {toolCategories.map((category) => (
              <a
                key={category.id}
                href={`#${category.id}`}
                className="flex-shrink-0 flex items-center gap-2 rounded-md border border-transparent px-3 py-1.5 text-xs font-mono font-medium text-[#8b949e] transition-all duration-200 hover:border-[#00b4ff33] hover:bg-[#00b4ff0d] hover:text-[#00b4ff]"
              >
                <span aria-hidden="true">{category.icon}</span>
                {category.title.split(' ')[0]}
              </a>
            ))}
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-20">
        {toolCategories.map((category) => (
          <section key={category.id} id={category.id} aria-label={category.title}>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
              <div className="flex items-start gap-4">
                <span className="text-4xl" aria-hidden="true">{category.icon}</span>
                <div>
                  <h2 className="text-white mb-2">{category.title}</h2>
                  <p className="text-sm max-w-2xl" style={{ color: '#8b949e' }}>
                    {category.description}
                  </p>
                </div>
              </div>
            </div>

            <div className="mb-8" style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {category.tools.map((tool) => (
                (() => {
                  const affiliateUrl = tool.affiliateKeys
                    ? getAffiliateUrlByPriority(tool.affiliateKeys, process.env)
                    : null;
                  const href = affiliateUrl ?? tool.url ?? tool.fallbackUrl;

                  if (!href) {
                    throw new Error(`Missing href for tool "${tool.name}".`);
                  }

                  return (
                    <div
                      key={tool.name}
                      className="relative rounded-xl border border-[#30363d] bg-[#161b22] p-6 transition-all duration-300 hover:border-[#00b4ff59] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                    >
                      {tool.badge ? (
                        <div className="absolute top-4 right-4">
                          <span
                            className="text-xs font-mono font-semibold px-2 py-0.5 rounded"
                            style={{
                              background: `${tool.badgeColor}18`,
                              color: tool.badgeColor,
                              border: `1px solid ${tool.badgeColor}30`,
                            }}
                          >
                            {tool.badge}
                          </span>
                        </div>
                      ) : null}

                      <div className="mb-3 pr-20">
                        <h3 className="text-lg font-bold text-white">{tool.name}</h3>
                        <p className="text-xs font-mono mt-1" style={{ color: '#00b4ff' }}>
                          {tool.highlight}
                        </p>
                      </div>

                      <p className="text-sm leading-relaxed mb-5" style={{ color: '#8b949e' }}>
                        {tool.description}
                      </p>

                      <div className="flex items-center justify-between pt-4" style={{ borderTop: '1px solid #21262d' }}>
                        <span className="text-xs font-mono font-bold" style={{ color: '#3fb950' }}>
                          {tool.price}
                        </span>
                        <a
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="inline-flex items-center gap-2 rounded-md bg-[#00b4ff] px-4 py-2 text-xs font-bold text-[#0d1117] transition-all duration-200 hover:bg-[#33c3ff] hover:shadow-[0_0_14px_rgba(0,180,255,0.3)]"
                          aria-label={`Visit ${tool.name} vendor site (opens in new tab)`}
                        >
                          Visit vendor site
                          <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                            <path d="M3.5 3a.5.5 0 000 1H7.293L1.146 10.146a.5.5 0 00.708.708L8 4.707V8.5a.5.5 0 001 0v-5a.5.5 0 00-.5-.5h-5z" />
                          </svg>
                        </a>
                      </div>
                    </div>
                  );
                })()
              ))}
            </div>
          </section>
        ))}

        <div
          className="py-16 px-8 rounded-2xl text-center relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #161b22 0%, #1a2030 100%)', border: '1px solid #30363d' }}
        >
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,180,255,0.08) 0%, transparent 60%)' }}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="section-label mb-4 justify-center">
              <span className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#00b4ff' }}>
                Get tool reviews in your inbox
              </span>
            </div>
            <h2 className="text-white mb-4">Pair the tools with the threat briefings</h2>
            <p className="text-lg mb-8 max-w-xl mx-auto" style={{ color: '#8b949e' }}>
              Subscribe for weekly briefings, new tooling notes, and practical product recommendations that match the week’s threat briefings.
            </p>
            <Link
              href="/newsletter"
              className="inline-flex items-center gap-2 rounded-md bg-[#00b4ff] px-8 py-3.5 text-sm font-bold text-[#0d1117] transition-all duration-200 hover:bg-[#33c3ff] hover:shadow-[0_0_20px_rgba(0,180,255,0.35)]"
            >
              Subscribe free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
