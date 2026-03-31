import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const replaceAffiliateLinksScript = path.join(process.cwd(), 'scripts', 'replace-affiliate-links.mjs');

async function createWorkspace(files: Record<string, string>) {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), 'replace-affiliate-links-'));

  for (const [relativePath, source] of Object.entries(files)) {
    const filePath = path.join(workspaceDir, relativePath);
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, source, 'utf8');
  }

  return {
    workspaceDir,
    async cleanup() {
      await rm(workspaceDir, { recursive: true, force: true });
    },
  };
}

function runReplaceAffiliateLinks(
  workspaceDir: string,
  args: string[] = [],
  env: Record<string, string | undefined> = {},
) {
  return spawnSync(process.execPath, [replaceAffiliateLinksScript, ...args], {
    cwd: workspaceDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: workspaceDir,
      ...env,
    },
  });
}

test('dry-run mode reports tokens without writing files', async () => {
  const workspace = await createWorkspace({
    'ops/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://example.com/nordvpn',
      PROTON: '',
    }, null, 2),
    'blog/security-stack.md': [
      '# Security Stack',
      '',
      'Use [AFFILIATE:NORDVPN] and [AFFILIATE:PROTON] today.',
      '',
    ].join('\n'),
    'drafts/newsletter.md': 'Draft token [AFFILIATE:NORDVPN]\n',
  });

  try {
    const before = await readFile(path.join(workspace.workspaceDir, 'blog', 'security-stack.md'), 'utf8');
    const draftBefore = await readFile(path.join(workspace.workspaceDir, 'drafts', 'newsletter.md'), 'utf8');
    const result = runReplaceAffiliateLinks(workspace.workspaceDir);
    const after = await readFile(path.join(workspace.workspaceDir, 'blog', 'security-stack.md'), 'utf8');
    const draftAfter = await readFile(path.join(workspace.workspaceDir, 'drafts', 'newsletter.md'), 'utf8');

    assert.equal(result.status, 0);
    assert.equal(after, before);
    assert.equal(draftAfter, draftBefore);
    assert.match(result.stdout, /Affiliate replacement mode: dry-run/);
    assert.match(result.stdout, /Affiliate replacement scope: blog only/);
    assert.match(result.stdout, /tokens found: 2/);
    assert.match(result.stdout, /tokens replaced: 1/);
    assert.match(result.stdout, /tokens skipped: 1/);
    assert.match(result.stdout, /wrote: dry-run/);
  } finally {
    await workspace.cleanup();
  }
});

test('--include-drafts processes draft tokens when drafts are present', async () => {
  const workspace = await createWorkspace({
    'ops/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://example.com/nordvpn',
      PROTON: '',
    }, null, 2),
    'blog/security-stack.md': 'Blog [AFFILIATE:NORDVPN]\n',
    'drafts/newsletter.md': 'Draft [AFFILIATE:NORDVPN] [AFFILIATE:PROTON]\n',
  });

  try {
    const result = runReplaceAffiliateLinks(workspace.workspaceDir, ['--write', '--include-drafts']);
    const blog = await readFile(path.join(workspace.workspaceDir, 'blog', 'security-stack.md'), 'utf8');
    const draft = await readFile(path.join(workspace.workspaceDir, 'drafts', 'newsletter.md'), 'utf8');

    assert.equal(result.status, 0);
    assert.equal(blog, 'Blog https://example.com/nordvpn\n');
    assert.equal(draft, 'Draft https://example.com/nordvpn [AFFILIATE:PROTON]\n');
    assert.match(result.stdout, /Affiliate replacement scope: blog \+ drafts/);
    assert.match(result.stdout, /blog\/security-stack\.md/);
    assert.match(result.stdout, /drafts\/newsletter\.md/);
    assert.match(result.stdout, /tokens found: 3/);
    assert.match(result.stdout, /tokens replaced: 2/);
    assert.match(result.stdout, /tokens skipped: 1/);
  } finally {
    await workspace.cleanup();
  }
});

test('--write mode replaces populated tokens across files and duplicates', async () => {
  const workspace = await createWorkspace({
    'ops/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://example.com/nordvpn',
      PROTON: 'https://example.com/proton',
    }, null, 2),
    'blog/one.md': 'One [AFFILIATE:NORDVPN] two [AFFILIATE:PROTON] three [AFFILIATE:NORDVPN]\n',
    'blog/two.md': 'Again [AFFILIATE:PROTON]\n',
  });

  try {
    const result = runReplaceAffiliateLinks(workspace.workspaceDir, ['--write']);
    const one = await readFile(path.join(workspace.workspaceDir, 'blog', 'one.md'), 'utf8');
    const two = await readFile(path.join(workspace.workspaceDir, 'blog', 'two.md'), 'utf8');

    assert.equal(result.status, 0);
    assert.equal(one, 'One https://example.com/nordvpn two https://example.com/proton three https://example.com/nordvpn\n');
    assert.equal(two, 'Again https://example.com/proton\n');
    assert.match(result.stdout, /tokens found: 4/);
    assert.match(result.stdout, /tokens replaced: 4/);
    assert.match(result.stdout, /tokens skipped: 0/);
  } finally {
    await workspace.cleanup();
  }
});

