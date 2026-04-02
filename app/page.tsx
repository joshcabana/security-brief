import type { Metadata } from 'next';
import Link from 'next/link';
import ArticleCard from '@/components/ArticleCard';
import NewsletterForm from '@/components/NewsletterForm';
import Hero from '@/components/Hero';
import ToolsMatrix from '@/components/ToolsMatrix';
import { getAllArticles } from '@/lib/articles';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/',
  title: 'AI Security Brief — AI Threats, Privacy Tools & Security Briefings',
  description:
    'AI-assisted security briefings on AI-powered threats, privacy defence strategies, and security tools for technology professionals.',
});

export default async function HomePage() {
  const articles = await getAllArticles();
  const latestArticles = articles.slice(0, 4);

  return (
    <>
      {/* Redesigned Hero Section */}
      <Hero />

      <div className="h-px bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent" aria-hidden="true" />

      {/* Latest Briefings Section */}
      <section className="pt-12 pb-20 bg-slate-50 dark:bg-slate-900/30" aria-label="Latest briefings">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-12">
            <div>
              <div className="text-sm font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-3">Latest Briefings</div>
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">Intelligence Feed</h2>
            </div>
            <Link
              href="/blog"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors duration-200"
              aria-label="View all articles"
            >
              View all
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestArticles.map((article, index) => (
              <ArticleCard
                key={article.slug}
                article={article}
                variant={article.featured || index === 0 ? 'featured' : 'default'}
                index={index}
              />
            ))}
          </div>
          <div className="mt-10 sm:hidden text-center">
            <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 dark:text-cyan-400">
              View all articles
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Redesigned Tools Matrix Section */}
      <ToolsMatrix />

      {/* Embedded Newsletter Signup */}
      <section
        className="py-24 relative overflow-hidden bg-slate-900 dark:bg-slate-950 border-t border-slate-800"
        aria-label="Newsletter signup"
      >
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_50%,rgba(0,180,255,0.06)_0%,transparent_65%)]" aria-hidden="true" />
        <div className="absolute top-0 right-0 p-32 opacity-20 hidden lg:block">
           <div className="w-64 h-64 border border-cyan-500/20 rounded-full animate-pulse"></div>
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-4 flex justify-center">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-900/30 text-xs font-bold text-cyan-400 border border-cyan-800 shadow-[0_0_15px_rgba(8,145,178,0.2)]">
              Weekly briefings
            </span>
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-6">Get the next briefing in your inbox</h2>
          <p className="text-lg mb-10 text-slate-400">
            Weekly briefings on AI threats, privacy changes, and practical security tools worth your attention.
          </p>
          <div className="max-w-md mx-auto">
            <NewsletterForm
              variant="page"
              placeholder="your@work-email.com"
              buttonText="Subscribe free"
              source="homepage-cta"
            />
          </div>
        </div>
      </section>
    </>
  );
}
