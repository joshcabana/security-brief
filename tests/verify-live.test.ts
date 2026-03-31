import assert from 'node:assert/strict';
import test from 'node:test';
import {
  assertAffiliateAnchor,
  assertBodyIncludesAll,
  getDeploymentProtectionHeaders,
  getTokenizedAffiliateArticleChecks,
  mergeRequestHeaders,
  resolveCanonicalBaseUrl,
} from '../scripts/verify-live.mjs';

test('getDeploymentProtectionHeaders returns no headers when no bypass secret is configured', () => {
  assert.deepEqual(getDeploymentProtectionHeaders(''), {});
});

test('getDeploymentProtectionHeaders returns the Vercel bypass header when a secret is configured', () => {
  assert.deepEqual(getDeploymentProtectionHeaders('preview-bypass-secret'), {
    'x-vercel-protection-bypass': 'preview-bypass-secret',
  });
});

test('getDeploymentProtectionHeaders falls back to Vercel automation bypass secret env var', () => {
  const originalAutomationBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET;

  process.env.VERCEL_AUTOMATION_BYPASS_SECRET = 'automation-bypass-secret';

  try {
    assert.deepEqual(getDeploymentProtectionHeaders(), {
      'x-vercel-protection-bypass': 'automation-bypass-secret',
    });
  } finally {
    if (originalAutomationBypassSecret === undefined) {
      delete process.env.VERCEL_AUTOMATION_BYPASS_SECRET;
      return;
    }

    process.env.VERCEL_AUTOMATION_BYPASS_SECRET = originalAutomationBypassSecret;
  }
});

test('mergeRequestHeaders preserves Vercel bypass headers when no additional headers are provided', () => {
  assert.deepEqual(mergeRequestHeaders(undefined, getDeploymentProtectionHeaders('preview-bypass-secret')), {
    'x-vercel-protection-bypass': 'preview-bypass-secret',
  });
});

test('mergeRequestHeaders keeps the Vercel bypass header alongside request-specific headers', () => {
  assert.deepEqual(
    mergeRequestHeaders(
      {
        'content-type': 'application/json',
      },
      getDeploymentProtectionHeaders('preview-bypass-secret'),
    ),
    {
      'x-vercel-protection-bypass': 'preview-bypass-secret',
      'content-type': 'application/json',
    },
  );
});

test('resolveCanonicalBaseUrl uses an explicit override when provided', () => {
  assert.equal(
    resolveCanonicalBaseUrl(
      'https://preview.example.vercel.app/',
      'https://aithreatbrief.com/',
    ),
    'https://aithreatbrief.com',
  );
});

test('resolveCanonicalBaseUrl falls back to the request base url when no override is provided', () => {
  assert.equal(resolveCanonicalBaseUrl('https://preview.example.vercel.app/', null), 'https://preview.example.vercel.app');
});

test('assertBodyIncludesAll accepts bodies containing every required snippet', () => {
  assert.doesNotThrow(() => {
    assertBodyIncludesAll(
      'href="https://go.nordvpn.net/aff_c?offer_id=15&amp;aff_id=143381&amp;url_id=902"',
      ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
      'NordVPN live affiliate link',
    );
  });
});

test('assertBodyIncludesAll throws when a required snippet is missing', () => {
  assert.throws(
    () => {
      assertBodyIncludesAll(
        'href="https://go.nordvpn.net/aff_c?offer_id=15&amp;url_id=902"',
        ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
        'NordVPN live affiliate link',
      );
    },
    /missing expected snippet: aff_id=143381/,
  );
});

test('assertAffiliateAnchor accepts a rendered affiliate anchor', () => {
  assert.doesNotThrow(() => {
    assertAffiliateAnchor(
      '<p>Use <a href="https://go.nordvpn.net/aff_c?offer_id=15&amp;aff_id=143381&amp;url_id=902">NordVPN</a> on analyst devices.</p>',
      'NordVPN',
      ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
      '/blog/agentic-ai-security-risks',
    );
  });
});

