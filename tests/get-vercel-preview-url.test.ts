import assert from 'node:assert/strict';
import test from 'node:test';
import {
  decodeVercelCommentMetadata,
  extractPreviewUrlFromComments,
  normalisePreviewUrl,
  waitForPreviewUrl,
} from '../scripts/get-vercel-preview-url.mjs';

function buildVercelCommentBody(metadata: object): string {
  return `[vc]: #metadata:${Buffer.from(JSON.stringify(metadata)).toString('base64')}\nDeployment update`;
}

function buildComment({
  body,
  createdAt,
  updatedAt,
  userLogin,
}: {
  body: string;
  createdAt: string;
  updatedAt?: string;
  userLogin: string;
}) {
  return {
    body,
    created_at: createdAt,
    updated_at: updatedAt ?? createdAt,
    user: {
      login: userLogin,
    },
  };
}

test('decodeVercelCommentMetadata parses the embedded Vercel payload', () => {
  const metadata = {
    projects: [
      {
        name: 'ai-security-brief',
        previewUrl: 'preview.example.vercel.app',
        nextCommitStatus: 'DEPLOYED',
      },
    ],
  };

  const decodedMetadata = decodeVercelCommentMetadata(buildVercelCommentBody(metadata));

  assert.deepEqual(decodedMetadata, metadata);
});

test('normalisePreviewUrl adds https to bare Vercel hostnames and trims trailing slashes', () => {
  assert.equal(normalisePreviewUrl('preview.example.vercel.app/'), 'https://preview.example.vercel.app');
  assert.equal(normalisePreviewUrl('https://preview.example.vercel.app/'), 'https://preview.example.vercel.app');
  assert.equal(normalisePreviewUrl(''), null);
});

test('extractPreviewUrlFromComments returns the deployed preview URL for the matching Vercel project', () => {
  const previewUrl = extractPreviewUrlFromComments(
    [
      buildComment({
        body: 'unrelated',
        createdAt: '2026-03-19T01:00:00Z',
        userLogin: 'joshcabana',
      }),
      buildComment({
        body: buildVercelCommentBody({
          projects: [
            {
              name: 'ai-security-brief',
              previewUrl: 'ai-security-brief-git-preview.vercel.app',
              nextCommitStatus: 'DEPLOYED',
            },
          ],
        }),
        createdAt: '2026-03-19T01:01:00Z',
        userLogin: 'vercel[bot]',
      }),
    ],
    'ai-security-brief',
  );

  assert.equal(previewUrl, 'https://ai-security-brief-git-preview.vercel.app');
});

test('extractPreviewUrlFromComments does not fall back to an older deployed preview when the latest Vercel comment is still building', () => {
  const previewUrl = extractPreviewUrlFromComments(
    [
      buildComment({
        body: buildVercelCommentBody({
          projects: [
            {
              name: 'ai-security-brief',
              previewUrl: 'old-preview.vercel.app',
              nextCommitStatus: 'DEPLOYED',
            },
          ],
        }),
        createdAt: '2026-03-19T01:00:00Z',
        userLogin: 'vercel[bot]',
      }),
      buildComment({
        body: buildVercelCommentBody({
          projects: [
            {
              name: 'ai-security-brief',
              previewUrl: 'new-preview.vercel.app',
              nextCommitStatus: 'BUILDING',
            },
          ],
        }),
        createdAt: '2026-03-19T01:02:00Z',
        userLogin: 'vercel[bot]',
      }),
    ],
    'ai-security-brief',
  );

  assert.equal(previewUrl, null);
});

test('waitForPreviewUrl retries until the Vercel preview metadata reports DEPLOYED', async () => {
  let loadCommentsCalls = 0;
  const sleepCalls: number[] = [];

  const previewUrl = await waitForPreviewUrl(
    {
      repo: 'joshcabana/ai-security-brief',
      pullRequestNumber: 33,
      projectName: 'ai-security-brief',
      token: 'test-token',
      timeoutMs: 5000,
      pollIntervalMs: 50,
    },
    {
      async loadComments() {
        loadCommentsCalls += 1;

        if (loadCommentsCalls === 1) {
          return [
            buildComment({
              body: buildVercelCommentBody({
                projects: [
                  {
                    name: 'ai-security-brief',
                    previewUrl: 'preview.vercel.app',
                    nextCommitStatus: 'BUILDING',
                  },
                ],
              }),
              createdAt: '2026-03-19T01:00:00Z',
              userLogin: 'vercel[bot]',
            }),
          ];
        }

        return [
          buildComment({
            body: buildVercelCommentBody({
              projects: [
                {
                  name: 'ai-security-brief',
                  previewUrl: 'preview.vercel.app',
                  nextCommitStatus: 'DEPLOYED',
                },
              ],
            }),
            createdAt: '2026-03-19T01:01:00Z',
            userLogin: 'vercel[bot]',
          }),
        ];
      },
      async sleep(durationMs: number) {
        sleepCalls.push(durationMs);
      },
    },
  );

  assert.equal(previewUrl, 'https://preview.vercel.app');
  assert.equal(loadCommentsCalls, 2);
  assert.deepEqual(sleepCalls, [50]);
});

test('waitForPreviewUrl raises a timeout error when the preview never reaches DEPLOYED', async () => {
  await assert.rejects(
    waitForPreviewUrl(
      {
        repo: 'joshcabana/ai-security-brief',
        pullRequestNumber: 33,
        projectName: 'ai-security-brief',
        token: 'test-token',
        timeoutMs: 1,
        pollIntervalMs: 1,
      },
      {
        async loadComments() {
          return [
            buildComment({
              body: buildVercelCommentBody({
                projects: [
                  {
                    name: 'ai-security-brief',
                    previewUrl: 'preview.vercel.app',
                    nextCommitStatus: 'BUILDING',
                  },
                ],
              }),
              createdAt: '2026-03-19T01:00:00Z',
              userLogin: 'vercel[bot]',
            }),
          ];
        },
        async sleep() {},
      },
    ),
    /Timed out after 1ms waiting for a deployed Vercel preview URL/,
  );
});
