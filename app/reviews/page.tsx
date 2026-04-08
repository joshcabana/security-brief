import type { Metadata } from 'next';
import Link from 'next/link';
import ArticleCard from '@/components/ArticleCard';
import { getAllReviewArticles, getArticleCategories } from '@/lib/articles';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/reviews',
  title: 'Reviews — Privacy & AI Security Tool Comparisons',
  description:
    'Commercial reviews and comparisons for privacy and AI security tooling, with explicit affiliate disclosure and source-backed analysis.',
  openGraphDescription:
    'Commercial reviews and comparisons for privacy and AI security tooling, with explicit affiliate disclosure.',
});

interface ReviewsPageProps {
  searchParams?: Promise<{ category?: string }>;
}

export default async function ReviewsPage({ searchParams }: ReviewsPageProps) {
  const params = await searchParams;
  const reviews = await getAllReviewArticles();
  const categories = ['All', ...(await getArticleCategories('review'))];
  const activeCategory = categories.includes(params?.category || '') ? params?.category || 'All' : 'All';
  const filteredReviews =
    activeCategory === 'All'
      ? reviews
      : reviews.filter((article) => article.category === activeCategory);

  const featuredReview =
    activeCategory === 'All' ? filteredReviews.find((article) => article.featured) ?? filteredReviews[0] : null;
  const regularReviews =
    activeCategory === 'All' && featuredReview
      ? filteredReviews.filter((article) => article.slug !== featuredReview.slug)
      : filteredReviews;

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
          <div className="section-label mb-3">Commercial Reviews</div>
          <h1 className="text-white mb-4">Privacy &amp; AI Security Tool Reviews</h1>
          <p className="text-lg max-w-2xl" style={{ color: '#8b949e' }}>
            Source-backed comparisons for VPNs, password managers, LLM firewalls, and adjacent tooling. Commercial content stays isolated here with explicit affiliate disclosure.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div
          className="rounded-xl px-5 py-4 mb-8"
          style={{ background: '#161b22', border: '1px solid #30363d' }}
        >
          <p className="text-sm text-slate-300">
            Reviews may include affiliate links. The editorial archive and newsletter remain separate from this commercial section.
          </p>
        </div>

        <div
          className="flex items-center gap-2 flex-wrap mb-10 pb-8"
          style={{ borderBottom: '1px solid #21262d' }}
          role="navigation"
          aria-label="Filter reviews by category"
        >
          {categories.map((category) => {
            const isActive = category === activeCategory;
            return (
              <Link
                key={category}
                href={category === 'All' ? '/reviews' : `/reviews?category=${encodeURIComponent(category)}`}
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

        {featuredReview ? (
          <div className="mb-10">
            <div className="section-label mb-4">Featured</div>
            <div className="max-w-3xl">
              <ArticleCard article={featuredReview} variant="featured" index={0} />
            </div>
          </div>
        ) : null}

        {regularReviews.length > 0 ? (
          <>
            <div className="section-label mb-6">
              {activeCategory === 'All' ? 'All Reviews' : activeCategory}
              <span className="ml-2 text-xs" style={{ color: '#484f58' }}>
                ({filteredReviews.length})
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 stagger">
              {regularReviews.map((article, index) => (
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
            <p className="text-lg font-medium text-white mb-2">No reviews in this category yet</p>
            <p className="text-sm" style={{ color: '#8b949e' }}>
              Browse the complete review archive or check back for the next comparison.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
