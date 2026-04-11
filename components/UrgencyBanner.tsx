'use client';

/**
 * UrgencyBanner
 * Sticky top announcement bar that creates loss-aversion pressure for free users.
 * Shows Pro-only briefing count this month. Dismisses per-session via sessionStorage.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, Zap } from 'lucide-react';

interface UrgencyBannerProps {
  /** Number of Pro-only briefings published this month */
  proOnlyCount?: number;
  /** CTA href */
  href?: string;
}

export default function UrgencyBanner({
  proOnlyCount = 7,
  href = '/pricing',
}: UrgencyBannerProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = sessionStorage.getItem('urgency-banner-dismissed');
    if (!dismissed) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    sessionStorage.setItem('urgency-banner-dismissed', '1');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="relative z-50 bg-gradient-to-r from-cyan-950 via-slate-900 to-cyan-950 border-b border-cyan-800/40"
      role="banner"
      aria-label="Pro member offer"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 flex-1 justify-center">
          <Zap
            size={14}
            className="text-cyan-400 shrink-0 animate-pulse"
            aria-hidden="true"
          />
          <p className="text-xs sm:text-sm text-slate-300 font-medium">
            <span className="text-cyan-400 font-bold">{proOnlyCount} Pro-only briefings</span>
            {' '}published this month you can&apos;t currently access.{' '}
            <Link
              href={href}
              id="urgency-banner-cta"
              className="text-cyan-400 font-bold hover:text-cyan-300 underline underline-offset-2 transition-colors"
            >
              Unlock Pro →
            </Link>
          </p>
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-1 rounded"
          aria-label="Dismiss banner"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
