import { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = {
  title: '2026 Agentic AI Threat Baseline Preview',
  description: 'Preview excerpt for the 2026 Agentic AI Threat Baseline report.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function ReportPage() {
  const checkoutLive = siteConfig.beehiiv.checkoutLive;
  const primaryCtaLabel = checkoutLive ? 'Continue to Pro Access' : 'Join the Pro Waitlist';
  const supportCopy = checkoutLive
    ? 'Full access is routed through the current Pro checkout flow.'
    : 'Paid access is not live yet. Join the waitlist for report-access updates.';

  return (
    <div className="max-w-3xl mx-auto px-6 py-20 font-sans">
      <div className="mb-12 border-b border-rose-500/30 pb-8">
        <p className="text-rose-500 font-bold tracking-widest text-sm uppercase mb-2">Preview Report // For Security Teams</p>
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-100 tracking-tight leading-tight mb-6">
          The 2026 Agentic AI Threat Baseline
        </h1>
        <div className="flex gap-4 text-sm text-slate-400 font-mono">
          <p>Source: AI Security Brief</p>
          <p className="text-slate-600">|</p>
          <p>Status: Preview excerpt</p>
        </div>
      </div>

      <div className="prose prose-invert prose-slate prose-a:text-cyan-500 max-w-none">
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 mb-10">
          <h2 className="text-2xl font-bold text-slate-100 mt-0 mb-4">Executive Summary</h2>
          <p className="text-slate-300 m-0">
            This preview page shows the structure of a longer-form AI Security Brief report. It is intended to introduce the topic area and route readers to the current Pro access flow for future full-report availability.
          </p>
          <p className="text-slate-300 mt-4 mb-0">
            The full report content is reserved for the Pro tier. Public briefings remain available elsewhere in the app while full report access routes through the current Pro flow.
          </p>
        </div>

        <div className="relative">
          <div className="select-none blur-sm opacity-40 pointer-events-none" aria-hidden="true">
            <h2 className="text-2xl font-bold text-cyan-400 border-l-4 border-cyan-500 pl-4">Section 1: Threat framing</h2>
            <div className="my-6 text-sm bg-slate-900/50 p-4 rounded border border-slate-800">
              <p><strong>Preview:</strong> The full report format includes background context, affected surface area, and mitigation framing.</p>
            </div>

            <h3>Section 2: Operational impact</h3>
            <p>Additional sections are reserved for Pro readers.</p>

            <h3>Section 3: Defensive response</h3>
            <ol>
              <li><strong>Scope:</strong> Identify the systems and interfaces in play.</li>
              <li><strong>Controls:</strong> Document defensive options and constraints.</li>
            </ol>

            <hr className="border-slate-800 my-12" />
            <h2 className="text-2xl font-bold text-cyan-400 border-l-4 border-cyan-500 pl-4">Section 4: Follow-up analysis</h2>
            <p>Additional report material is intentionally hidden in this preview.</p>
          </div>

          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center pt-10">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-cyan-500/30 rounded-2xl p-8 max-w-lg mx-auto text-center shadow-[0_0_50px_rgba(34,211,238,0.1)]">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-700 text-cyan-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              </div>
              <h3 className="text-2xl font-extrabold text-white mb-3 tracking-tight">Full report access is reserved for Pro</h3>
              <p className="text-slate-300 mb-8 leading-relaxed">
                This page is a preview excerpt. Use the current Pro flow for full report access and member updates.
              </p>

              <div className="flex flex-col gap-4">
                <Link href="/upgrade" className="w-full px-6 py-4 rounded-xl bg-cyan-500 border border-cyan-400 text-slate-950 font-extrabold shadow-[0_0_20px_rgba(34,211,238,0.2)] hover:shadow-[0_0_30px_rgba(34,211,238,0.4)] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2">
                  {primaryCtaLabel}
                </Link>
                <Link href="/subscribe" className="w-full px-6 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 font-semibold hover:bg-slate-700 transition-all flex items-center justify-center">
                  Subscribe Free
                </Link>
              </div>
              <p className="mt-6 text-xs text-slate-500 font-mono">{supportCopy}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
