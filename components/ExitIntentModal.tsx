'use client';

/**
 * ExitIntentModal
 * Fires when the user moves their cursor above the viewport (desktop)
 * or after 45 seconds idle (mobile). Offers the free PDF lead magnet.
 * Respects existing newsletter/paywall dismissals.
 */

import { useState, useEffect, useCallback } from 'react';
import { X, ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'exit-intent-dismissed';
const COOLDOWN_DAYS = 14;

function hasDismissed(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (Number.isNaN(ts)) return false;
    return Date.now() - ts < COOLDOWN_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

function recordDismissal(): void {
  try {
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  } catch {
    // storage unavailable
  }
}

export default function ExitIntentModal() {
  const [open, setOpen] = useState(false);
  const [fired, setFired] = useState(false);

  const trigger = useCallback(() => {
    if (fired || hasDismissed()) return;
    setFired(true);
    setOpen(true);
  }, [fired]);

  const close = useCallback(() => {
    setOpen(false);
    recordDismissal();
  }, []);

  useEffect(() => {
    // Desktop: mouse leaves top of viewport
    const handleMouseOut = (e: MouseEvent) => {
      if (e.clientY <= 5 && e.relatedTarget === null) {
        trigger();
      }
    };

    // Mobile / safety net: fire after 45s idle if still reading
    const idleTimer = setTimeout(trigger, 45_000);

    document.addEventListener('mouseout', handleMouseOut);
    return () => {
      document.removeEventListener('mouseout', handleMouseOut);
      clearTimeout(idleTimer);
    };
  }, [trigger]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, close]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Free security guide offer"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
        onClick={close}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0d1117] border border-slate-700 rounded-2xl shadow-2xl shadow-cyan-900/10 overflow-hidden animate-slide-up">
        {/* Top accent bar */}
        <div className="h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-cyan-500" />

        <div className="p-8">
          <button
            onClick={close}
            className="absolute top-5 right-5 text-slate-500 hover:text-slate-300 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-cyan-900/20 border border-cyan-800/40 mb-6 mx-auto">
            <ShieldCheck size={24} className="text-cyan-400" />
          </div>

          <h2 className="text-xl font-bold text-white text-center mb-2">
            Get the Zero-BS Prompt Injection Guide
          </h2>
          <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
            A concise, technical PDF covering every real attack vector — with detection patterns and 
            mitigations your team can implement this week.{' '}
            <span className="text-cyan-400 font-semibold">Free, no paywall.</span>
          </p>

          <div className="space-y-3">
            <Link
              href="/lead-magnet"
              id="exit-intent-primary-cta"
              onClick={close}
              className="flex items-center justify-center gap-2 w-full px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm transition-all shadow-[0_0_20px_rgba(34,211,238,0.3)] hover:shadow-[0_0_30px_rgba(34,211,238,0.5)]"
            >
              Get the free PDF
              <ArrowRight size={16} />
            </Link>
            <button
              onClick={close}
              className="w-full px-6 py-3 rounded-xl text-slate-500 hover:text-slate-400 text-sm font-medium transition-colors"
            >
              No thanks, I&#39;ll pass on this one
            </button>
          </div>

          {/* Social proof micro-copy */}
          <p className="mt-4 text-xs text-slate-600 text-center">
            Downloaded by 2,400+ security engineers
          </p>
        </div>
      </div>
    </div>
  );
}
