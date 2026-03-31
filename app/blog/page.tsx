import type { Metadata } from 'next';
import Link from 'next/link';
import ArticleCard from '@/components/ArticleCard';
import { getAllArticles, getArticleCategories } from '@/lib/articles';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/blog',
  title: 'Blog — AI Threats, Privacy & Cybersecurity Analysis',
  description:
    'In-depth analysis of AI-powered cyber threats, privacy defence strategies, vulnerability disclosures, and security tool reviews.',
});

interface BlogPageProps {
  searchParams?: Promise<{ category?: string }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  const params = await searchParams;
  const articles = await getAllArticles();
  const categories = ['All', ...(await getArticleCategories())];
  const activeCategory = categories.includes(params?.category || '') ? params?.category || 'All' : 'All';
  const filteredArticles =
    activeCategory === 'All'
      ? articles
      : articles.filter((article) => article.category === activeCategory);

  const featuredArticle =
    activeCategory === 'All' ? filteredArticles.find((article) => article.featured) ?? filteredArticles[0] : null;
  const regularArticles =
    activeCategory === 'All' && featuredArticle
      ? filteredArticles.filter((article) => article.slug !== featuredArticle.slug)
      : filteredArticles;

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #080c11, #0d1117)',
          borderBottom: '1px solid #21262d',
          paddingTop: '3.5rem',
          paddingBottom: '3.5rem',
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">Briefing Archive</div>
          <h1 className="text-white mb-4">AI Threats, Privacy &amp; Analysis</h1>
          <p className="text-lg max-w-2xl" style={{ color: '#8b949e' }}>
            Long-form briefings on AI-powered threats, privacy defence, and security tooling, with citations and practical context for technical teams.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="flex items-center gap-2 flex-wrap mb-10 pb-8"
          style={{ borderBottom: '1px solid #21262d' }}
          role="navigation"
          aria-label="Filter articles by category"
        >
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <Link
                key={category}
                href={category === 'All' ? '/blog' : `/blog?category=${encodeURIComponent(category)}`}
                className="px-4 py-1.5 rounded-full text-xs font-mono font-semibold transition-all duration-200"
                style={{
                  background: isActive ? 'rgba(0,180,255,0.12)' : 'rgba(22,27,34,0.8)',
                  border: isActive ? '1px solid rgba(0,180,255,0.4)' : '1px solid #30363d',
                  color: isActive ? '#00b4ff' : '#8b949e',
                }}
                aria-current={isActive ? 'true' : undefined}
              >
                {category}
              </Link>
            );
          })}
        </div>

        {featuredArticle ? (
          <div className="mb-10">
            <div className="section-label mb-4">Featured</div>
            <div className="max-w-3xl">
              <ArticleCard article={featuredArticle} variant="featured" index={0} />
            </div>
          </div>
        ) : null}

        {regularArticles.length > 0 ? (
          <>
            <div className="section-label mb-6">
              {activeCategory === 'All' ? 'All Articles' : activeCategory}
              <span className="ml-2 text-xs" style={{ color: '#484f58' }}>
                ({filteredArticles.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {regularArticles.map((article, index) => (
                <ArticleCard
                  key={article.slug}
                  article={article}
                  variant="default"
                  index={index}
                />
              ))}
            </div>
          </>
        ) : (
          <div
            className="text-center py-20 rounded-xl"
            style={{ background: '#161b22', border: '1px solid #30363d' }}
          >
            <p className="text-lg font-medium text-white mb-2">No articles in this category yet</p>
            <p className="text-sm" style={{ color: '#8b949e' }}>
              Browse the full archive or check back for the next briefing.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
