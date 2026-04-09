import type { Metadata } from 'next';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/terms',
  title: 'Terms of Service',
  description:
    'Terms of service for AI Security Brief, including disclaimers, affiliate disclosure, and limitations of liability.',
});

export default function TermsPage() {
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
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">Legal</div>
          <h1 className="text-white mb-4">Terms of Service</h1>
          <p className="text-lg" style={{ color: '#8b949e' }}>
            Last updated: March 2026
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-12">
          <section>
            <h2 className="text-white text-xl font-bold mb-4">Acceptance of terms</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              By accessing and using AI Security Brief, you agree to be bound by these terms of service. If you do not agree with any part of these terms, please discontinue use of this site.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Content disclaimer</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              All content published on AI Security Brief is for informational and educational purposes only. It does not constitute professional cybersecurity advice, legal advice, or any other form of professional counsel. You should not act or refrain from acting based solely on the information provided on this site. Always consult qualified professionals for advice specific to your situation.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Accuracy of information</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              We make reasonable efforts to ensure the accuracy and timeliness of the information published on this site. However, the cybersecurity landscape evolves rapidly. We do not warrant that all content is complete, current, or free from error. Threat intelligence, tool recommendations, and security strategies may change without notice.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Affiliate disclosure</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              This site contains affiliate links to third-party products and services. When you click these links and make a purchase, we may receive a commission at no additional cost to you. Affiliate relationships are clearly disclosed where applicable. These relationships do not influence our editorial judgements or recommendations. For full details, see our{' '}
              <Link href="/privacy" className="font-medium transition-colors duration-200 hover:text-[#00b4ff]" style={{ color: '#00b4ff' }}>
                Privacy Policy
              </Link>.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Third-party links</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              This site links to external websites, products, and services that we do not own or control. We are not responsible for the content, privacy practices, or availability of any third-party sites. Following external links is at your own risk.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Limitation of liability</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              To the fullest extent permitted by law, AI Security Brief and its contributors shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising from your use of or inability to use this site, including any reliance on content published here. This applies to damages of any kind, whether based on warranty, contract, tort, or any other legal theory.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Intellectual property</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              All original content on AI Security Brief, including articles, analysis, and design, is the intellectual property of AI Security Brief unless otherwise stated. You may share and reference our content with proper attribution but may not reproduce it in full without written permission.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Newsletter terms</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              By subscribing to our newsletter, you consent to receiving periodic emails containing articles, tool recommendations, and related content. You can unsubscribe at any time using the link provided in every email. Newsletter delivery is managed by Beehiiv and is subject to their terms of service.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Governing law</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              These terms are governed by and construed in accordance with the laws of Australia. Any disputes arising from these terms or your use of this site shall be subject to the exclusive jurisdiction of the courts of Australia.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Changes to these terms</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              We reserve the right to update these terms at any time. Material changes will be reflected on this page with an updated revision date. Continued use of the site after changes are published constitutes acceptance of the revised terms.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
