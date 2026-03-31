import type { Metadata } from 'next';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/about',
  title: 'About',
  description:
    'About AI Security Brief — AI-assisted security briefings on AI threats, privacy tools, and defensive strategy, reviewed before publication.',
});

const coverageAreas = [
  {
    icon: '🎯',
    title: 'AI-Powered Threats',
    description:
      'Agentic AI abuse, prompt injection, deepfake-driven social engineering, and the evolving tactics that weaponise machine learning against defenders.',
  },
  {
    icon: '🔒',
    title: 'Privacy Tools & Defence',
    description:
      'Practical reviews of VPNs, encrypted email, password managers, and endpoint protection, assessed using public documentation, audit history, and operator relevance.',
  },
  {
    icon: '🧠',
    title: 'Security Strategies',
    description:
      'Practical frameworks for zero trust, threat modelling, incident response, and staying ahead of AI-accelerated attack surfaces.',
  },
];

export default function AboutPage() {
  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
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
        <div
          className="absolute top-0 right-0 w-2/3 h-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 80% 0%, rgba(0,180,255,0.06) 0%, transparent 60%)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">About</div>
          <h1 className="text-white mb-4">AI Security Briefings for Technical Teams</h1>
          <p className="text-lg leading-relaxed" style={{ color: '#8b949e' }}>
            AI Security Brief is an independent publication built for technology professionals tracking AI-powered cyber threats, privacy risk, and the defensive tooling that holds up under pressure.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          <section>
            <h2 className="text-white text-xl font-bold mb-4">Our mission</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              The security landscape is shifting fast. AI is amplifying both sides — giving defenders better detection while handing attackers scalable tools for phishing, reconnaissance, and evasion. Most coverage either hypes the threat or buries it in vendor marketing. We cut through both. AI Security Brief covers AI-powered threats, privacy risk, and defensive tooling with source-backed analysis for practitioners. We use automation to monitor developments quickly, then review and refine pieces before publication.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-6">What we cover</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              {coverageAreas.map((area) => (
                <div
                  key={area.title}
                  className="p-6 rounded-xl"
                  style={{ background: '#161b22', border: '1px solid #30363d' }}
                >
                  <span className="text-3xl mb-4 block" aria-hidden="true">
                    {area.icon}
                  </span>
                  <h3 className="text-base font-bold text-white mb-2">{area.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                    {area.description}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Publishing cadence</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              We publish new articles weekly, covering the latest developments across AI threats, privacy tooling, and security strategy. Each piece is informed by vendor advisories, official documentation, and reputable security reporting. We use AI to accelerate source triage, drafting, and editorial workflow. Published pieces are reviewed and edited by a human before publication. Subscribers receive a weekly newsletter digest via Beehiiv with the latest briefings delivered straight to their inbox.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Affiliate disclosure</h2>
            <div
              className="p-5 rounded-lg text-sm leading-relaxed"
              style={{
                background: 'rgba(210,153,34,0.06)',
                border: '1px solid rgba(210,153,34,0.2)',
                color: '#8b949e',
              }}
            >
              <p>
                <strong style={{ color: '#d29922' }}>Transparency note:</strong> some links on this site are affiliate links. If you purchase a product through one of these links, we may earn a small commission at no extra cost to you. We recommend tools based on documented security capabilities, independent audit results, and practitioner relevance. Affiliate commissions do not determine our rankings or conclusions. You can read more in our{' '}
                <Link href="/privacy" className="font-medium transition-colors duration-200 hover:text-[#00b4ff]" style={{ color: '#00b4ff' }}>
                  Privacy Policy
                </Link>.
              </p>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Get started</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#8b949e' }}>
              Browse our{' '}
              <Link href="/blog" className="font-medium transition-colors duration-200 hover:text-[#00b4ff]" style={{ color: '#00b4ff' }}>
                latest articles
              </Link>{' '}
              or explore our{' '}
              <Link href="/tools" className="font-medium transition-colors duration-200 hover:text-[#00b4ff]" style={{ color: '#00b4ff' }}>
                curated security tools
              </Link>.
            </p>
          </section>

          <div
            className="p-8 rounded-2xl text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(0,180,255,0.05) 0%, rgba(0,180,255,0.02) 100%)',
              border: '1px solid rgba(0,180,255,0.2)',
            }}
          >
            <h3 className="text-xl font-bold text-white mb-3">Stay briefed</h3>
            <p className="text-sm mb-6" style={{ color: '#8b949e' }}>
              Subscribe for weekly AI security briefings, tool reviews, and practical threat analysis.
            </p>
            <NewsletterForm variant="default" buttonText="Subscribe" source="about-page" />
          </div>
        </div>
      </div>
    </div>
  );
}
