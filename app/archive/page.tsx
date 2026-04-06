import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllArticles } from '@/lib/articles';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { Lock, Zap } from 'lucide-react';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/archive',
  title: 'Briefing Archive | AI Security Brief',
  description: 'Access the full 2026 archive of AI Security Brief issues. Technical deep-dives, prompt injection tear-downs, and security tools.',
});

export default async function ArchivePage() {
  const articles = await getAllArticles();

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      
      {/* Hero Header */}
      <div className="relative overflow-hidden pt-20 pb-16 bg-slate-900 border-b border-slate-800">
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
            Intelligence Archive
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Browse the complete repository of technical deep-dives and advisory briefings.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        
        {/* VIP Pro Upsell Banner */}
        <div className="bg-gradient-to-r from-cyan-900/40 to-slate-900 border border-cyan-500/30 rounded-2xl p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden shadow-2xl">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-cyan-500/10 blur-3xl rounded-full"></div>
          <div className="flex-1 relative z-10">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-cyan-500/20 border border-cyan-500/30 text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-3">
              <Zap size={12} /> Pro Intelligence
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-2">Upgrade for Early Access & Threat POCs</h2>
            <p className="text-sm text-slate-400 max-w-xl leading-relaxed">
              Free subscribers receive high-level summaries. Pro members get 48-hour early access, the actual exploit scripts, mitigation code, and exclusive vendor discounts.
            </p>
          </div>
          <div className="relative z-10 shrink-0 w-full md:w-auto">
            <Link 
              href="/upgrade" 
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 bg-cyan-500 hover:bg-cyan-400 hover:shadow-[0_0_20px_rgba(34,211,238,0.3)] text-slate-950 font-bold rounded-xl transition-all"
            >
              <Lock size={16} /> Unlock Pro Access
            </Link>
          </div>
        </div>

        {/* 14 Issues simple list */}
        <div className="mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
          <h3 className="text-lg font-bold text-white">All Issues ({articles.length})</h3>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {articles.map((article) => (
            <Link 
              href={`/blog/${article.slug}`} 
              key={article.slug}
              className="group bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
            >
              <div>
                <h4 className="text-base font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">
                  {article.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
                  <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-700"></span>
                  <span>{article.category}</span>
                </div>
              </div>
              <div className="shrink-0">
                <span className="text-xs font-bold text-slate-600 group-hover:text-cyan-500 transition-colors flex items-center gap-1">
                  Read <span className="text-cyan-500/0 group-hover:text-cyan-500 transition-colors">&rarr;</span>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
