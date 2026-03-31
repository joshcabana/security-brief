import type { Metadata } from 'next';
import Link from 'next/link';
import ArticleCard from '@/components/ArticleCard';
import NewsletterForm from '@/components/NewsletterForm';
import { getAllArticles } from '@/lib/articles';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/',
  title: 'AI Security Brief — AI Threats, Privacy Tools & Security Briefings',
  description:
    'AI-assisted security briefings on AI-powered threats, privacy defence strategies, and security tools for technology professionals.',
});

const toolCategories = [
  {
    icon: '🛡️',
    name: 'VPN & Network',
    description: 'Encrypt your traffic, hide your IP, and reduce your exposure.',
    href: '/tools#vpns',
  },
  {
    icon: '🔑',
    name: 'Password Managers',
    description: 'Zero-knowledge vaults for credentials, secrets, and passkeys.',
    href: '/tools#password-managers',
  },
  {
    icon: '✉️',
    name: 'Email Security',
    description: 'Encrypted email and alias tooling for lower-risk comms.',
    href: '/tools#email-security',
  },
  {
    icon: '💻',
    name: 'Endpoint Protection',
    description: 'Behaviour-driven tooling for devices, servers, and response.',
    href: '/tools#endpoint-protection',
  },
];

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default async function HomePage() {
  const articles = await getAllArticles();
  const latestArticles = articles.slice(0, 4);
  const editorialTracks = new Set(articles.map((article) => article.category)).size;

  const dashboardRows = [
    { label: 'Published briefings', value: String(articles.length), tone: '#00b4ff' },
    { label: 'Editorial tracks', value: String(editorialTracks), tone: '#3fb950' },
    { label: 'Tool categories', value: String(toolCategories.length), tone: '#d29922' },
    { label: 'Cadence', value: 'Weekly', tone: '#00b4ff' },
    {
      label: 'Latest publish date',
      value: articles[0] ? formatDate(articles[0].date) : 'Pending',
      tone: '#bc8cff',
    },
  ];

  const summaryStats = [
    { value: String(articles.length), label: 'Published briefings' },
    { value: String(editorialTracks), label: 'Editorial tracks' },
    { value: String(toolCategories.length), label: 'Tool categories' },
    { value: 'Weekly', label: 'Newsletter cadence' },
  ];

  return (
    <>
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #0d1117 0%, #0d1117 85%, transparent 100%)',
          paddingTop: '5rem',
          paddingBottom: '5rem',
        }}
        aria-label="Hero"
      >
        <div className="absolute inset-0 bg-grid opacity-60 pointer-events-none" aria-hidden="true" />
        <div
          className="absolute top-0 right-0 w-2/3 h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(0,180,255,0.07) 0%, transparent 60%)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-start mb-10">
            <div
              className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full text-xs font-mono"
              style={{ background: 'rgba(248, 81, 73, 0.08)', border: '1px solid rgba(248, 81, 73, 0.25)', color: '#f85149' }}
              role="status"
              aria-label="Current editorial focus"
            >
              <span className="inline-block w-2 h-2 rounded-full animate-pulse" style={{ background: '#f85149' }} aria-hidden="true" />
              <span className="tracking-wider uppercase" style={{ letterSpacing: '0.1em' }}>
                Editorial focus: agentic AI, prompt injection, privacy reform
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="stagger">
              <div className="section-label mb-6">AI Security Briefings</div>
              <h1 className="font-black text-white leading-tight mb-6" style={{ letterSpacing: '-0.03em' }}>
                Intelligence on <span style={{ color: '#00b4ff' }}>AI-Powered Threats</span>
                {' '}&amp; Privacy Defence
              </h1>
              <p className="text-lg leading-relaxed mb-10 max-w-xl" style={{ color: '#8b949e' }}>
                A weekly publication for teams tracking AI-enabled attacks, privacy risk,
                and the controls that still hold up under pressure.
              </p>
              <div className="max-w-xl">
                <NewsletterForm
                  variant="hero"
                  placeholder="your@email.com"
                  buttonText="Get weekly briefings"
                  source="homepage-hero"
                />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <div className="flex -space-x-2" aria-hidden="true">
                  {['#00b4ff', '#3fb950', '#d29922', '#f85149'].map((color, index) => (
                    <div
                      key={color}
                      className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                      style={{ background: `${color}22`, borderColor: color, color }}
                    >
                      {index + 1}
                    </div>
                  ))}
                </div>
                <p className="text-sm" style={{ color: '#484f58' }}>
                  <strong style={{ color: '#8b949e' }}>{articles.length} published briefings</strong> covering AI threats, privacy, and practical defence choices.
                </p>
              </div>
            </div>
            <div className="lg:flex justify-end hidden" aria-hidden="true">
              <div className="w-full max-w-sm rounded-xl overflow-hidden" style={{ background: '#161b22', border: '1px solid #30363d', boxShadow: '0 20px 60px rgba(0,0,0,0.6)' }}>
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: '1px solid #21262d', background: '#0d1117' }}>
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#f85149' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#d29922' }} />
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: '#3fb950' }} />
                  </div>
                  <span className="text-xs font-mono ml-2" style={{ color: '#484f58' }}>coverage-overview.log</span>
                </div>
                <div className="p-5 font-mono text-xs" style={{ lineHeight: '1.8' }}>
                  <p style={{ color: '#3fb950' }}>$ editorial coverage snapshot</p>
                  <p className="mt-2" style={{ color: '#484f58' }}>Tracking the latest briefings and publication cadence...</p>
                  <div className="mt-4 space-y-1.5">
                    {dashboardRows.map((item) => (
                      <div key={item.label} className="flex items-center justify-between gap-3">
                        <span style={{ color: '#8b949e' }}>{item.label}</span>
                        <span style={{ color: item.tone }} className="font-bold text-right">
                          {item.value}
                        </span>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4" style={{ color: '#484f58' }}>
                    <span className="animate-blink" style={{ color: '#00b4ff' }}>█</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-16 pt-12" style={{ borderTop: '1px solid #21262d' }}>
            {summaryStats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-black mb-1 font-mono" style={{ color: '#00b4ff' }}>{stat.value}</div>
                <div className="text-xs uppercase tracking-wider" style={{ color: '#484f58', letterSpacing: '0.1em' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="divider-accent" aria-hidden="true" />

      <section className="py-20" style={{ background: '#0d1117' }} aria-label="Latest briefings">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="section-label mb-3">Latest Briefings</div>
              <h2 className="text-white">Latest Briefings</h2>
            </div>
            <Link
              href="/blog"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-medium text-[#8b949e] transition-colors duration-200 hover:text-[#00b4ff]"
              aria-label="View all articles"
            >
              View all
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 stagger">
            {latestArticles.map((article, index) => (
              <ArticleCard
                key={article.slug}
                article={article}
                variant={article.featured || index === 0 ? 'featured' : 'default'}
                index={index}
              />
            ))}
          </div>
          <div className="mt-8 sm:hidden text-center">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium" style={{ color: '#00b4ff' }}>
              View all articles
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section
        className="py-20"
        style={{ background: 'linear-gradient(to bottom, #0d1117, #0d1117)', borderTop: '1px solid #21262d' }}
        aria-label="Security tools and resources"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="section-label mb-3 justify-center">
              <span className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#00b4ff' }}>
                <span className="inline-block w-4 h-px" style={{ background: '#00b4ff' }} aria-hidden="true" />
                Curated Arsenal
                <span className="inline-block w-4 h-px" style={{ background: '#00b4ff' }} aria-hidden="true" />
              </span>
            </div>
            <h2 className="text-white mb-4">Security Tools &amp; Resources</h2>
            <p className="text-lg max-w-2xl mx-auto" style={{ color: '#8b949e' }}>
              A practical shortlist of VPN, identity, email, and endpoint tooling to pair with the analysis.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-10 stagger">
            {toolCategories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="group block rounded-xl border border-[#30363d] bg-[#161b22] p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#00b4ff59] hover:shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                aria-label={`Browse ${category.name} tools`}
              >
                <div className="text-3xl mb-4" aria-hidden="true">{category.icon}</div>
                <h3 className="text-base font-bold mb-2 transition-colors duration-200 group-hover:text-[#00b4ff]" style={{ color: '#ffffff' }}>{category.name}</h3>
                <p className="text-sm" style={{ color: '#8b949e' }}>{category.description}</p>
              </Link>
            ))}
          </div>
          <div className="text-center">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 rounded-md border border-[#00b4ff] bg-transparent px-8 py-3 text-sm font-bold text-[#00b4ff] transition-all duration-200 hover:bg-[#00b4ff14] hover:shadow-[0_0_20px_rgba(0,180,255,0.2)]"
            >
              Browse all tools
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      <section
        className="py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0a1628 0%, #0d1117 50%, #0a1628 100%)', borderTop: '1px solid #21262d', borderBottom: '1px solid #21262d' }}
        aria-label="Newsletter signup"
      >
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,180,255,0.06) 0%, transparent 65%)' }} aria-hidden="true" />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="section-label mb-5 justify-center">
            <span className="inline-flex items-center gap-2 text-xs font-mono font-semibold uppercase tracking-widest" style={{ color: '#00b4ff' }}>
              Weekly briefings
            </span>
          </div>
          <h2 className="text-white mb-5">Get the next briefing in your inbox</h2>
          <p className="text-lg mb-10" style={{ color: '#8b949e' }}>
            Weekly briefings on AI threats, privacy changes, and practical security tools worth your attention.
          </p>
          <NewsletterForm
            variant="page"
            placeholder="your@work-email.com"
            buttonText="Subscribe free"
            source="homepage-cta"
          />
        </div>
      </section>
    </>
  );
}
