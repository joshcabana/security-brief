import assert from 'node:assert/strict';
import test from 'node:test';
import {
  PRIVACY_ANALYTICS_DECLARATION,
  VERIFIED_PAGE_METADATA,
  createPageMetadata,
} from '../lib/page-metadata.mjs';

test('createPageMetadata applies a self-canonical path to static pages', () => {
  const metadata = createPageMetadata({
    canonicalPath: '/privacy',
    title: 'Privacy Policy',
    description: 'Privacy policy for AI Security Brief.',
  });

  assert.deepEqual(metadata.alternates, {
    canonical: '/privacy',
  });
  assert.equal(metadata.openGraph, undefined);
  assert.equal(metadata.twitter, undefined);
});

test('createPageMetadata preserves page-specific social metadata overrides', () => {
  const metadata = createPageMetadata({
    canonicalPath: '/newsletter',
    title: 'Newsletter — Weekly AI Threat Intelligence & Security Briefings',
    description: 'Subscribe to the newsletter.',
    openGraphDescription:
      'Free weekly briefings on AI-powered threats, privacy tool reviews, and defensive strategies for security teams and builders.',
    twitterTitle: 'AI Security Brief Newsletter',
    twitterDescription:
      'Free weekly briefings on AI-powered threats, privacy tool reviews, and defensive strategies for security teams.',
  });

  assert.deepEqual(metadata.openGraph, {
    title: 'Newsletter — Weekly AI Threat Intelligence & Security Briefings',
    description:
      'Free weekly briefings on AI-powered threats, privacy tool reviews, and defensive strategies for security teams and builders.',
    url: '/newsletter',
  });
  assert.deepEqual(metadata.twitter, {
    title: 'AI Security Brief Newsletter',
    description:
      'Free weekly briefings on AI-powered threats, privacy tool reviews, and defensive strategies for security teams.',
  });
});

test('verified metadata and privacy analytics declarations match the live contract', () => {
  assert.deepEqual(VERIFIED_PAGE_METADATA, [
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
  assert.match(PRIVACY_ANALYTICS_DECLARATION, /plausible analytics/i);
});
