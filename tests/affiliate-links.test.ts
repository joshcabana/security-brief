import assert from 'node:assert/strict';
import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getAffiliateUrl, getAffiliateUrlByPriority, replaceAffiliateTokens } from '../lib/affiliate-links';
import { normalizeOutboundUrl } from '../lib/url-safety.mjs';
import {
  getArticleCacheKey,
  getArticleCacheSignature,
  getArticleSourceCacheKey,
  parseArticleSource,
} from '../lib/articles';

function buildArticleSource(body: string, category = 'AI Threats'): string {
  const section = category === 'Privacy Tools' ? 'review' : 'editorial';
  const monetization = section === 'review' ? 'affiliate' : 'none';

  return [
    '---',
    'title: "Alpha"',
    'slug: "alpha"',
    'date: "2026-03-17"',
    'author:',
    '  name: "Josh Cabana"',
    '  role: "Editor & Publisher"',
    'excerpt: "Alpha excerpt."',
    `category: "${category}"`,
    'featured: false',
    'meta_title: "Alpha Meta Title"',
    'meta_description: "Alpha meta description."',
    'keywords:',
    '  - one',
    '  - two',
    '  - three',
    '  - four',
    '  - five',
    'read_time: "5 min"',
    `section: "${section}"`,
    `monetization: "${monetization}"`,
    'reviewed_by: "PENDING_HUMAN_REVIEW"',
    'reviewed_at: "PENDING_HUMAN_REVIEW"',
    'last_substantive_update_at: "2026-03-17"',
    'primarySources:',
    '  - url: "https://example.com/source-one"',
    '    title: "Primary source one"',
    '  - url: "https://example.com/source-two"',
    '    title: "Primary source two"',
    '  - url: "https://example.com/source-three"',
    '    title: "Primary source three"',
    '---',
    '',
    '# Alpha',
    '',
    body,
  ].join('\n');
}

test('getAffiliateUrl returns null for missing and blank environment values', () => {
  assert.equal(getAffiliateUrl('NORDVPN', {}), null);
  assert.equal(getAffiliateUrl('NORDVPN', { AFFILIATE_NORDVPN: '   ' }), null);
});

test('getAffiliateUrl trims configured environment values', () => {
  assert.equal(
    getAffiliateUrl('NORDVPN', { AFFILIATE_NORDVPN: ' https://go.nordvpn.net/aff_c?aff_id=143381 ' }),
    'https://go.nordvpn.net/aff_c?aff_id=143381',
  );
});

test('getAffiliateUrl returns null for malformed urls with unresolved placeholders', () => {
  assert.equal(
    getAffiliateUrl(
      'PROTON_VPN',
      {
        AFFILIATE_PROTON_VPN:
          'https://go.getproton.me/aff_c?offer_id=32&aff_id=2914&url_id=471&ad_id={eventId}&pubcid={pubcid}',
      },
    ),
    null,
  );
});

test('getAffiliateUrl returns null for invalid urls', () => {
  assert.equal(getAffiliateUrl('NORDVPN', { AFFILIATE_NORDVPN: 'not-a-url' }), null);
});

test('getAffiliateUrl rejects insecure http affiliate urls', () => {
  assert.equal(getAffiliateUrl('NORDVPN', { AFFILIATE_NORDVPN: 'http://go.nordvpn.net/aff_c?aff_id=143381' }), null);
});

test('getAffiliateUrl rejects hostname mismatches and credentialed urls', () => {
  assert.equal(getAffiliateUrl('NORDVPN', { AFFILIATE_NORDVPN: 'https://attacker.example/nordvpn' }), null);
  assert.equal(getAffiliateUrl('PUREVPN', { AFFILIATE_PUREVPN: 'https://user:pass@www.purevpn.com/order' }), null);
});

test('normalizeOutboundUrl only allows absolute https targets without placeholders', () => {
  assert.equal(normalizeOutboundUrl(' https://example.com/vendor '), 'https://example.com/vendor');
  assert.equal(normalizeOutboundUrl('https://example.com/vendor\\n'), 'https://example.com/vendor');
  assert.equal(normalizeOutboundUrl('http://example.com/vendor'), null);
  assert.equal(normalizeOutboundUrl('javascript:alert(1)'), null);
  assert.equal(normalizeOutboundUrl('https://example.com/{placeholder}'), null);
});

