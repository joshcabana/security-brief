import { getAllArticles } from '@/lib/articles';
import { buildSiteUrl, siteDescription, siteName, siteUrl } from '@/lib/site';

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const articles = await getAllArticles();

  const items = articles
    .slice(0, 20)
    .map(
      (article) => `    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${buildSiteUrl(`/blog/${article.slug}`)}</link>
      <guid isPermaLink="true">${buildSiteUrl(`/blog/${article.slug}`)}</guid>
      <description>${escapeXml(article.excerpt)}</description>
      <pubDate>${new Date(article.date).toUTCString()}</pubDate>
      <category>${escapeXml(article.category)}</category>
    </item>`,
    )
    .join('\n');

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${siteUrl}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>en-au</language>
    <atom:link href="${buildSiteUrl('/feed.xml')}" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600',
    },
  });
}
