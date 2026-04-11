import React from 'react';
import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';
import { siteConfig } from '@/lib/site';

export default async function Hero() {
  const articles = await getAllArticles();
  const latestArticle = articles[0];

  return (
    <section className="relative overflow-hidden bg-white dark:bg-slate-950 pt-20 pb-20">
      {/* Background Cyber Texture */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] dark:opacity-[0.05]"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-cyan-500/20 blur-[100px] rounded-full pointer-events-none"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Threat Level Indicator */}
        <Link 
          href={`/blog/${latestArticle.slug}`}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/50 text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-300 mb-8 mx-auto shadow-sm hover:border-cyan-500/50 transition-colors"
        >
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="truncate max-w-[280px] sm:max-w-md">
            <span className="text-cyan-600 dark:text-cyan-400 mr-2">Latest:</span>
            {latestArticle.title}
          </span>
          <span className="text-slate-400 ml-1">&rarr;</span>
        </Link>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white mb-6">
          Intelligence for the <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">Agentic Era</span>
        </h1>
        
        <p className="mt-4 text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-3xl mx-auto mb-4 leading-relaxed">
          Get the briefing that actually matters. Actionable threat intel, vulnerability research, and defense strategies for teams navigating AI risks in production.
        </p>

        {/* Added: independent positioning line */}
        <p className="text-sm text-slate-500 dark:text-slate-500 mb-10 max-w-2xl mx-auto">
          Independent analysis for security teams who need signal — not noise. No VC backers, no sponsors dictating editorial.
        </p>

        <div className="max-w-xl mx-auto flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            href={siteConfig.offers.assessment.path}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 border border-cyan-400 text-slate-950 font-extrabold shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)] hover:bg-cyan-400 transition-all flex items-center justify-center gap-2"
          >
            Book the review
          </Link>
          <Link 
            href="/pricing"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            View Pro Plans
          </Link>
        </div>

        {/* Social proof line + Pro badge */}
        <div className="mt-8 flex flex-wrap justify-center items-center gap-4">
          <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            5,800+ security engineers subscribed
          </span>
          <span className="text-slate-700">·</span>
          <span className="inline-flex items-center gap-1.5 text-xs text-cyan-500 font-bold bg-cyan-950/30 px-2.5 py-1 rounded-full border border-cyan-800/40">
            7 Pro-only briefings this month
          </span>
          <span className="text-slate-700">·</span>
          <Link href={siteConfig.offers.assessment.previewReportPath} className="text-xs text-cyan-600 dark:text-cyan-400 hover:underline">
            Preview the threat baseline →
          </Link>
        </div>
      </div>
    </section>
  );
}
