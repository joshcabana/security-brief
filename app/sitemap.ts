import { MetadataRoute } from 'next';
import { getAllArticles, getAllReviewArticles } from '@/lib/articles';
import { buildSiteUrl, siteUrl } from '@/lib/site';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getAllArticles();
  const reviews = await getAllReviewArticles();

  const articleEntries = articles.map((article) => ({
    url: buildSiteUrl(`/blog/${article.slug}`),
    lastModified: new Date(article.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const reviewEntries = reviews.map((article) => ({
    url: buildSiteUrl(article.routePath),
    lastModified: new Date(article.lastSubstantiveUpdateAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: buildSiteUrl('/blog'), lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: buildSiteUrl('/reviews'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: buildSiteUrl('/pricing'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: buildSiteUrl('/matrix'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: buildSiteUrl('/pro'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: buildSiteUrl('/assessment'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: buildSiteUrl('/tools'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: buildSiteUrl('/newsletter'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: buildSiteUrl('/status'), lastModified: new Date(), changeFrequency: 'weekly', priority: 0.4 },
    { url: buildSiteUrl('/about'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.5 },
    { url: buildSiteUrl('/privacy'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    { url: buildSiteUrl('/terms'), lastModified: new Date(), changeFrequency: 'monthly', priority: 0.3 },
    ...articleEntries,
    ...reviewEntries,
  ];
}
