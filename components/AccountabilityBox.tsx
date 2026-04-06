import React from 'react';
import { ShieldCheck } from 'lucide-react';

interface AccountabilityBoxProps {
  reviewerName?: string | null;
}

export default function AccountabilityBox({ reviewerName }: AccountabilityBoxProps) {
  const reviewer = reviewerName || "the Editorial Team";
  
  return (
    <div className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 my-8 flex items-start gap-4">
      <div className="bg-cyan-500/10 p-2 rounded-full text-cyan-600 dark:text-cyan-400 mt-1 shrink-0">
        <ShieldCheck size={20} />
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Human-Verified Briefing</h4>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          This publication is AI-assisted to ensure timely coverage of emerging threats. The content has been reviewed, fact-checked, and approved by <strong>{reviewer}</strong> to maintain our standards for security operations.
        </p>
      </div>
    </div>
  );
}
