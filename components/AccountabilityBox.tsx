import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PENDING_HUMAN_REVIEW } from '@/lib/articles';
import type { TrustLevel } from '@/lib/article-trust';

interface AccountabilityBoxProps {
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  trustLevel?: TrustLevel;
}

function formatReviewDate(reviewedAt?: string | null): string | null {
  if (!reviewedAt || reviewedAt === PENDING_HUMAN_REVIEW) {
    return null;
  }

  const parsed = new Date(reviewedAt);
  return Number.isNaN(parsed.getTime())
    ? reviewedAt
    : parsed.toLocaleDateString('en-AU', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
}

export default function AccountabilityBox({ reviewedBy, reviewedAt, trustLevel }: AccountabilityBoxProps) {
  const reviewPending =
    !reviewedBy ||
    reviewedBy === PENDING_HUMAN_REVIEW ||
    !reviewedAt ||
    reviewedAt === PENDING_HUMAN_REVIEW ||
    trustLevel === 'blocked' ||
    trustLevel === 'pending';
  const reviewDate = formatReviewDate(reviewedAt);

  return (
    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 my-8 flex items-start gap-4">
      <div className="bg-cyan-500/10 p-2 rounded-full text-cyan-600 dark:text-cyan-400 mt-1 shrink-0">
        <ShieldCheck size={20} />
      </div>
      <div>
        {reviewPending ? (
          <>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Editorial Review Pending</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              This piece is AI-assisted and published without a recorded named human review artifact yet. Treat it as unverified analysis until a reviewer and review timestamp are attached.
            </p>
          </>
        ) : (
          <>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Human Reviewed & Verified</h4>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Draft generated with AI assistance &rarr; reviewed and verified by a human editor. 
              The current review record lists <strong>{reviewedBy}</strong>{reviewDate ? ` on ${reviewDate}` : ''}.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
