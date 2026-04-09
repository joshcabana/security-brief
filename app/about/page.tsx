import type { Metadata } from 'next';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { Target, ServerCrash, ShieldCheck, Award } from 'lucide-react';
import React from 'react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/about',
  title: 'About Josh Cabana — AI Security Brief',
  description:
    'The uncompromising intelligence feed for technology professionals defending against autonomous agents, prompt injection, and MLSecOps vulnerabilities.',
});

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      {/* 
        Hero Section 
      */}
      <div className="relative overflow-hidden pt-24 pb-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[linear-gradient(to_bottom,#020617,#0f172a)]">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none bg-[radial-gradient(ellipse_at_80%_0%,rgba(6,182,212,0.06)_0%,transparent_60%)]" aria-hidden="true" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-[0_0_15px_rgba(8,145,178,0.2)] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Operator-Led Intelligence
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
            We don&apos;t summarize the news.<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">We reverse-engineer the threat.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            AI Security Brief is an independent intelligence operation serving CISOs, AppSec Leads, and Red Teamers navigating the explosive reality of agentic vulnerabilities.
          </p>
        </div>
      </div>

      {/* 
        Author / Founder Profile Section 
      */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
          <div className="relative">
            {/* Visual placeholder for Author Image */}
            <div className="aspect-square bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(6,182,212,0.1)]">
              <div className="absolute inset-0 flex items-center justify-center">
                 <ShieldCheck className="w-24 h-24 text-slate-300 dark:text-slate-700" strokeWidth={1} />
              </div>
            </div>
            <div className="absolute -bottom-4 -right-4 bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-lg p-3 shadow-xl">
              <div className="flex items-center gap-2">
                 <Award className="text-cyan-500 w-5 h-5"/>
                 <span className="text-sm font-bold text-slate-900 dark:text-white">Josh Cabana</span>
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Founder & Lead Security Analyst</div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Why trust this brief?</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
              The security landscape is actively fracturing. Traditional WAFs and EDRs are blind to context-window injections, zero-day data poisoning, and autonomous lateral movement. 
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              I built AI Security Brief because enterprise teams are starving for high-signal intelligence that bridges the gap between machine learning and offensive security. Most AI newsletters are written by hype-mongers. Most security blogs ignore LLM mechanics.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              As an active practitioner intersecting Offensive Security and ML pipelines, I don&apos;t just report on the latest CVEs—I supply the actual Regex patterns, isolation blueprints, and execution context you need to patch your endpoints before a rogue agent executes a payload.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-cyan-600 dark:text-cyan-400 font-mono">Offensive ML</span>
              <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-cyan-600 dark:text-cyan-400 font-mono">Red Teaming</span>
              <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-cyan-600 dark:text-cyan-400 font-mono">Vulnerability Research</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" aria-hidden="true" />

      {/* 
        Methodology & Coverage Matrix
      */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">Our Intelligence Matrix</h2>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-2xl mx-auto">The three pillars of coverage delivered exclusively to your inbox.</p>
        
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-colors shadow-sm dark:shadow-none">
            <Target className="w-8 h-8 text-cyan-600 dark:text-cyan-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Agentic Exploits</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Deep-dives into prompt injection frameworks, shadow sleeper agents in fine-tuning sets, and prompt leaking architectures.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-colors shadow-sm dark:shadow-none">
            <ShieldCheck className="w-8 h-8 text-cyan-600 dark:text-cyan-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Privacy & Obfuscation</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Ruthless evaluations of LLM Firewalls, Zero-Trust VPN anonymization, and data-masking pipelines for enterprise RAG deployments.
            </p>
          </div>
          
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 transition-colors shadow-sm dark:shadow-none">
            <ServerCrash className="w-8 h-8 text-cyan-600 dark:text-cyan-500 mb-4" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Isolation Engineering</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Strategies preventing autonomous coding agents from executing Sandbox Escapes and manipulating host kernel access.
            </p>
          </div>
        </div>
      </div>

      {/* 
        Affiliate Integrity 
      */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="p-6 rounded-2xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            Operational Transparency & Integrity
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            While we operate the $9/mo Pro Intelligence tier, our free briefings occasionally contain vetted affiliate links. 
            <strong> We do not accept sponsored placements for tools we have not personally audited and run in production environments.</strong>
            {' '}If an endpoint solution or VPN cannot withstand our internal evasion testing, it never reaches your inbox. Period. Read our full <Link href="/privacy" className="text-cyan-600 dark:text-cyan-400 hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>

      {/* 
        Ultimate CTA 
      */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-32">
        <div className="p-10 rounded-3xl relative overflow-hidden text-center border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-xl dark:shadow-none">
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-50 dark:from-cyan-900/20 to-transparent pointer-events-none" />
          <div className="absolute top-0 right-0 p-32 opacity-10 pointer-events-none">
            <div className="w-64 h-64 border border-cyan-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Don&apos;t leave your perimeter to chance.</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Join 4,500+ CISOs, Security Engineers, and Red Teamers receiving the definitive briefing on agentic threat intelligence.
            </p>
            <div className="max-w-md mx-auto">
              <NewsletterForm variant="page" buttonText="Access the Briefing" source="about-page" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
