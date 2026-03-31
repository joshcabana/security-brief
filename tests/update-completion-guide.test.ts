import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import path from 'node:path';
import test from 'node:test';

const updateCompletionGuideScript = path.join(process.cwd(), 'scripts', 'update-completion-guide.py');

async function createWorkspace(html: string) {
  const workspaceDir = await mkdtemp(path.join(tmpdir(), 'update-completion-guide-'));
  const guidePath = path.join(workspaceDir, 'guide.html');
  await writeFile(guidePath, html, 'utf8');

  return {
    guidePath,
    async cleanup() {
      await rm(workspaceDir, { recursive: true, force: true });
    },
  };
}

function runUpdateCompletionGuide(
  guidePath: string,
  env: Record<string, string | undefined> = {},
) {
  const childEnv: NodeJS.ProcessEnv = { ...process.env, PYTHONDONTWRITEBYTECODE: '1' };

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete childEnv[key];
    } else {
      childEnv[key] = value;
    }
  }

  return spawnSync('python3', [updateCompletionGuideScript, guidePath], {
    encoding: 'utf8',
    env: childEnv,
  });
}

test('update-completion-guide handles Beehiiv evidence safely', async (t) => {
  const originalHtml = [
    '<html>',
    '<body>',
    '<span>ACTION REQUIRED</span> Task 1: Send First Newsletter via Beehiiv',
    '<h3>Publish Issue #5 from draft</h3>',
    '<p>~5 min · HIGH PRIORITY</p>',
    '<p>Your newsletter infrastructure is fully wired and ready to send to your subscriber list.</p>',
    '<p>Complete the 5 manual tasks above.</p>',
    '<p>Analysis generated 26 March 2026</p>',
    '</body>',
    '</html>',
    '',
  ].join('\n');

  await t.test('no evidence stays inert when values are absent or blank', async () => {
    const absentWorkspace = await createWorkspace(originalHtml);

    try {
      const absentResult = runUpdateCompletionGuide(absentWorkspace.guidePath);
      const absentHtml = await readFile(absentWorkspace.guidePath, 'utf8');

      assert.equal(absentResult.status, 0);
      assert.equal(absentHtml, originalHtml);
      assert.match(
        absentResult.stdout,
        /No Beehiiv publication evidence supplied; leaving the completion guide unchanged\./,
      );
    } finally {
      await absentWorkspace.cleanup();
    }

    const blankWorkspace = await createWorkspace(originalHtml);

    try {
      const blankResult = runUpdateCompletionGuide(blankWorkspace.guidePath, {
        BEEHIIV_PUBLICATION_URL: '   ',
        BEEHIIV_PUBLISHED_AT: '  ',
        BEEHIIV_POST_TITLE: '\t',
      });
      const blankHtml = await readFile(blankWorkspace.guidePath, 'utf8');

      assert.equal(blankResult.status, 0);
      assert.equal(blankHtml, originalHtml);
      assert.match(
        blankResult.stdout,
        /No Beehiiv publication evidence supplied; leaving the completion guide unchanged\./,
      );
    } finally {
      await blankWorkspace.cleanup();
    }
  });

  await t.test('partial or invalid evidence exits non-zero without mutating the guide', async () => {
    const partialWorkspace = await createWorkspace(originalHtml);

    try {
      const partialResult = runUpdateCompletionGuide(partialWorkspace.guidePath, {
        BEEHIIV_PUBLICATION_URL: 'https://app.beehiiv.com/posts/83e59c21-6673-413e-a1d4-53fdd632fe1c',
        BEEHIIV_PUBLISHED_AT: '26 March 2026 1:19 PM AEDT',
        BEEHIIV_POST_TITLE: ' ',
      });
      const partialHtml = await readFile(partialWorkspace.guidePath, 'utf8');

      assert.notEqual(partialResult.status, 0);
      assert.equal(partialHtml, originalHtml);
      assert.match(partialResult.stderr, /Partial Beehiiv publication evidence supplied\./);
      assert.match(partialResult.stderr, /BEEHIIV_POST_TITLE/);
    } finally {
      await partialWorkspace.cleanup();
    }

    const invalidUrlWorkspace = await createWorkspace(originalHtml);

    try {
      const invalidUrlResult = runUpdateCompletionGuide(invalidUrlWorkspace.guidePath, {
        BEEHIIV_PUBLICATION_URL: 'https://example.com/posts/83e59c21-6673-413e-a1d4-53fdd632fe1c',
        BEEHIIV_PUBLISHED_AT: '26 March 2026 1:19 PM AEDT',
        BEEHIIV_POST_TITLE: 'Issue #5',
      });
      const invalidUrlHtml = await readFile(invalidUrlWorkspace.guidePath, 'utf8');

      assert.notEqual(invalidUrlResult.status, 0);
      assert.equal(invalidUrlHtml, originalHtml);
      assert.match(invalidUrlResult.stderr, /Invalid Beehiiv publication URL\./);
    } finally {
      await invalidUrlWorkspace.cleanup();
    }
  });

  await t.test('valid evidence is escaped before writing to the guide', async () => {
    const hostileWorkspace = await createWorkspace(originalHtml);

    try {
      const hostileResult = runUpdateCompletionGuide(hostileWorkspace.guidePath, {
        BEEHIIV_PUBLICATION_URL: 'https://app.beehiiv.com/posts/83e59c21-6673-413e-a1d4-53fdd632fe1c',
        BEEHIIV_PUBLISHED_AT: '26 March 2026 1:19 PM AEDT<script>',
        BEEHIIV_POST_TITLE: 'Issue #5 <img src=x onerror=alert(1)>',
      });
      const hostileHtml = await readFile(hostileWorkspace.guidePath, 'utf8');

      assert.equal(hostileResult.status, 0);
      assert.match(hostileResult.stdout, /Publication evidence applied successfully\./);
      assert.match(hostileHtml, /Issue #5 &lt;img src=x onerror=alert\(1\)&gt;/);
      assert.match(hostileHtml, /Newsletter published 26 March 2026 1:19 PM AEDT&lt;script&gt;/);
      assert.match(
        hostileHtml,
        /Analysis generated 26 March 2026 1:19 PM AEDT&lt;script&gt; \(updated after Task 1 completion: Issue #5 &lt;img src=x onerror=alert\(1\)&gt;\)/,
      );
      assert.match(
        hostileHtml,
        /href="https:\/\/app\.beehiiv\.com\/posts\/83e59c21-6673-413e-a1d4-53fdd632fe1c"/,
      );
      assert.doesNotMatch(hostileHtml, /<script>/);
      assert.doesNotMatch(hostileHtml, /onerror=alert\(1\)>/);
    } finally {
      await hostileWorkspace.cleanup();
    }
  });

  await t.test('already-updated guides fail fast on rerun', async () => {
    const updatedHtml = [
      '<html>',
      '<body>',
      '<span>✓ COMPLETE</span> Task 1: Send First Newsletter via Beehiiv',
      '<h3>Issue #5 Published</h3>',
      '<p>DONE · 26 March 2026 1:19 PM AEDT</p>',
      '<p>Newsletter published 26 March 2026 1:19 PM AEDT.</p>',
      '<p>Complete the 4 remaining manual tasks. ✅ Task 1 done: newsletter published 26 March 2026 1:19 PM AEDT.</p>',
      '<p>Analysis generated 26 March 2026 1:19 PM AEDT (updated after Task 1 completion: Issue #5)</p>',
      '</body>',
      '</html>',
      '',
    ].join('\n');
    const updatedWorkspace = await createWorkspace(updatedHtml);

    try {
      const rerunResult = runUpdateCompletionGuide(updatedWorkspace.guidePath, {
        BEEHIIV_PUBLICATION_URL: 'https://app.beehiiv.com/posts/83e59c21-6673-413e-a1d4-53fdd632fe1c',
        BEEHIIV_PUBLISHED_AT: '26 March 2026 1:19 PM AEDT',
        BEEHIIV_POST_TITLE: 'Issue #5',
      });
      const rerunHtml = await readFile(updatedWorkspace.guidePath, 'utf8');

      assert.notEqual(rerunResult.status, 0);
      assert.equal(rerunHtml, updatedHtml);
      assert.match(
        rerunResult.stderr,
        /The completion guide already appears to include Task 1 updates\./,
      );
      assert.match(rerunResult.stderr, /Reset or re-export the pristine guide/);
    } finally {
      await updatedWorkspace.cleanup();
    }
  });

  await t.test('unexpected guide structure fails fast instead of silently succeeding', async () => {
    const mismatchedHtml = [
      '<html>',
      '<body>',
      '<span>ACTION REQUIRED</span> Task 1: Send First Newsletter via Beehiiv',
      '<h3>Unexpected heading copy</h3>',
      '<p>~5 min · HIGH PRIORITY</p>',
      '<p>Custom operator note that does not match the expected Task 1 description.</p>',
      '<p>Complete the 5 manual tasks above.</p>',
      '<p>Analysis generated 26 March 2026</p>',
      '</body>',
      '</html>',
      '',
    ].join('\n');
    const mismatchedWorkspace = await createWorkspace(mismatchedHtml);

    try {
      const mismatchedResult = runUpdateCompletionGuide(mismatchedWorkspace.guidePath, {
        BEEHIIV_PUBLICATION_URL: 'https://app.beehiiv.com/posts/83e59c21-6673-413e-a1d4-53fdd632fe1c',
        BEEHIIV_PUBLISHED_AT: '26 March 2026 1:19 PM AEDT',
        BEEHIIV_POST_TITLE: 'Issue #5',
      });
      const mismatchedOutputHtml = await readFile(mismatchedWorkspace.guidePath, 'utf8');

      assert.notEqual(mismatchedResult.status, 0);
      assert.equal(mismatchedOutputHtml, mismatchedHtml);
      assert.match(
        mismatchedResult.stderr,
        /The completion guide did not match the expected pristine Task 1 structure\./,
      );
      assert.match(mismatchedResult.stderr, /Missing: task title, task description/);
      assert.match(mismatchedResult.stderr, /Re-export a fresh guide before retrying/);
    } finally {
      await mismatchedWorkspace.cleanup();
    }
  });
});
