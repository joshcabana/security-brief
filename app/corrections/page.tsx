import type { Metadata } from 'next';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/corrections',
  title: 'Corrections',
  description:
    'AI Security Brief Corrections — our process for requesting corrections and a public log of substantive updates to published articles.',
});

export default function CorrectionsPage() {
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
          <div className="section-label mb-3">Accountability</div>
          <h1 className="text-white mb-4">Corrections</h1>
          <p className="text-lg leading-relaxed" style={{ color: '#8b949e' }}>
            We make errors. When we do, we correct them quickly and transparently. This page explains our process.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-16">
          <section>
            <h2 className="text-white text-xl font-bold mb-4">How to request a correction</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#8b949e' }}>
              Spotted an error? We appreciate you pointing it out. You can request a correction in two ways:
            </p>
            <div className="space-y-4">
              <div
                className="p-4 rounded-lg"
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                }}
              >
                <h3 className="text-sm font-bold text-white mb-2">Reply to the newsletter email</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  If you receive our weekly briefing, hit reply and describe what you think needs correcting. Your email goes straight to our editorial team.
                </p>
              </div>
              <div
                className="p-4 rounded-lg"
                style={{
                  background: '#161b22',
                  border: '1px solid #30363d',
                }}
              >
                <h3 className="text-sm font-bold text-white mb-2">Contact us directly</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Email{' '}
                  <Link href="mailto:hello@aisecuritybrief.com" className="font-medium transition-colors duration-200 hover:text-[#00b4ff]" style={{ color: '#00b4ff' }}>
                    hello@aisecuritybrief.com
                  </Link>{' '}
                  with the article title, the claim you believe is inaccurate, and what the correct information should be.
                </p>
              </div>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">What happens next</h2>
            <p className="text-sm leading-relaxed mb-6" style={{ color: '#8b949e' }}>
              Here&apos;s our correction process:
            </p>
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white mb-2">1. Acknowledge within 3 business days</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  We&apos;ll confirm receipt of your report and let you know we&apos;re looking into it.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">2. Investigate</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  We verify your claim against our sources and determine if a correction is warranted.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">3. Update the article</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  If your report is valid, we&apos;ll update the article and add a visible correction note explaining what changed and why.
                </p>
              </div>
              <div>
                <h3 className="text-base font-bold text-white mb-2">4. Log it publicly</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
                  Substantive corrections appear in the log below. This creates a transparent record of our errors and our accountability.
                </p>
              </div>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-6">Corrections log</h2>
            <div
              className="p-6 rounded-lg text-sm"
              style={{
                background: '#161b22',
                border: '1px solid #30363d',
                color: '#8b949e',
              }}
            >
              <p>No corrections issued yet.</p>
            </div>
          </section>

          <div style={{ height: '1px', background: '#21262d' }} aria-hidden="true" />

          <section>
            <h2 className="text-white text-xl font-bold mb-4">Why transparency matters</h2>
            <p className="text-sm leading-relaxed" style={{ color: '#8b949e' }}>
              Publishing corrections publicly isn&apos;t fun, but it&apos;s essential. It shows we take accuracy seriously, we listen to our readers, and we&apos;re willing to admit when we get things wrong. Trust isn&apos;t built by pretending perfection — it&apos;s built by acknowledging mistakes and fixing them quickly.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