test('--include-drafts does not fail when drafts directory is missing', async () => {
  const workspace = await createWorkspace({
    'ops/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://example.com/nordvpn',
    }, null, 2),
    'blog/example.md': 'Blog [AFFILIATE:NORDVPN]\n',
  });

  try {
    const result = runReplaceAffiliateLinks(workspace.workspaceDir, ['--include-drafts']);

    assert.equal(result.status, 0);
    assert.match(result.stdout, /Affiliate replacement scope: blog \+ drafts/);
    assert.match(result.stdout, /files scanned: 1/);
    assert.match(result.stdout, /tokens found: 1/);
  } finally {
    await workspace.cleanup();
  }
});

test('local affiliate-links.json overrides the repo template when HOME is set', async () => {
  const workspace = await createWorkspace({
    'ops/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://repo.example/nordvpn',
    }, null, 2),
    'blog/example.md': 'Blog [AFFILIATE:NORDVPN]\n',
    '.ai-security-brief/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://local.example/nordvpn',
    }, null, 2),
  });

  try {
    const result = runReplaceAffiliateLinks(workspace.workspaceDir, ['--write'], {
      HOME: workspace.workspaceDir,
    });
    const updated = await readFile(path.join(workspace.workspaceDir, 'blog', 'example.md'), 'utf8');

    assert.equal(result.status, 0);
    assert.equal(updated, 'Blog https://local.example/nordvpn\n');
    assert.match(result.stdout, /Affiliate mapping source: ~\/\.ai-security-brief\/affiliate-links\.json/);
  } finally {
    await workspace.cleanup();
  }
});

test('AFFILIATE_LINKS_PATH takes precedence over local and repo mappings', async () => {
  const workspace = await createWorkspace({
    'ops/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://repo.example/nordvpn',
    }, null, 2),
    '.ai-security-brief/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://local.example/nordvpn',
    }, null, 2),
    'private/custom-links.json': JSON.stringify({
      NORDVPN: 'https://env.example/nordvpn',
    }, null, 2),
    'blog/example.md': 'Blog [AFFILIATE:NORDVPN]\n',
  });

  try {
    const result = runReplaceAffiliateLinks(workspace.workspaceDir, ['--write'], {
      HOME: workspace.workspaceDir,
      AFFILIATE_LINKS_PATH: 'private/custom-links.json',
    });
    const updated = await readFile(path.join(workspace.workspaceDir, 'blog', 'example.md'), 'utf8');

    assert.equal(result.status, 0);
    assert.equal(updated, 'Blog https://env.example/nordvpn\n');
    assert.match(result.stdout, /Affiliate mapping source: private\/custom-links\.json/);
  } finally {
    await workspace.cleanup();
  }
});

test('tokens with empty mappings are skipped in write mode', async () => {
  const workspace = await createWorkspace({
    'ops/affiliate-links.json': JSON.stringify({
      NORDVPN: '',
      PROTON: 'https://example.com/proton',
    }, null, 2),
    'blog/stack.md': 'Use [AFFILIATE:NORDVPN] and [AFFILIATE:PROTON].\n',
  });

  try {
    const result = runReplaceAffiliateLinks(workspace.workspaceDir, ['--write']);
    const updated = await readFile(path.join(workspace.workspaceDir, 'blog', 'stack.md'), 'utf8');

    assert.equal(result.status, 0);
    assert.equal(updated, 'Use [AFFILIATE:NORDVPN] and https://example.com/proton.\n');
    assert.match(result.stdout, /tokens found: 2/);
    assert.match(result.stdout, /tokens replaced: 1/);
    assert.match(result.stdout, /tokens skipped: 1/);
  } finally {
    await workspace.cleanup();
  }
});

test('missing affiliate-links.json exits with a clear error', async () => {
  const workspace = await createWorkspace({
    'blog/example.md': 'Use [AFFILIATE:NORDVPN].\n',
  });

  try {
    const result = runReplaceAffiliateLinks(workspace.workspaceDir, [], {
      HOME: path.join(workspace.workspaceDir, 'no-home'),
    });

    assert.equal(result.status, 1);
    assert.match(result.stderr, /Missing affiliate link mapping/);
    assert.match(result.stderr, /~\/\.ai-security-brief\/affiliate-links\.json/);
    assert.match(result.stderr, /ops\/affiliate-links\.json/);
  } finally {
    await workspace.cleanup();
  }
});

test('malformed JSON and missing blog directory exit clearly', async () => {
  const malformedWorkspace = await createWorkspace({
    'ops/affiliate-links.json': '{',
    'blog/example.md': 'Use [AFFILIATE:NORDVPN].\n',
  });
  const missingBlogWorkspace = await createWorkspace({
    'ops/affiliate-links.json': JSON.stringify({
      NORDVPN: 'https://example.com/nordvpn',
    }, null, 2),
  });

  try {
    const malformedResult = runReplaceAffiliateLinks(malformedWorkspace.workspaceDir);
    const missingBlogResult = runReplaceAffiliateLinks(missingBlogWorkspace.workspaceDir);

    assert.equal(malformedResult.status, 1);
    assert.match(malformedResult.stderr, /Invalid ops\/affiliate-links\.json/);

    assert.equal(missingBlogResult.status, 1);
    assert.match(missingBlogResult.stderr, /Missing blog directory/);
  } finally {
    await malformedWorkspace.cleanup();
    await missingBlogWorkspace.cleanup();
  }
});
