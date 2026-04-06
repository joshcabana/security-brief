import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import ToolsMatrix from '@/components/ToolsMatrix';
import LeadCaptureForm from '@/components/LeadCaptureForm';
import SponsorSlot from '@/components/SponsorSlot';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/tools',
  title: 'Security Tools & Resources — AI Security Brief',
  description:
    'Curated security tools for AI-era defence: VPNs, LLM firewalls, identity providers, and compliance automation platforms.',
});

export default function ToolsDirectoryPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      {/* 
        Hero Header 
      */}
      <div className="relative overflow-hidden pt-24 pb-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[linear-gradient(to_bottom,#020617,#0f172a)]">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none bg-[radial-gradient(ellipse_at_80%_0%,rgba(6,182,212,0.06)_0%,transparent_60%)]" aria-hidden="true" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-[0_0_15px_rgba(8,145,178,0.2)]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Verified Defense Directory
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-4 text-slate-900 dark:text-white">
            The AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Security Stack</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed mb-6">
            A curated directory of MLSecOps firewalls, zero-trust infrastructure, and identity providers verified against agentic attack flows.
          </p>

          <div className="inline-flex items-start gap-2 px-4 py-3 rounded-lg border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-900/10 text-xs text-slate-600 dark:text-slate-400 max-w-3xl text-left">
             <div className="w-2 h-2 mt-1 rounded-full bg-amber-500 flex-shrink-0" />
             <span>
                <strong className="text-amber-700 dark:text-amber-500">Integrity & Affiliate Disclosure:</strong> We receive compensation for some tools listed below if you purchase via our links. This funds our vulnerability research. We only feature platforms tested against our internal offensive security standards.
             </span>
          </div>
        </div>
      </div>

      {/* Featured Sponsor */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 mb-8">
        <SponsorSlot 
          sponsor="Featured Sponsor SLOT"
          url="mailto:sponsorships@aithreatbrief.com"
          tagline="Secure the top spot on the 2026 AI Security Matrix. Reach thousands of AppSec engineers and CISOs."
          label="AVAILABLE"
        />
      </div>

      {/* Tools Matrix */}
      <ToolsMatrix />

      {/* 
        Lead Capture CTA 
      */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-32 pt-16">
        <div className="p-10 rounded-3xl relative overflow-hidden text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xl dark:shadow-none">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-50 dark:from-cyan-900/20 to-transparent pointer-events-none" />
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full mb-5 text-xs font-mono font-bold uppercase tracking-widest" style={{ background: 'rgba(0,180,255,0.08)', border: '1px solid rgba(0,180,255,0.2)', color: 'var(--accent)' }}>
              Enterprise Intelligence
            </div>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Download the Q2 2026 AI Security Tools Matrix</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Get the complete, high-resolution PDF report mapping the modern MLSecOps ecosystem.
            </p>
            <div className="max-w-md mx-auto text-left">
              <LeadCaptureForm buttonText="Download Free Report" source="tools-page" asset="ai-security-matrix-q2-2026" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