test('getAffiliateUrlByPriority returns the first configured affiliate url', () => {
  assert.equal(
    getAffiliateUrlByPriority(
        ['PROTON_VPN', 'PROTON'],
      {
        AFFILIATE_PROTON: 'https://go.getproton.me/aff_c?url_id=471',
        AFFILIATE_PROTON_VPN: 'https://go.getproton.me/aff_c?url_id=471',
      },
    ),
    'https://go.getproton.me/aff_c?url_id=471',
  );
});

test('getAffiliateUrlByPriority falls back to later configured affiliate urls', () => {
  assert.equal(
    getAffiliateUrlByPriority(
        ['PROTON_VPN', 'PROTON'],
      {
        AFFILIATE_PROTON: 'https://go.getproton.me/aff_c?url_id=471',
      },
    ),
    'https://go.getproton.me/aff_c?url_id=471',
  );
  assert.equal(getAffiliateUrlByPriority(['PROTON_VPN', 'PROTON'], {}), null);
});

test('getArticleSourceCacheKey changes when article content changes', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ai-security-brief-articles-'));
  const articlePath = path.join(tempDir, 'alpha.md');

  try {
    await writeFile(
      articlePath,
      buildArticleSource('Alpha content.'),
    );

    const initialKey = await getArticleSourceCacheKey(tempDir);
    const fixedTimestamp = new Date('2026-03-17T00:00:00.000Z');
    await utimes(articlePath, fixedTimestamp, fixedTimestamp);

    await writeFile(
      articlePath,
      buildArticleSource('Bravo content update.'),
    );
    await utimes(articlePath, fixedTimestamp, fixedTimestamp);

    const updatedKey = await getArticleSourceCacheKey(tempDir);

    assert.notEqual(initialKey, updatedKey);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('getArticleCacheSignature keeps source and affiliate invalidation explicit', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ai-security-brief-signature-'));

  try {
    await writeFile(
      path.join(tempDir, 'alpha.md'),
      buildArticleSource('Alpha content.'),
    );

    const signature = await getArticleCacheSignature(tempDir, {
      AFFILIATE_PUREVPN: ' https://www.purevpn.com/order-now.php?affiliate_id=49384204 ',
      AFFILIATE_NORDVPN: 'https://go.nordvpn.net/aff_c?aff_id=143381',
      NEXT_PUBLIC_SITE_URL: 'https://ignored.example.com',
    });

    assert.deepEqual(signature, {
      sourceKey: await getArticleSourceCacheKey(tempDir),
      affiliateKey:
        'AFFILIATE_NORDVPN=https://go.nordvpn.net/aff_c?aff_id=143381\x00AFFILIATE_PUREVPN=https://www.purevpn.com/order-now.php?affiliate_id=49384204',
    });
    assert.equal(getArticleCacheKey(signature), `${signature.sourceKey}\u0000${signature.affiliateKey}`);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('getArticleCacheSignature changes when affiliate env values change', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ai-security-brief-affiliate-'));

  try {
    await writeFile(
      path.join(tempDir, 'alpha.md'),
      buildArticleSource('Alpha content.'),
    );

    const baseSignature = await getArticleCacheSignature(tempDir, {
      AFFILIATE_NORDVPN: 'https://go.nordvpn.net/aff_c?aff_id=143381',
    });
    const changedSignature = await getArticleCacheSignature(tempDir, {
      AFFILIATE_NORDVPN: 'https://nordvpn.com/special-offer',
    });

    assert.notEqual(baseSignature.affiliateKey, changedSignature.affiliateKey);
    assert.equal(baseSignature.sourceKey, changedSignature.sourceKey);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test('replaceAffiliateTokens resolves configured markdown affiliate links', () => {
  const result = replaceAffiliateTokens(
    'Use [NordVPN]([AFFILIATE:NORDVPN]) and [PureVPN]([AFFILIATE:PUREVPN]).',
    {
      AFFILIATE_NORDVPN: 'https://go.nordvpn.net/aff_c?aff_id=143381',
      AFFILIATE_PUREVPN: 'https://www.purevpn.com/order-now.php?affiliate_id=49384204',
    },
  );

  assert.equal(
    result,
    'Use [NordVPN](https://go.nordvpn.net/aff_c?aff_id=143381) and [PureVPN](https://www.purevpn.com/order-now.php?affiliate_id=49384204).',
  );
});

test('replaceAffiliateTokens degrades markdown links to plain text when env vars are missing', () => {
  const result = replaceAffiliateTokens(
    'Use [NordVPN]([AFFILIATE:NORDVPN]) today.',
    {},
  );

  assert.equal(result, 'Use NordVPN today.');
});

test('replaceAffiliateTokens only resolves bare placeholders with configured urls', () => {
  const result = replaceAffiliateTokens(
    'Primary [AFFILIATE:NORDVPN] secondary [AFFILIATE:PUREVPN].',
    {
      AFFILIATE_NORDVPN: 'https://go.nordvpn.net/aff_c?aff_id=143381',
    },
  );

  assert.equal(
    result,
    'Primary https://go.nordvpn.net/aff_c?aff_id=143381 secondary [AFFILIATE:PUREVPN].',
  );
});

test('parseArticleSource renders resolved affiliate links into article html for allowed categories', async () => {
  const previousNordVpnValue = process.env.AFFILIATE_NORDVPN;
  process.env.AFFILIATE_NORDVPN = 'https://go.nordvpn.net/aff_c?aff_id=143381';

  try {
    const article = await parseArticleSource(
      'example.md',
      buildArticleSource('Use [NordVPN]([AFFILIATE:NORDVPN]) when you need it.', 'Privacy Tools')
        .replace('# Alpha', '# Example')
        .replace('title: "Alpha"', 'title: "Example"')
        .replace('slug: "alpha"', 'slug: "example"')
        .replace('excerpt: "Alpha excerpt."', 'excerpt: "Example excerpt."')
        .replace('meta_title: "Alpha Meta Title"', 'meta_title: "Example Meta Title"')
        .replace('meta_description: "Alpha meta description."', 'meta_description: "Example meta description."'),
    );

    assert.match(article.body, /\[NordVPN\]\(https:\/\/go\.nordvpn\.net\/aff_c\?aff_id=143381\)/);
    assert.match(article.contentHtml, /href="https:\/\/go\.nordvpn\.net\/aff_c\?aff_id=143381"/);
  } finally {
    if (typeof previousNordVpnValue === 'string') {
      process.env.AFFILIATE_NORDVPN = previousNordVpnValue;
    } else {
      delete process.env.AFFILIATE_NORDVPN;
    }
  }
});

test('parseArticleSource strips affiliate links for AI Threats category', async () => {
  const previousNordVpnValue = process.env.AFFILIATE_NORDVPN;
  process.env.AFFILIATE_NORDVPN = 'https://go.nordvpn.net/aff_c?aff_id=143381';

  try {
    const article = await parseArticleSource(
      'example.md',
      buildArticleSource('Use [NordVPN]([AFFILIATE:NORDVPN]) when you need it.')
        .replace('# Alpha', '# Example')
        .replace('title: "Alpha"', 'title: "Example"')
        .replace('slug: "alpha"', 'slug: "example"')
        .replace('excerpt: "Alpha excerpt."', 'excerpt: "Example excerpt."')
        .replace('meta_title: "Alpha Meta Title"', 'meta_title: "Example Meta Title"')
        .replace('meta_description: "Alpha meta description."', 'meta_description: "Example meta description."'),
    );

    assert.equal(article.body, '# Example\n\nUse NordVPN when you need it.');
    assert.match(article.contentHtml, /<p>Use NordVPN when you need it.<\/p>/);
  } finally {
    if (typeof previousNordVpnValue === 'string') {
      process.env.AFFILIATE_NORDVPN = previousNordVpnValue;
    } else {
      delete process.env.AFFILIATE_NORDVPN;
    }
  }
});
