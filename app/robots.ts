import { MetadataRoute } from 'next';
import { buildSiteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/reports/'],
      },
    ],
    sitemap: buildSiteUrl('/sitemap.xml'),
  };
}
