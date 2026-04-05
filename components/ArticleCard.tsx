'use client';

import Link from 'next/link';
import type { ArticleAuthor } from '@/lib/articles';

export interface Article {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  category: string;
  categoryColor?: string;
  featured?: boolean;
  author?: ArticleAuthor | string;
}

interface ArticleCardProps {
  article: Article;
  variant?: 'default' | 'featured' | 'compact';
  index?: number;
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'AI Threats': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  'Privacy': { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/20' },
  'Endpoint Security': { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20' },
  'Zero Trust': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
  'Deepfakes': { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20' },
  'Ransomware': { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20' },
  'Vulnerability': { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20' },
};

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-AU', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return dateStr;
  }
}

export default function ArticleCard({ article, variant = 'default', index = 0 }: ArticleCardProps) {
  const colors = categoryColors[article.category] || categoryColors['Privacy'];

  if (variant === 'compact') {
    return (
      <Link href={`/blog/${article.slug}`} className="block group" aria-label={article.title}>
        <article className="flex gap-4 py-4 transition-all duration-200 border-b border-slate-800">
          <span className="flex-shrink-0 text-2xl font-mono font-bold text-slate-800" aria-hidden="true">
            {String(index + 1).padStart(2, '0')}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold leading-snug mb-1 text-slate-200 transition-colors duration-200">
              <span className="group-hover:text-cyan-400">{article.title}</span>
            </h3>
            <div className="flex items-center gap-3">
              <span className="text-xs text-slate-500">{formatDate(article.date)}</span>
              <span className="text-xs text-slate-500">{article.readTime}</span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  if (variant === 'featured') {
    return (
      <Link href={`/blog/${article.slug}`} className="block group h-full" aria-label={article.title}>
        <article
          className="relative h-full p-8 rounded-xl transition-all duration-300 overflow-hidden bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 hover:border-cyan-500/40 hover:shadow-[0_8px_32px_rgba(0,0,0,0.5),0_0_0_1px_rgba(34,211,238,0.15)] hover:-translate-y-1"
        >
          <div className="absolute top-0 right-0 w-24 h-24 opacity-10 bg-[radial-gradient(circle_at_top_right,var(--tw-gradient-stops))] from-cyan-400 to-transparent pointer-events-none" aria-hidden="true" />
          <div className="relative h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                {article.category}
              </span>
              {article.featured && (
                <span className="text-xs font-mono font-semibold px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  FEATURED
                </span>
              )}
            </div>
            <h3 className="text-xl font-bold mb-3 leading-snug text-white transition-colors duration-200">
              <span className="group-hover:text-cyan-400 transition-colors duration-200">{article.title}</span>
            </h3>
            <p className="text-sm leading-relaxed mb-6 line-clamp-3 text-slate-400">{article.excerpt}</p>
            <div className="flex items-center justify-between mt-auto pt-4">
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500">{formatDate(article.date)}</span>
                <span className="text-slate-800" aria-hidden="true">·</span>
                <span className="text-xs font-mono text-slate-500">{article.readTime}</span>
              </div>
              <span className="text-xs font-semibold flex items-center gap-1 text-slate-500 transition-all duration-200">
                Read
                <svg width="12" height="12" viewBox="0 0 16 16" fill="currentColor" className="group-hover:translate-x-1 transition-transform duration-200" aria-hidden="true">
                  <path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" />
                </svg>
              </span>
            </div>
          </div>
        </article>
      </Link>
    );
  }

  return (
    <Link href={`/blog/${article.slug}`} className="block group h-full" aria-label={article.title}>
      <article
        className="h-full p-6 flex flex-col rounded-xl transition-all duration-300 bg-slate-900 border border-slate-800 hover:border-cyan-500/35 hover:shadow-[0_4px_20px_rgba(0,0,0,0.4),0_0_0_1px_rgba(34,211,238,0.1)] hover:-translate-y-0.5"
      >
        <div className="mb-4">
          <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
            {article.category}
          </span>
        </div>
        <h3 className="text-base font-bold leading-snug mb-3 text-white transition-colors duration-200">
          <span className="group-hover:text-cyan-400 transition-colors duration-200">{article.title}</span>
        </h3>
        <p className="text-sm leading-relaxed mb-5 line-clamp-2 text-slate-400">{article.excerpt}</p>
        <div className="flex items-center gap-3 pt-4 border-t border-slate-800 mt-auto">
          <time dateTime={article.date} className="text-xs text-slate-500">{formatDate(article.date)}</time>
          <span className="text-slate-800" aria-hidden="true">·</span>
          <span className="text-xs font-mono text-slate-500">{article.readTime}</span>
          {article.author && (
            <>
              <span className="text-slate-800" aria-hidden="true">·</span>
              <span className="text-xs text-slate-500">{typeof article.author === 'string' ? article.author : article.author?.name}</span>
            </>
          )}
        </div>
      </article>
    </Link>
  );
}
