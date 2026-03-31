import type { Metadata } from 'next';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/methodology',
  title: 'Methodology',
  description:
    'AI Security Brief Methodology — how topics are selected, sources are evaluated, and editorial standards ensure accuracy and practical value.',
});

export default function MethodologyPage() {
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
          <div className="section-label mb-3">Standards</div>
          <h1 className="text-white mb-4">Methodology</h1>
          <p className="text-lg leading-relaxed" style={{ color: '#8b949e' }}>
            How we select, source, and evaluate security and AI topics to ensure relevance, accuracy, and actionable insight.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          <section>
            <h2 className="text-white text-xl font-bold mb-4">What we cover</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#8b949e' }}>
              We focus on three intersecting domains where AI and security collide:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-2">AI-enabled attacks</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  How machine learning is weaponised against defenders — prompt injection, synthetic phishing, agentic abuse, deepfake-driven social engineering, and adversarial ML tactics.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">AI infrastructure security</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Supply chain risk, model poisoning, data exfiltration from training pipelines, and the security requirements for deploying LLMs and ML systems in high-trust environments.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Privacy and security tooling</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  VPNs, password managers, encrypted messaging, endpoint protection, and zero-trust frameworks — tested for real-world effectiveness and configuration best practices.
                </p>
              </div>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">How topics are selected</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#8b949e' }}>
              We curate security and AI feeds weekly. Topics are prioritized by security impact using a simple filter:
            </p>
            <ul className="space-y-3 text-sm" style={{ color: '#8b949e' }}>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  ▪
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Does it enable new attacks or close existing defence gaps?</strong>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  ▪
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Are enterprises or security teams directly affected?</strong>
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  ▪
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Is there actionable mitigation or defensive strategy?</strong>
                </span>
              </li>
            </ul>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-6">Source hierarchy</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#8b949e' }}>
              We prioritize sources by reliability, not reach. Our hierarchy:
            </p>
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                }}
              >
                <h3 className="text-sm font-bold text-white mb-2">Tier 1: Primary sources</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Vendor security advisories, CISA alerts, CERT/CC notifications, NVD entries, official academic research, and government security bulletins. These form the foundation of our reporting.
                </p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                }}
              >
                <h3 className="text-sm font-bold text-white mb-2">Tier 2: Secondary sources</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Reputable security journalism, established security research teams, and verified technical analysis from credible outlets. We verify claims against primary sources when possible.
                </p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                }}
              >
                <h3 className="text-sm font-bold text-white mb-2">Tier 3: Commentary</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Analysis, perspective, and opinion. We label these clearly. They inform context but never form the primary claim in our coverage.
                </p>
              </div>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">What &quot;reviewed&quot; means</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#8b949e' }}>
              Before publication, every article undergoes a review checklist:
            </p>
            <ul className="space-y-3 text-sm" style={{ color: '#8b949e' }}>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  ✓
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>References checked:</strong> Every source cited is verified to exist and accurately represent the original material.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  ✓
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Technical claims verified:</strong> Exploit PoCs, vulnerability details, and vendor statements are confirmed against primary documentation.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  ✓
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Mitigations actionable:</strong> If we recommend a defence or fix, we ensure it&apos;s practical and actually addresses the threat.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  ✓
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Affiliate links disclosed:</strong> Any affiliate links are clearly marked and never influence the editorial conclusion or product recommendation.
                </span>
              </li>
            </ul>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Conflicts and monetization</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#8b949e' }}>
              We&apos;re transparent about how we&apos;re funded:
            </p>
            <ul className="space-y-3 text-sm" style={{ color: '#8b949e' }}>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  •
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Affiliate commissions:</strong> Some tool reviews and links on this site are affiliate relationships. These never influence our editorial conclusions or product rankings.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  •
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Sponsorships:</strong> We do not accept payment to change rankings, add false claims, or suppress critical coverage.
                </span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-1" style={{ color: '#00b4ff' }}>
                  •
                </span>
                <span>
                  <strong style={{ color: '#8b949e' }}>Disclosure:</strong> All affiliate links are marked. Read our{' '}
                  <Link href="/about" className="font-medium transition-colors duration-200 hover:text-[#00b4ff]" style={{ color: '#00b4ff' }}>
                    About page
                  </Link>{' '}
                  for more on our affiliate partnerships.
                </span>
              </li>
            </ul>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Got questions about our standards?</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              We&apos;re committed to transparency. If you want to know more about how we source a particular article, how we verify facts, or how our review process works, reach out at{' '}
              <Link href="mailto:hello@aisecuritybrief.com" className="font-medium transition-colors duration-200 hover:text-[#00b4ff]" style={{ color: '#00b4ff' }}>
                hello@aisecuritybrief.com
              </Link>.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
