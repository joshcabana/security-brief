import { cache } from 'react';
import { promises as fs } from 'node:fs';
import path from 'node:path';

export type TrustLevel = 'blocked' | 'pending' | 'low' | 'medium' | 'high';

export interface ArticleTrustEntry {
  slug: string;
  fileName: string;
  section: 'editorial' | 'review';
  monetization: 'none' | 'affiliate';
  reviewedBy: string;
  reviewedAt: string;
  lastSubstantiveUpdateAt: string;
  primarySources: number;
  verifiedPrimarySources: number;
  humanAttestationPresent: boolean;
  iocsVerified: boolean;
  correctionsCount: number;
  trustScore: number;
  trustLevel: TrustLevel;
  blockingFailures: string[];
}

interface ArticleTrustArtifact {
  checkedAt: string;
  ok: boolean;
  minimumEditorialTrustScore: number;
  entries: ArticleTrustEntry[];
}

const ARTICLE_TRUST_PATH = path.join(process.cwd(), 'artifacts', 'article-trust.json');

async function readArticleTrustArtifact(): Promise<ArticleTrustArtifact | null> {
  try {
    const source = await fs.readFile(ARTICLE_TRUST_PATH, 'utf8');
    return JSON.parse(source) as ArticleTrustArtifact;
  } catch {
    return null;
  }
}

export const getArticleTrustArtifact = cache(readArticleTrustArtifact);

export const getArticleTrustEntryMap = cache(async (): Promise<Map<string, ArticleTrustEntry>> => {
  const artifact = await getArticleTrustArtifact();

  return new Map(
    (artifact?.entries ?? []).map((entry) => [entry.slug, entry] satisfies [string, ArticleTrustEntry]),
  );
});
