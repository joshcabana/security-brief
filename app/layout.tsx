import type { Metadata } from 'next';
import Script from 'next/script';
import { Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import AffiliateBanner from '@/components/AffiliateBanner';
import { getSiteUrl, siteDescription, siteName, siteUrl } from '@/lib/site';
import { resolveAnalyticsState } from '@/lib/analytics-config.mjs';



const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
  display: 'swap',
  weight: ['400', '500', '700'],
});

export const metadata: Metadata = {
  title: {
    default: `${siteName} — AI Threats, Privacy Tools & Security Briefings`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  keywords: [
    'AI security',
    'cybersecurity',
    'AI threats',
    'privacy tools',
    'endpoint protection',
    'security briefings',
    'AI privacy',
    'security brief',
    'VPN',
    'zero trust',
  ],
  authors: [{ name: siteName }],
  creator: siteName,
  metadataBase: getSiteUrl(),
  alternates: {
    types: {
      'application/rss+xml': `${siteUrl}/feed.xml`,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_AU',
    siteName,
    title: `${siteName} — AI Threats, Privacy Tools & Security Briefings`,
    description: siteDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: siteName,
    description: siteDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const analyticsState = resolveAnalyticsState(
    process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN,
    process.env.NEXT_PUBLIC_LINKEDIN_PARTNER_ID,
  );

  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark`}
      suppressHydrationWarning
    >
      <head>
        <link rel="alternate" type="application/rss+xml" title={siteName} href={`${siteUrl}/feed.xml`} />
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebSite',
              name: siteName,
              url: siteUrl,
              description: siteDescription,
              creator: {
                '@type': 'Organization',
                name: siteName,
                url: siteUrl,
              },
            }),
          }}
        />
      </head>
      <body
        className="min-h-screen flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-200 antialiased selection:bg-cyan-500/30"
      >
        <AffiliateBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        {analyticsState.plausibleEnabled ? (
          <Script
            defer
            data-domain={analyticsState.plausibleDomain}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        ) : null}
        {analyticsState.linkedInInsightEnabled ? (
          <Script
            id="linkedin-insight"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                _linkedin_partner_id = "${analyticsState.linkedInPartnerId}";
                window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
                window._linkedin_data_partner_ids.push(_linkedin_partner_id);
                (function(l) {
                if (!l){window.lintrk = function(a,b){window.lintrk.q.push([a,b])};
                window.lintrk.q=[]}
                var s = document.getElementsByTagName("script")[0];
                var b = document.createElement("script");
                b.type = "text/javascript";b.async = true;
                b.src = "https://snap.licdn.com/li.lms-analytics/insight.min.js";
                s.parentNode.insertBefore(b, s);})(window.lintrk);
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
