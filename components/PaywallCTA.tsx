import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { siteConfig } from '@/lib/site';

export default function PaywallCTA() {
  return (
    <div className="relative overflow-hidden rounded-xl border border-cyan-500/30 bg-slate-900/50 p-8 mt-12 shadow-[0_0_30px_rgba(0,180,255,0.05)] backdrop-blur-sm group">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,180,255,0.08)_0%,transparent_70%)] pointer-events-none" />
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
            href={siteConfig.beehiiv.upgradeUrl}
            target="_blank"
            rel="noopener noreferrer"
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
