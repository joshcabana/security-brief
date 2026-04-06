export function generateArticleSchema({
  title,
  description,
  datePublished,
  authorName,
  authorUrl,
  publisherName,
  publisherUrl,
  url,
  category,
  keywords,
  wordCount,
}: {
  title: string;
  description: string;
  datePublished: string;
  authorName: string;
  authorUrl: string;
  publisherName: string;
  publisherUrl: string;
  url: string;
  category: string;
  keywords: string[];
  wordCount: number;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description: description,
    datePublished: datePublished,
    author: {
      '@type': 'Organization',
      name: authorName,
      url: authorUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: publisherName,
      url: publisherUrl,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    keywords: keywords.join(', '),
    articleSection: category,
    wordCount: wordCount,
  };
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
  if (!faqs || faqs.length === 0) return null;
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// 10 high-intent long tail keywords to target across content updates
export const TARGET_KEYWORDS = [
  'best LLM firewall 2026',
  'preventing prompt injection attacks',
  'how to secure AI agents',
  'zero trust for AI workloads',
  'SOC2 compliance for AI companies',
  'VPN for privacy and dark web research',
  'CISO guide to generative AI risks',
  'open source active directory attack tools',
  'Mullvad VPN vs Tailscale enterprise',
  'automated pentesting with AI agents',
];
