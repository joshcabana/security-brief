import type { Metadata } from 'next';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { siteConfig } from '@/lib/site';
import { Shield, Terminal, GlobeLock } from 'lucide-react';
import React from 'react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/lead-magnet',
  title: '2026 AI Threat Landscape Preview',
  description:
    'Preview the 2026 AI Threat Landscape report, join the mailing list, and continue into the readiness review if your team needs hands-on support.',
});

export default function LeadMagnetPage() {
  const assessment = siteConfig.offers.assessment;

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 flex flex-col justify-center">
      <section className="relative overflow-hidden py-24 flex-grow flex items-center">
        {/* Background Gradients */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-96 bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            
            {/* Left side: Copy */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-sm font-bold text-red-800 dark:text-red-400 mb-6 shadow-sm">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                </span>
                Preview Report
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
                The 2026 AI Threat <br className="hidden md:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">Landscape Report</span>
              </h1>
              
              <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                Preview the 2026 AI Threat Landscape report and join the mailing list for future report and briefing updates. If your team is already shipping AI features, use the readiness review as the next step.
              </p>
              
              <div className="space-y-4 mb-10 text-left">
                <div className="flex gap-4 items-start">
                  <div className="mt-1 flex-shrink-0 w-8 h-8 rounded bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                    <Terminal size={16} strokeWidth={2.5}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Context-Window Injections</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">How attackers bypass filters using RAG data poisoning.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="mt-1 flex-shrink-0 w-8 h-8 rounded bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                    <GlobeLock size={16} strokeWidth={2.5}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">RCE via Sandbox Escapes</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Why Docker isn&apos;t enough for coding agents.</p>
                  </div>
                </div>
                <div className="flex gap-4 items-start">
                  <div className="mt-1 flex-shrink-0 w-8 h-8 rounded bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800">
                    <Shield size={16} strokeWidth={2.5}/>
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">MLSecOps Mitigation</h3>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Deploying ephemeral microVMs and LLM Firewalls.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href={assessment.path}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
                >
                  View the readiness review
                </Link>
                <Link
                  href={assessment.previewReportPath}
                  className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors"
                >
                  Preview the report page
                </Link>
              </div>
            </div>

            {/* Right side: Opt-in Form */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-2xl relative">
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-cyan-500/20 blur-2xl rounded-full pointer-events-none"></div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Join the briefing list</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-8 text-sm">
                Enter your work email to subscribe to the weekly briefing and hear when the full report is available.
              </p>
              
              <NewsletterForm 
                variant="page" 
                placeholder="your@work-email.com" 
                buttonText="Join the Briefing List" 
                source="lead-magnet-page" 
              />
              
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800 text-center text-xs text-slate-500 dark:text-slate-400">
                Weekly briefing signup. Unsubscribe anytime.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
