import assert from 'node:assert/strict';
import { mkdtemp, rm, utimes, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { getAffiliateUrl, getAffiliateUrlByPriority, replaceAffiliateTokens } from '../lib/affiliate-links';
import {
  getArticleCacheKey,
  getArticleCacheSignature,
  getArticleSourceCacheKey,
  parseArticleSource,
} from '../lib/articles';

test('getAffiliateUrl returns null for missing and blank environment values', () => {
  assert.equal(getAffiliateUrl('NORDVPN', {}), null);
  assert.equal(getAffiliateUrl('NORDVPN', { AFFILIATE_NORDVPN: '   ' }), null);
});

test('getAffiliateUrl trims configured environment values', () => {
  assert.equal(
    getAffiliateUrl('NORDVPN', { AFFILIATE_NORDVPN: ' https://example.com/nordvpn ' }),
    'https://example.com/nordvpn',
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

test('getAffiliateUrlByPriority returns the first configured affiliate url', () => {
  assert.equal(
    getAffiliateUrlByPriority(
      ['PROTON_VPN', 'PROTON'],
      {
        AFFILIATE_PROTON: 'https://example.com/proton',
        AFFILIATE_PROTON_VPN: 'https://example.com/proton-vpn',
      },
    ),
    'https://example.com/proton-vpn',
  );
});

test('getAffiliateUrlByPriority falls back to later configured affiliate urls', () => {
  assert.equal(
    getAffiliateUrlByPriority(
      ['PROTON_VPN', 'PROTON'],
      {
        AFFILIATE_PROTON: 'https://example.com/proton',
      },
    ),
    'https://example.com/proton',
  );
  assert.equal(getAffiliateUrlByPriority(['PROTON_VPN', 'PROTON'], {}), null);
});

test('getArticleSourceCacheKey changes when article content changes', async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), 'ai-security-brief-articles-'));
  const articlePath = path.join(tempDir, 'alpha.md');

  try {
    await writeFile(
      articlePath,
      [
        '---',
        'title: "Alpha"',
        'slug: "alpha"',
        'date: "2026-03-17"',
        'author: "AI Security Brief"',
        'excerpt: "Alpha excerpt."',
        'category: "AI Threats"',
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
        '---',
        '',
        '# Alpha',
        '',
        'Alpha content.',
      ].join('\n'),
    );

    const initialKey = await getArticleSourceCacheKey(tempDir);
    const fixedTimestamp = new Date('2026-03-17T00:00:00.000Z');
    await utimes(articlePath, fixedTimestamp, fixedTimestamp);

    await writeFile(
      articlePath,
      [
        '---',
        'title: "Alpha"',
        'slug: "alpha"',
        'date: "2026-03-17"',
        'author: "AI Security Brief"',
        'excerpt: "Alpha excerpt."',
        'category: "AI Threats"',
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
        '---',
        '',
        '# Alpha',
        '',
        'Bravo content update.',
      ].join('\n'),
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
      [
        '---',
        'title: "Alpha"',
        'slug: "alpha"',
        'date: "2026-03-17"',
        'author: "AI Security Brief"',
        'excerpt: "Alpha excerpt."',
        'category: "AI Threats"',
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
        '---',
        '',
        '# Alpha',
        '',
        'Alpha content.',
      ].join('\n'),
    );

    const signature = await getArticleCacheSignature(tempDir, {
      AFFILIATE_PUREVPN: ' https://example.com/purevpn ',
      AFFILIATE_NORDVPN: 'https://example.com/nordvpn',
      NEXT_PUBLIC_SITE_URL: 'https://ignored.example.com',
    });

    assert.deepEqual(signature, {
      sourceKey: await getArticleSourceCacheKey(tempDir),
      affiliateKey: 'AFFILIATE_NORDVPN=https://example.com/nordvpn\x00AFFILIATE_PUREVPN=https://example.com/purevpn',
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
      [
        '---',
        'title: "Alpha"',
        'slug: "alpha"',
        'date: "2026-03-17"',
        'author: "AI Security Brief"',
        'excerpt: "Alpha excerpt."',
        'category: "AI Threats"',
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
        '---',
        '',
        '# Alpha',
        '',
        'Alpha content.',
      ].join('\n'),
    );

    const baseSignature = await getArticleCacheSignature(tempDir, {
      AFFILIATE_NORDVPN: 'https://example.com/nordvpn',
    });
    const changedSignature = await getArticleCacheSignature(tempDir, {
      AFFILIATE_NORDVPN: 'https://example.com/nordvpn-updated',
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
      AFFILIATE_NORDVPN: 'https://example.com/nordvpn',
      AFFILIATE_PUREVPN: 'https://example.com/purevpn',
    },
  );

  assert.equal(
    result,
    'Use [NordVPN](https://example.com/nordvpn) and [PureVPN](https://example.com/purevpn).',
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
      AFFILIATE_NORDVPN: 'https://example.com/nordvpn',
    },
  );

  assert.equal(
    result,
    'Primary https://example.com/nordvpn secondary [AFFILIATE:PUREVPN].',
  );
});

test('parseArticleSource renders resolved affiliate links into article html for allowed categories', async () => {
  const previousNordVpnValue = process.env.AFFILIATE_NORDVPN;
  process.env.AFFILIATE_NORDVPN = 'https://example.com/nordvpn';

  try {
    const article = await parseArticleSource(
      'example.md',
      `---
title: "Example"
slug: "example"
date: "2026-03-17"
author: "AI Security Brief"
excerpt: "Example excerpt."
category: "Privacy Tools"
featured: false
meta_title: "Example Meta Title"
meta_description: "Example meta description."
keywords:
  - one
  - two
  - three
  - four
  - five
read_time: "5 min"
---

# Example

Use [NordVPN]([AFFILIATE:NORDVPN]) when you need it.
`,
    );

    assert.match(article.body, /\[NordVPN\]\(https:\/\/example\.com\/nordvpn\)/);
    assert.match(article.contentHtml, /href="https:\/\/example\.com\/nordvpn"/);
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
  process.env.AFFILIATE_NORDVPN = 'https://example.com/nordvpn';

  try {
    const article = await parseArticleSource(
      'example.md',
      `---
title: "Example"
slug: "example"
date: "2026-03-17"
author: "AI Security Brief"
excerpt: "Example excerpt."
category: "AI Threats"
featured: false
meta_title: "Example Meta Title"
meta_description: "Example meta description."
keywords:
  - one
  - two
  - three
  - four
  - five
read_time: "5 min"
---

# Example

Use [NordVPN]([AFFILIATE:NORDVPN]) when you need it.
`,
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
