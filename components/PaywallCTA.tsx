'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ArrowRight, X } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '@/lib/site';

export default function PaywallCTA() {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (window.localStorage.getItem('hide-paywall') === 'true' || window.localStorage.getItem('hide-newsletter') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    window.localStorage.setItem('hide-paywall', 'true');
    setIsDismissed(true);
  };

  if (isMounted && isDismissed) {
    return null;
  }
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900/50 p-8 mt-12 shadow-[0_0_30px_rgba(0,180,255,0.05)] backdrop-blur-sm group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,180,255,0.08)_0%,transparent_70%)] pointer-events-none" />
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 transition-colors z-20"
        aria-label="Dismiss Paywall"
      >
        <X size={20} />
      </button>
      <div className="relative flex flex-col items-center text-center z-10">
        <div className="w-16 h-16 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center mb-6 shadow-inner group-hover:border-cyan-500/50 transition-colors">
          <Lock className="w-8 h-8 text-cyan-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-3">Unlock the Full Threat Briefing</h3>
        <p className="text-slate-400 mb-8 max-w-lg leading-relaxed">
          The remainder of this analysis, including complete mitigation scripts, zero-day proofs of concept, and exclusive premium tool discounts, is restricted to <span className="text-cyan-400 font-semibold">Pro Intelligence</span> subscribers.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <Link
            href="/upgrade"
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all shadow-[0_0_15px_rgba(0,180,255,0.4)]"
          >
            Upgrade to Pro
            <ArrowRight size={18} />
          </Link>
          <Link
            href={siteConfig.beehiiv.loginUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center px-8 py-3 rounded-lg bg-transparent border border-slate-700 hover:border-slate-500 text-slate-300 font-medium transition-colors"
          >
            I&apos;m already a member
          </Link>
        </div>
      </div>
    </div>
  );
}
