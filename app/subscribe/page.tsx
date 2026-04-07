import type { Metadata } from 'next';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import NewsletterForm from '@/components/NewsletterForm';
import { Shield, Zap, Check } from 'lucide-react';
import { siteConfig } from '@/lib/site';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/subscribe',
  title: 'Subscribe | AI Security Brief',
  description: 'Subscribe for weekly AI security briefings and access the current Pro path for deeper analysis, archive access, and reports.',
});

export default function SubscribePage() {
  const checkoutLive = siteConfig.beehiiv.checkoutLive;
  const proBadge = checkoutLive ? 'Pro Access' : 'Pro Waitlist';
  const proTitle = checkoutLive ? 'Pro Access' : 'Pro Waitlist';
  const proDescription = checkoutLive
    ? 'Paid access for teams that want deeper technical briefings, archive access, and research reports.'
    : 'Join the waitlist for deeper briefings, archive access, and research updates when paid access opens.';
  const proButtonLabel = checkoutLive ? 'Continue to Pro Access' : 'Join Pro Waitlist';
  const proFootnote = checkoutLive
    ? 'Checkout is live through Beehiiv.'
    : 'Paid access is not live yet. No card required.';

  return (
    <div className="min-h-[calc(100vh-80px)] bg-slate-50 dark:bg-[#080d14] flex flex-col items-center justify-center pt-24 pb-24">
      {/* Background elements */}
      <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-cyan-500/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-5xl mx-auto px-6 w-full z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-300 uppercase tracking-widest mb-6">
            Join the Brief
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            Weekly AI threat intel <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">that actually matters</span>
          </h1>
          <p className="mt-6 text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Start with the free weekly briefing, then continue to Pro if you want deeper analysis, archive access, and research reports.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          
          {/* Free Tier Card */}
          <div className="bg-white dark:bg-[#0d131f] border border-slate-200 dark:border-slate-800 rounded-2xl p-8 lg:p-10 shadow-lg relative overflow-hidden flex flex-col h-full">
            <div className="mb-6 pb-6 border-b border-slate-100 dark:border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800/50 flex items-center justify-center mb-6">
                <Shield size={24} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Free Intelligence</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                The perfect starting point for staying aware of new agentic AI capabilities and surface-level exploits.
              </p>
            </div>
            
            <ul className="space-y-4 mb-8 flex-grow">
              {[
                '1 Weekly briefing email',
                'Curated industry news & tool updates',
                'High-level vulnerability summaries',
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check size={18} className="text-slate-400 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <NewsletterForm 
                variant="default" 
                placeholder="your@work-email.com" 
                buttonText="Subscribe Free" 
                source="subscribe-page-free" 
              />
            </div>
          </div>

          {/* Pro Tier Card */}
          <div className="bg-slate-900 dark:bg-[#0a1018] border border-cyan-500/30 rounded-2xl p-8 lg:p-10 shadow-2xl relative overflow-hidden flex flex-col h-full transform md:-translate-y-4">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-600"></div>
            <div className="absolute top-0 right-0 p-4">
              <div className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-wider rounded-full">
                {proBadge}
              </div>
            </div>
            
            <div className="mb-6 pb-6 border-b border-slate-800">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-6 border border-cyan-500/20">
                <Zap size={24} className="text-cyan-400 shadow-[0_0_15px_rgba(34,211,238,0.5)]" />
              </div>
              <div className="flex items-end gap-2 mb-2">
                <h2 className="text-2xl font-bold text-white">{proTitle}</h2>
              </div>
              <p className="text-slate-400 text-sm">
                {proDescription}
              </p>
            </div>
            
            <ul className="space-y-4 mb-10 flex-grow">
              {[
                'Everything in Free',
                'Deeper technical briefings',
                'Searchable archive access',
                'Research report updates',
                'Member-content launch notifications',
                'Disclosure-first tooling coverage'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-3">
                  <Check size={18} className="text-cyan-400 mt-0.5 shrink-0" />
                  <span className="text-sm font-medium text-slate-200">{feature}</span>
                </li>
              ))}
            </ul>

            <div className="mt-auto">
              <a 
                href="/upgrade" 
                className="flex items-center justify-center w-full px-6 py-4 rounded-xl font-bold text-slate-900 bg-cyan-400 hover:bg-cyan-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all duration-300"
              >
                {proButtonLabel}
              </a>
              <p className="text-center text-xs text-slate-500 mt-4">
                {proFootnote}
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
