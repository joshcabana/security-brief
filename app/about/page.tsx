import type { Metadata } from 'next';
import Link from 'next/link';
import NewsletterForm from '@/components/NewsletterForm';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { siteConfig } from '@/lib/site';
import { Target, ServerCrash, ShieldCheck, Award } from 'lucide-react';
import React from 'react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/about',
  title: 'About Josh Cabana — AI Security Brief',
  description:
    'Operator-led AI security briefings and fixed-scope readiness reviews for teams shipping agents, copilots, and LLM workflows.',
});

export default function AboutPage() {
  const assessment = siteConfig.offers.assessment;
  const waysToWork = [
    {
      title: assessment.name,
      price: assessment.priceLabel,
      detail:
        'A fixed-scope review for teams that need a threat map, top risks, remediation memo, and a 60-minute readout within 7 business days.',
      href: assessment.path,
      label: 'View the readiness review',
      featured: true,
    },
    {
      title: 'Prompt Injection / Agent Risk Workshop',
      price: assessment.workshopPriceLabel,
      detail:
        'A shorter working session for teams that need operator-led alignment on the most likely agentic failure paths before they scale usage.',
      href: assessment.previewReportPath,
      label: 'Preview the research angle',
      featured: false,
    },
    {
      title: 'Fractional AI Security Advisor',
      price: assessment.retainerPriceLabel,
      detail:
        'Ongoing advisory support for technical founders and security leaders who want continuity after the initial review.',
      href: assessment.path,
      label: 'Start with the initial review',
      featured: false,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200">
      {/* 
        Hero Section 
      */}
      <div className="relative overflow-hidden pt-20 pb-12 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[linear-gradient(to_bottom,#020617,#0f172a)]">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05] pointer-events-none" aria-hidden="true" />
        <div className="absolute top-0 right-0 w-2/3 h-full pointer-events-none bg-[radial-gradient(ellipse_at_80%_0%,rgba(6,182,212,0.06)_0%,transparent_60%)]" aria-hidden="true" />
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-xs font-bold text-cyan-600 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 shadow-[0_0_15px_rgba(8,145,178,0.2)] mb-6">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            Operator-Led Analysis
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight mb-6 text-slate-900 dark:text-white">
            We don&apos;t summarize the news.<br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-blue-600">We unpack the actual risk.</span>
          </h1>
          <p className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto leading-relaxed">
            AI Security Brief is an independent briefing publication and founder-led advisory practice for CISOs, AppSec leads, and technical teams shipping agentic systems.
          </p>
        </div>
      </div>

      {/* 
        Author / Founder Profile Section 
      */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-[1fr_2fr] gap-12 items-start">
          <div className="relative">
            {/* Visual placeholder for Author Image */}
            <div className="aspect-square bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden relative shadow-[0_0_40px_rgba(6,182,212,0.1)] flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-950">
              <div className="text-7xl font-extrabold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-cyan-400 to-blue-600 drop-shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                JC
              </div>
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xl">
              <div className="flex flex-col gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                     <Award className="text-cyan-500 dark:text-cyan-400 w-4 h-4"/>
                     <span className="text-sm font-bold text-slate-900 dark:text-white">Josh Cabana</span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">Founder & Lead Security Analyst</div>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <a href={siteConfig.founder.linkedInUrl} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn Profile" className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" /></svg>
                  </a>
                  <a href={siteConfig.founder.xUrl} target="_blank" rel="noopener noreferrer" aria-label="X Profile" className="p-1.5 rounded-md bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white">Why trust this brief?</h2>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed text-lg">
              AI Security Brief focuses on AI application security, privacy tooling, and defensive engineering for teams evaluating real-world AI risk before an incident forces the conversation.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              The goal is straightforward: publish concise briefings, turn those findings into operator-ready recommendations, and help teams prioritize the highest-risk failure modes in agents, copilots, and LLM-enabled workflows.
            </p>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              When articles include tool recommendations or affiliate links, those disclosures are called out in the article and in the privacy policy. When teams need direct help, the flagship offer is a fixed-scope readiness review rather than an open-ended unpaid audit.
            </p>
            
            <div className="flex flex-wrap gap-3 pt-4">
              <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-cyan-600 dark:text-cyan-400 font-mono">Offensive ML</span>
              <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-cyan-600 dark:text-cyan-400 font-mono">Red Teaming</span>
              <span className="px-3 py-1 rounded bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 text-sm text-cyan-600 dark:text-cyan-400 font-mono">Vulnerability Research</span>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-2">
              <Link
                href={assessment.path}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                Book the readiness review
              </Link>
              <Link
                href={assessment.previewReportPath}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors"
              >
                Preview the report
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-800 to-transparent" aria-hidden="true" />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">How to work with Josh</h2>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            The publication builds trust. The assessment is the main offer for the next 90 days. Pro remains the self-serve layer for readers who want deeper content without hands-on advisory.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {waysToWork.map((item) => (
            <div
              key={item.title}
              className={`rounded-2xl border p-6 shadow-sm ${item.featured ? 'bg-slate-900 text-white border-cyan-500/40 shadow-[0_0_40px_rgba(34,211,238,0.08)]' : 'bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100'}`}
            >
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold">{item.title}</h3>
                <span className={`text-xs font-mono px-2.5 py-1 rounded-full border ${item.featured ? 'border-cyan-400/40 text-cyan-300 bg-cyan-500/10' : 'border-slate-200 dark:border-slate-700 text-cyan-600 dark:text-cyan-400 bg-slate-50 dark:bg-slate-800/70'}`}>
                  {item.price}
                </span>
              </div>
              <p className={`text-sm leading-relaxed mb-5 ${item.featured ? 'text-slate-300' : 'text-slate-600 dark:text-slate-400'}`}>
                {item.detail}
              </p>
              <Link
                href={item.href}
                className={`inline-flex items-center text-sm font-semibold ${item.featured ? 'text-cyan-300 hover:text-cyan-200' : 'text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300'}`}
              >
                {item.label} →
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* 
        Methodology & Coverage Matrix
      */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 text-center">Our Coverage Matrix</h2>
        <p className="text-slate-600 dark:text-slate-400 text-center mb-12 max-w-2xl mx-auto">The three recurring coverage areas across the briefing.</p>
        
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
            Operational Transparency & Disclosure
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            AI Security Brief is independently run. Some free briefings contain disclosed affiliate links, and those disclosures are documented in the article and in the <Link href="/privacy" className="text-cyan-600 dark:text-cyan-400 hover:underline">Privacy Policy</Link>.
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
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white mb-4">Get the weekly brief or start with a fixed-scope review.</h2>
            <p className="text-slate-600 dark:text-slate-400 text-lg mb-8 max-w-2xl mx-auto">
              Subscribe for weekly briefings on AI security risks, defensive controls, and tooling coverage, or move straight to the readiness review if you need operator-led guidance now.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Link
                href={assessment.path}
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 transition-colors"
              >
                View the readiness review
              </Link>
              <Link
                href="/subscribe"
                className="inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 transition-colors"
              >
                Subscribe free
              </Link>
            </div>
            <div className="max-w-md mx-auto">
              <NewsletterForm variant="page" buttonText="Subscribe to the Briefing" source="about-page" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
