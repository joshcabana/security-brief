import type { Metadata } from 'next';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/ai-use',
  title: 'AI Use Policy',
  description:
    'AI Security Brief AI Use Policy — how AI is used to accelerate research, with safeguards ensuring human judgment and editorial integrity.',
});

export default function AIUsePage() {
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
          <div className="section-label mb-3">Transparency</div>
          <h1 className="text-white mb-4">AI Use Policy</h1>
          <p className="text-lg leading-relaxed" style={{ color: '#8b949e' }}>
            AI is a research accelerator, not a substitute for judgment. We disclose where it&apos;s used and maintain editorial accountability.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          <section>
            <h2 className="text-white text-xl font-bold mb-4">How we use AI</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#8b949e' }}>
              AI accelerates our research workflow where it adds genuine value. It helps us process volumes of technical documentation, distill complexity, and draft frameworks for human review. But it never replaces the judgment calls that define editorial integrity: selecting what matters, verifying facts, and deciding what&apos;s safe to publish.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-6">Where AI may be used</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-2">Summarising source material</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Condensing long vendor advisories, research papers, and threat reports to extract core security claims. A human reviewer always verifies the summary against the original source.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Drafting first-pass copy</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Generating initial article structure and prose from verified facts and outlines. All copy undergoes editorial review, fact-checking, and rewrite before publication.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">Generating metadata</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Creating article summaries, social media descriptions, and technical tags. A human editor validates these match the content and are accurate.
                </p>
              </div>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-6">Non-negotiable rules</h2>
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg text-sm leading-relaxed"
                style={{
                  background: 'rgba(0,180,255,0.04)',
                  border: '1px solid rgba(0,180,255,0.15)',
                  color: '#8b949e',
                }}
              >
                <p className="mb-2">
                  <strong style={{ color: '#00b4ff' }}>No publishing without human review.</strong> Every article is read, fact-checked, and approved by a human editor before it goes live. AI-generated content never bypasses this gate.
                </p>
              </div>
              <div
                className="p-4 rounded-lg text-sm leading-relaxed"
                style={{
                  background: 'rgba(0,180,255,0.04)',
                  border: '1px solid rgba(0,180,255,0.15)',
                  color: '#8b949e',
                }}
              >
                <p className="mb-2">
                  <strong style={{ color: '#00b4ff' }}>No invented sources, statistics, or CVEs.</strong> Every fact is traced back to a primary source. If a source doesn&apos;t exist, it doesn&apos;t appear in our coverage.
                </p>
              </div>
              <div
                className="p-4 rounded-lg text-sm leading-relaxed"
                style={{
                  background: 'rgba(0,180,255,0.04)',
                  border: '1px solid rgba(0,180,255,0.15)',
                  color: '#8b949e',
                }}
              >
                <p className="mb-2">
                  <strong style={{ color: '#00b4ff' }}>Primary sources take priority.</strong> We cite official vendor advisories, CISA/CERT/CC documentation, and academic research before secondary journalism or commentary.
                </p>
              </div>
              <div
                className="p-4 rounded-lg text-sm leading-relaxed"
                style={{
                  background: 'rgba(0,180,255,0.04)',
                  border: '1px solid rgba(0,180,255,0.15)',
                  color: '#8b949e',
                }}
              >
                <p className="mb-2">
                  <strong style={{ color: '#00b4ff' }}>Unverified claims are labeled.</strong> If we report something we cannot independently confirm, we say so clearly. Speculation is marked as opinion.
                </p>
              </div>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Disclosure</h2>
            <p className="text-sm leading-relaxed mb-4" style={{ color: '#8b949e' }}>
              When an article is AI-assisted, we state it clearly. We tell you what was AI-assisted (research summaries, first drafts, metadata) and what a human reviewer independently validated (fact claims, source accuracy, technical detail, editorial judgment). This transparency lets you assess the work based on where human oversight applied.
            </p>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              You can always reach out if you spot an error or want to know more about our process. Email us at{' '}
              <Link href="mailto:hello@aisecuritybrief.com" className="font-medium transition-colors duration-200 hover:text-[#00b4ff]" style={{ color: '#00b4ff' }}>
                hello@aisecuritybrief.com
              </Link>.
            </p>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Questions?</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              If you&apos;d like to understand more about how we use AI, how we verify facts, or how our review process works, we&apos;re happy to explain. Transparency is part of our editorial practice, not a compliance checkbox.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
