import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import NewsletterForm from '@/components/NewsletterForm';
import RepurposeCTA from '@/components/RepurposeCTA';
import { generateArticleSchema } from '@/lib/seo';
import ShareButtons from '@/components/ShareButtons';
import PaywallCTA from '@/components/PaywallCTA';
import AccountabilityBox from '@/components/AccountabilityBox';
import { getAllArticles, getArticleBySlug } from '@/lib/articles';
import { siteUrl, siteName } from '@/lib/site';
import { serializeJsonForHtml } from '@/lib/json-escape.mjs';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

// Article bodies embed affiliate URLs that are sourced from runtime env vars.
// Render them dynamically so monetization links stay aligned with current
// production config instead of being frozen into the build artifact.
export const dynamic = 'force-dynamic';

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-AU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const categoryColors: Record<string, { bg: string; text: string; border: string }> = {
  'AI Threats': { bg: 'rgba(248,81,73,0.08)', text: '#f85149', border: 'rgba(248,81,73,0.2)' },
  Privacy: { bg: 'rgba(0,180,255,0.08)', text: '#00b4ff', border: 'rgba(0,180,255,0.2)' },
};

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return { title: 'Article Not Found' };
  }

  const articleUrl = `${siteUrl}/blog/${article.slug}`;

  return {
    title: article.metaTitle,
    description: article.metaDescription,
    keywords: article.keywords,
    alternates: {
      canonical: articleUrl,
    },
    openGraph: {
      title: article.metaTitle,
      description: article.metaDescription,
      type: 'article',
      publishedTime: article.date,
      authors: [typeof article.author === 'string' ? article.author : article.author?.name ?? ''],
      url: articleUrl,
    },
    twitter: {
      card: 'summary_large_image',
      title: article.metaTitle,
      description: article.metaDescription,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const allArticles = await getAllArticles();
  const relatedArticles = allArticles
    .filter((candidate) => candidate.slug !== article.slug)
    .sort((left, right) => {
      const categoryBoost = Number(right.category === article.category) - Number(left.category === article.category);
      if (categoryBoost !== 0) {
        return categoryBoost;
      }

      return new Date(right.date).getTime() - new Date(left.date).getTime();
    })
    .slice(0, 3);
  const colors = categoryColors[article.category] || categoryColors.Privacy;
  const tags = [article.category, ...article.keywords.slice(0, 2)];

  const articleUrl = `${siteUrl}/blog/${article.slug}`;

  const articleJsonLd = generateArticleSchema({
    title: article.title,
    description: article.excerpt,
    datePublished: article.date,
    authorName: typeof article.author === 'string' ? article.author : article.author?.name,
    authorUrl: siteUrl,
    publisherName: siteName,
    publisherUrl: siteUrl,
    url: articleUrl,
    category: article.category,
    keywords: article.keywords,
    wordCount: article.body.split(/\s+/).length,
  });

  return (
    <div className="bg-slate-900 dark:bg-slate-950 min-h-screen">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonForHtml(articleJsonLd) }}
      />
      <header className="relative overflow-hidden bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800 py-14">
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-mono mb-6" aria-label="Breadcrumb">
            <Link href="/" className="text-slate-500 transition-colors hover:text-cyan-400">Home</Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <Link href="/blog" className="text-slate-500 transition-colors hover:text-cyan-400">Blog</Link>
            <span className="text-slate-700" aria-hidden="true">/</span>
            <span className="text-slate-400 truncate max-w-48">{article.title}</span>
          </nav>
          <div className="mb-5">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded border" style={{ background: colors.bg, color: colors.text, borderColor: colors.border }}>{article.category}</span>
          </div>
          <h1 className="text-white font-black leading-tight mb-6 tracking-tight">{article.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a.5.5 0 01.5.5v.793l.646-.647a.5.5 0 01.708.708L9 3.207V3.5a.5.5 0 01-1 0v-.293L7.146 4.06a.5.5 0 01-.708-.708L7 2.793V1.5A.5.5 0 018 1zm0 2a5 5 0 100 10A5 5 0 008 3zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" /></svg>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
            </div>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{article.readTime}</span>
            <span aria-hidden="true">·</span>
            <span>{typeof article.author === 'string' ? article.author : article.author?.name}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
          <article>
            <p className="text-lg text-slate-300 leading-relaxed mb-8 pb-8 border-b border-slate-800 italic">{article.excerpt}</p>
            <div
              className="prose-dark text-slate-200"
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
            <AccountabilityBox reviewerName={typeof article.author === 'string' ? article.author : article.author?.name} />
            {article.isPaywalled && <PaywallCTA />}
            <div className="flex flex-wrap gap-2 mt-12 pt-8 border-t border-slate-800">
              <span className="text-xs text-slate-500 self-center">Filed under:</span>
              {tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-slate-800">
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-cyan-400">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M15 8a.5.5 0 00-.5-.5H2.707l3.147-3.146a.5.5 0 10-.708-.708l-4 4a.5.5 0 000 .708l4 4a.5.5 0 00.708-.708L2.707 8.5H14.5A.5.5 0 0015 8z" /></svg>
                Back to all articles
              </Link>
              <ShareButtons title={article.title} slug={article.slug} />
            </div>
            <RepurposeCTA title={article.title} url={articleUrl} />
          </article>

          <aside className="space-y-6" aria-label="Article sidebar">
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs font-mono uppercase tracking-[0.12em] mb-3 text-cyan-400">Stay Briefed</div>
              <h3 className="text-base font-bold text-white mb-2">Get weekly briefings</h3>
              <p className="text-sm text-slate-400 mb-5">Join the weekly briefing for new threat analysis, privacy updates, and practical tooling notes.</p>
              <NewsletterForm variant="default" buttonText="Subscribe" source="article-inline" />
            </div>
            <div className="p-6 rounded-xl bg-slate-900 border border-slate-800">
              <div className="text-xs font-mono uppercase tracking-[0.12em] mb-4 text-slate-400">Article Stats</div>
              <div className="space-y-3">
                {[
                  { label: 'Read time', value: article.readTime },
                  { label: 'Published', value: formatDate(article.date) },
                  { label: 'Category', value: article.category },
                  { label: 'Keywords', value: article.keywords.length.toString() },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{item.label}</span>
                    <span className="text-xs font-mono font-medium text-slate-400">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gradient-to-br from-cyan-900/10 to-transparent border border-cyan-900/30">
              <div className="text-xs font-mono uppercase mb-3 text-cyan-400">Recommended</div>
              <h3 className="text-sm font-bold text-white mb-2">Security tools</h3>
              <p className="text-xs text-slate-400 mb-4">Recommended tools may include affiliate links and are selected to match the threats and privacy topics covered in the archive.</p>
              <Link href="/tools" className="text-xs font-semibold flex items-center gap-1 transition-colors text-cyan-400">
                Browse tools
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" /></svg>
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-16 pt-12 border-t border-slate-800">
          <div className="section-label mb-6">Related Briefings</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {relatedArticles.map((relatedArticle, index) => (
              <ArticleCard key={relatedArticle.slug} article={relatedArticle} variant="default" index={index} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
