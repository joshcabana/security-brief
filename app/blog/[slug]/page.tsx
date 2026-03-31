import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ArticleCard from '@/components/ArticleCard';
import NewsletterForm from '@/components/NewsletterForm';
import ShareButtons from '@/components/ShareButtons';
import { getAllArticles, getArticleBySlug } from '@/lib/articles';
import { siteUrl, siteName } from '@/lib/site';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

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
      authors: [article.author],
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

  const articleJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.excerpt,
    datePublished: article.date,
    author: {
      '@type': 'Organization',
      name: article.author,
      url: siteUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: siteName,
      url: siteUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/blog/${article.slug}`,
    },
    keywords: article.keywords.join(', '),
    articleSection: article.category,
    wordCount: article.body.split(/\s+/).length,
  };

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <header className="relative overflow-hidden" style={{ background: 'linear-gradient(to bottom, #080c11, #0d1117)', borderBottom: '1px solid #21262d', paddingTop: '3.5rem', paddingBottom: '3.5rem' }}>
        <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-2 text-xs font-mono mb-6" aria-label="Breadcrumb">
            <Link href="/" className="text-[#484f58] transition-colors hover:text-[#00b4ff]">Home</Link>
            <span style={{ color: '#30363d' }} aria-hidden="true">/</span>
            <Link href="/blog" className="text-[#484f58] transition-colors hover:text-[#00b4ff]">Blog</Link>
            <span style={{ color: '#30363d' }} aria-hidden="true">/</span>
            <span style={{ color: '#8b949e' }} className="truncate max-w-48">{article.title}</span>
          </nav>
          <div className="mb-5">
            <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded" style={{ background: colors.bg, color: colors.text, border: `1px solid ${colors.border}` }}>{article.category}</span>
          </div>
          <h1 className="text-white font-black leading-tight mb-6" style={{ letterSpacing: '-0.025em' }}>{article.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm" style={{ color: '#484f58' }}>
            <div className="flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M8 1a.5.5 0 01.5.5v.793l.646-.647a.5.5 0 01.708.708L9 3.207V3.5a.5.5 0 01-1 0v-.293L7.146 4.06a.5.5 0 01-.708-.708L7 2.793V1.5A.5.5 0 018 1zm0 2a5 5 0 100 10A5 5 0 008 3zM1.5 8a6.5 6.5 0 1113 0 6.5 6.5 0 01-13 0z" /></svg>
              <time dateTime={article.date}>{formatDate(article.date)}</time>
            </div>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{article.readTime}</span>
            <span aria-hidden="true">·</span>
            <span>{article.author}</span>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-12">
          <article>
            <p className="text-lg leading-relaxed mb-8 pb-8" style={{ color: '#c9d1d9', borderBottom: '1px solid #21262d', fontStyle: 'italic' }}>{article.excerpt}</p>
            <div
              className="prose-dark"
              style={{ color: '#e6edf3' }}
              dangerouslySetInnerHTML={{ __html: article.contentHtml }}
            />
            <div className="flex flex-wrap gap-2 mt-12 pt-8" style={{ borderTop: '1px solid #21262d' }}>
              <span className="text-xs" style={{ color: '#484f58', alignSelf: 'center' }}>Filed under:</span>
              {tags.map((tag) => (
                <span key={tag} className="tag">{tag}</span>
              ))}
            </div>
            <div className="flex items-center justify-between mt-8 pt-6" style={{ borderTop: '1px solid #21262d' }}>
              <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-[#8b949e] transition-colors hover:text-[#00b4ff]">
                <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M15 8a.5.5 0 00-.5-.5H2.707l3.147-3.146a.5.5 0 10-.708-.708l-4 4a.5.5 0 000 .708l4 4a.5.5 0 00.708-.708L2.707 8.5H14.5A.5.5 0 0015 8z" /></svg>
                Back to all articles
              </Link>
              <ShareButtons title={article.title} slug={article.slug} />
            </div>
          </article>

          <aside className="space-y-6" aria-label="Article sidebar">
            <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-3" style={{ color: '#00b4ff', letterSpacing: '0.12em' }}>Stay Briefed</div>
              <h3 className="text-base font-bold text-white mb-2">Get weekly briefings</h3>
              <p className="text-sm mb-5" style={{ color: '#8b949e' }}>Join the weekly briefing for new threat analysis, privacy updates, and practical tooling notes.</p>
              <NewsletterForm variant="default" buttonText="Subscribe" source="article-inline" />
            </div>
            <div className="p-6 rounded-xl" style={{ background: '#161b22', border: '1px solid #30363d' }}>
              <div className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#8b949e', letterSpacing: '0.12em' }}>Article Stats</div>
              <div className="space-y-3">
                {[
                  { label: 'Read time', value: article.readTime },
                  { label: 'Published', value: formatDate(article.date) },
                  { label: 'Category', value: article.category },
                  { label: 'Keywords', value: article.keywords.length.toString() },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between items-center">
                    <span className="text-xs" style={{ color: '#484f58' }}>{item.label}</span>
                    <span className="text-xs font-mono font-medium" style={{ color: '#8b949e' }}>{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(0,180,255,0.05) 0%, rgba(0,180,255,0.02) 100%)', border: '1px solid rgba(0,180,255,0.2)' }}>
              <div className="text-xs font-mono uppercase mb-3" style={{ color: '#00b4ff' }}>Recommended</div>
              <h3 className="text-sm font-bold text-white mb-2">Security tools</h3>
              <p className="text-xs mb-4" style={{ color: '#8b949e' }}>Recommended tools may include affiliate links and are selected to match the threats and privacy topics covered in the archive.</p>
              <Link href="/tools" className="text-xs font-semibold flex items-center gap-1 transition-colors" style={{ color: '#00b4ff' }}>
                Browse tools
                <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path fillRule="evenodd" d="M1 8a.5.5 0 01.5-.5h11.793l-3.147-3.146a.5.5 0 01.708-.708l4 4a.5.5 0 010 .708l-4 4a.5.5 0 01-.708-.708L13.293 8.5H1.5A.5.5 0 011 8z" /></svg>
              </Link>
            </div>
          </aside>
        </div>

        <div className="mt-16 pt-12" style={{ borderTop: '1px solid #21262d' }}>
          <div className="section-label mb-6">Related Intelligence</div>
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
