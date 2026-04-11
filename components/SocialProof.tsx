/**
 * SocialProof
 * Authority + social proof signal bar with subscriber count, independence
 * badge, and trust indicators. Renders below the Hero on the homepage.
 */

import { Shield, Users, Zap, TrendingUp } from 'lucide-react';

const stats = [
  {
    icon: Users,
    value: '5,800+',
    label: 'security engineers subscribed',
  },
  {
    icon: Zap,
    value: 'Weekly',
    label: 'new threat briefings',
  },
  {
    icon: Shield,
    value: '100%',
    label: 'independent, no VC funding',
  },
  {
    icon: TrendingUp,
    value: '16+',
    label: 'deep-dive briefs published',
  },
];

export default function SocialProof() {
  return (
    <section
      className="border-t border-b border-slate-800 bg-slate-950/60 py-10"
      aria-label="Platform stats"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center text-center gap-2 group"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-cyan-900/20 border border-cyan-800/30 mb-1 group-hover:border-cyan-500/40 transition-colors">
                <Icon size={18} className="text-cyan-400" aria-hidden="true" />
              </div>
              <span className="text-2xl font-black text-white tracking-tight font-mono">
                {value}
              </span>
              <span className="text-xs text-slate-500 leading-snug">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
