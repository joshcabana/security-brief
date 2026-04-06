/**
 * @typedef {object} PageMetadataInput
 * @property {`/${string}` | '/'} canonicalPath
 * @property {string} title
 * @property {string} description
 * @property {string=} openGraphTitle
 * @property {string=} openGraphDescription
 * @property {string=} twitterTitle
 * @property {string=} twitterDescription
 */

/**
 * @typedef {object} VerifiedPageMetadata
 * @property {`/${string}` | '/'} path
 * @property {`/${string}` | '/'} canonicalPath
 * @property {string=} ogDescription
 */

export const PRIVACY_ANALYTICS_DECLARATION =
  'This site uses Plausible Analytics, a privacy-focused, cookie-free analytics service that does not collect personal data.';

export const ANALYTICS_INTEGRATION_MARKERS = Object.freeze([
  'googletagmanager',
  'gtag(',
  'window.datalayer',
  '@vercel/analytics',
  'plausible.io',
  'umami',
  'fathom',
  'matomo',
  'posthog',
  'mixpanel',
  'amplitude',
  'hotjar',
  'clarity.ms',
  'heap.track',
]);

/** @type {readonly VerifiedPageMetadata[]} */
export const VERIFIED_PAGE_METADATA = Object.freeze([
  {
    path: '/',
    canonicalPath: '/',
  },
  {
    path: '/blog',
    canonicalPath: '/blog',
  },
  {
    path: '/privacy',
    canonicalPath: '/privacy',
  },
  {
    path: '/tools',
    canonicalPath: '/tools',
    ogDescription:
      'Curated security tools for AI-era defence: VPNs, password managers, encrypted email, and endpoint protection — with clear affiliate disclosure.',
  },
  {
    path: '/newsletter',
    canonicalPath: '/newsletter',
    ogDescription:
      'Free weekly briefings on AI-powered threats, privacy tool reviews, and defensive strategies for security teams and builders.',
  },
  {
    path: '/status',
    canonicalPath: '/status',
    ogDescription:
      'Public operational status for AI Security Brief: pinned main baseline, deployment context, and release verification signals.',
  },
]);

/**
 * @param {PageMetadataInput} input
 * @returns {import('next').Metadata}
 */
export function createPageMetadata(input) {
  /** @type {import('next').Metadata} */
  const metadata = {
    title: input.title,
    description: input.description,
    alternates: {
      canonical: input.canonicalPath,
    },
  };

  const openGraphDescription = input.openGraphDescription;
  const twitterTitle = input.twitterTitle;
  const twitterDescription = input.twitterDescription;

  if (input.openGraphTitle || openGraphDescription || twitterTitle || twitterDescription) {
    metadata.openGraph = {
      title: input.openGraphTitle ?? input.title,
      description: openGraphDescription ?? input.description,
      url: input.canonicalPath,
    };
    metadata.twitter = {
      title: twitterTitle ?? input.title,
      description: twitterDescription ?? openGraphDescription ?? input.description,
    };
  }

  return metadata;
}