test('assertAffiliateAnchor matches the tools-page anchor text and aria-label', () => {
  assert.doesNotThrow(() => {
    assertAffiliateAnchor(
      '<a href="https://go.nordvpn.net/aff_c?offer_id=15&amp;aff_id=143381&amp;url_id=902" aria-label="Visit NordVPN vendor site (opens in new tab)">Visit vendor site</a>',
      'NordVPN',
      ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
      '/tools NordVPN affiliate link',
      {
        anchorText: 'Visit vendor site',
        ariaLabel: 'Visit NordVPN vendor site (opens in new tab)',
      },
    );
  });
});

test('assertAffiliateAnchor rejects anchors with extra visible text', () => {
  assert.throws(
    () => {
      assertAffiliateAnchor(
        '<a href="https://go.nordvpn.net/aff_c?offer_id=15&amp;aff_id=143381&amp;url_id=902" aria-label="Visit NordVPN vendor site (opens in new tab)">Visit vendor site now</a>',
        'NordVPN',
        ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
        '/tools NordVPN affiliate link',
        {
          anchorText: 'Visit vendor site',
          ariaLabel: 'Visit NordVPN vendor site (opens in new tab)',
        },
      );
    },
    /missing a rendered affiliate anchor for NordVPN with text Visit vendor site/,
  );
});

test('assertAffiliateAnchor rejects plain-text brand mentions', () => {
  assert.throws(
    () => {
      assertAffiliateAnchor(
        '<p>Use NordVPN on analyst devices.</p>',
        'NordVPN',
        ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
        '/blog/agentic-ai-security-risks',
      );
    },
    /missing a rendered affiliate anchor for NordVPN/,
  );
});

test('assertAffiliateAnchor rejects tools anchors with the wrong aria-label', () => {
  assert.throws(
    () => {
      assertAffiliateAnchor(
        '<a href="https://go.nordvpn.net/aff_c?offer_id=15&amp;aff_id=143381&amp;url_id=902" aria-label="Visit NordVPN vendor site">Visit vendor site</a>',
        'NordVPN',
        ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
        '/tools NordVPN affiliate link',
        {
          anchorText: 'Visit vendor site',
          ariaLabel: 'Visit NordVPN vendor site (opens in new tab)',
        },
      );
    },
    /expected Visit NordVPN vendor site \(opens in new tab\)/,
  );
});

test('getTokenizedAffiliateArticleChecks derives checks from supplied tokenized source markdown', async () => {
  const articles = [
    { slug: 'gamma-no-token', fileName: 'gamma-no-token.md' },
    { slug: 'alpha-token', fileName: 'alpha-token.md' },
    { slug: 'beta-token', fileName: 'beta-token.md' },
  ];
  const markdownByFile = new Map([
    ['gamma-no-token.md', 'No affiliate tokens here.'],
    ['alpha-token.md', 'Use [NordVPN]([AFFILIATE:NORDVPN]) now.'],
    ['beta-token.md', 'Also recommend [NordVPN]([AFFILIATE:NORDVPN]) here.'],
  ]);

  const checks = getTokenizedAffiliateArticleChecks(
    articles,
    'NORDVPN',
    'NordVPN',
    ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
    (article: { fileName: string }) => markdownByFile.get(article.fileName) ?? '',
  );

  assert.equal(checks.length, 2);
  assert.deepEqual(
    new Set(checks.map((check) => check.path)),
    new Set(['/blog/alpha-token', '/blog/beta-token']),
  );
  assert.deepEqual(
    new Set(checks.map((check) => check.name)),
    new Set(['article-affiliate-link:alpha-token', 'article-affiliate-link:beta-token']),
  );

  await assert.doesNotReject(async () => {
    await checks[0].assert({
      status: 200,
      async text() {
        return '<a href="https://go.nordvpn.net/aff_c?offer_id=15&amp;aff_id=143381&amp;url_id=902">NordVPN</a>';
      },
    });
  });
});

test('getTokenizedAffiliateArticleChecks throws when no published articles include the token marker', () => {
  assert.throws(
    () => {
      getTokenizedAffiliateArticleChecks(
        [
          { slug: 'one', fileName: 'one.md' },
          { slug: 'two', fileName: 'two.md' },
        ],
        'NORDVPN',
        'NordVPN',
        ['https://go.nordvpn.net/aff_c?', 'aff_id=143381'],
        () => 'No affiliate tokens here.',
      );
    },
    /No published articles in content-manifest\.json reference \[AFFILIATE:NORDVPN\]\./,
  );
});
