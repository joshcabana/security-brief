'use client';

import { useEffect } from 'react';
import { Shield, Lock } from 'lucide-react';// If deploying on Server Component, metadata can be exported. Since it's 'use client', metadata cannot be exported directly here unless we separate it into layout or a nested server component.
// We'll wrap it in a clean loading UI.

export default function UpgradeRedirectPage() {
  useEffect(() => {
    // Allows time for any client-side analytics (Plausible) to record the click-through
    // before bouncing the user to the Stripe/Beehiiv checkout.
    const redirectTimer = setTimeout(() => {
      window.location.href = 'https://app.beehiiv.com/subscribe/ai-security-brief-pro';
    }, 1500);

    return () => clearTimeout(redirectTimer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4">
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none"></div>

      <div className="relative text-center z-10 max-w-sm w-full mx-auto p-8 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-cyan-500/10 flex items-center justify-center border border-cyan-500/20">
              <Lock size={28} className="text-cyan-500" />
            </div>
            <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800">
              <Shield size={12} className="text-cyan-400" />
            </div>
          </div>
        </div>
        
        <h1 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
          Securing your session
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-8">
          Transferring to the encrypted checkout portal...
        </p>

        <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-cyan-500 h-full rounded-full animate-pulse blur-[1px]" style={{ width: '100%', animation: 'progress 1.5s ease-in-out' }}></div>
        </div>
      </div>
    </div>
  );
}
