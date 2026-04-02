import React from 'react';
import NewsletterForm from '@/components/NewsletterForm';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950 pt-24 pb-32">
      {/* Background Cyber Texture */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Threat Level Indicator */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 text-sm font-bold text-slate-800 dark:text-slate-300 mb-8 mx-auto shadow-sm">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          Latest: Autonomous Agent Sandbox Escape Zero-Day
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Intelligence for the <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Agentic Era</span>
        </h1>
        
        <p className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-10 leading-relaxed">
          Get the briefing that actually matters. Actionable threat intel, vulnerability research, and defense strategies for teams navigating AI risks in production.
        </p>
        
        <div className="max-w-xl mx-auto relative group flex flex-col sm:flex-row items-center gap-4 justify-center">
          <div className="relative w-full sm:w-auto flex-1">
            <NewsletterForm
              variant="hero"
              placeholder="Enter your email address"
              buttonText="Subscribe Free"
              source="homepage-hero"
            />
          </div>
          <a href="#" className="w-full sm:w-auto px-6 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold transition-all flex items-center justify-center gap-2 whitespace-nowrap shadow-[0_0_15px_rgba(0,180,255,0.15)]">
             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-file-down"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M12 18v-6"/><path d="M9 15l3 3 3-3"/></svg>
             Download 2026 Threat PDF
          </a>
        </div>
        <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-500">Join 4,500+ security professionals. No fluff, just signal.</p>
      </div>
    </section>
  );
}
