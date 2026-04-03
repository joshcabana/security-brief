'use client';

import { useEffect, useState } from 'react';
import { Shield, Lock, Check, Zap } from 'lucide-react';
import { siteConfig } from '@/lib/site';

const BEEHIIV_CHECKOUT_URL = siteConfig.beehiiv.upgradeUrl;

const INCLUDED = [
  'Priority threat advisories — 48h before mainstream press',
  'Architecture-level technical deep-dives',
  'Full searchable brief archive',
  'Quarterly AI threat landscape reports',
  'No vendor affiliates. Ever.',
];

export default function UpgradePage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // ── 1. Fire LinkedIn conversion event ──────────────────────────────────
    try {
      const conversionId = process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP;
      // Cast through unknown — lintrk is injected by LinkedIn Insight Tag asynchronously
      const win = window as unknown as { lintrk?: (a: string, p: { conversion_id: number }) => void };
      if (win.lintrk && conversionId) {
        win.lintrk('track', { conversion_id: Number(conversionId) });
      }
    } catch {
      // Never block checkout for tracking errors
    }

    // ── 2. Also fire Plausible goal ────────────────────────────────────────
    try {
      const win = window as unknown as { plausible?: (goal: string, opts?: { props?: Record<string, string> }) => void };
      win.plausible?.('Pro Upgrade Intent', { props: { source: 'upgrade-page' } });
    } catch {
      // Gracefully degrade
    }

    // ── 3. Animated progress bar → redirect ───────────────────────────────
    const DURATION = 1800; // ms before redirect
    const TICK = 30; // ms per frame

    let elapsed = 0;
    const timer = setInterval(() => {
      elapsed += TICK;
      setProgress(Math.min(100, Math.round((elapsed / DURATION) * 100)));

      if (elapsed >= DURATION) {
        clearInterval(timer);
        window.location.href = BEEHIIV_CHECKOUT_URL;
      }
    }, TICK);

    return () => clearInterval(timer);
  }, []);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,180,255,0.07) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,255,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md mx-auto">

        {/* ── Lock icon ── */}
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse-glow"
              style={{
                background: 'rgba(0,180,255,0.1)',
                border: '1px solid rgba(0,180,255,0.3)',
              }}
            >
              <Lock size={34} style={{ color: 'var(--accent)' }} />
            </div>
            <div
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center"
              style={{
                background: 'var(--surface)',
                border: '1px solid rgba(0,180,255,0.4)',
              }}
            >
              <Zap size={14} style={{ color: 'var(--accent)' }} />
            </div>
          </div>
        </div>

        {/* ── Heading ── */}
        <div className="text-center mb-8">
          <h1
            className="text-2xl font-extrabold mb-2"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Activating Pro Access
          </h1>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Transferring to secure checkout — you&apos;re locked in at the founding rate.
          </p>
        </div>

        {/* ── Whats included reminder ── */}
        <div
          className="rounded-xl p-5 mb-8"
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(0,180,255,0.2)',
          }}
        >
          <p
            className="text-xs font-mono font-bold uppercase tracking-widest mb-4"
            style={{ color: 'var(--accent)' }}
          >
            What you&apos;re getting
          </p>
          <ul className="space-y-2.5">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-3 text-sm" style={{ color: 'var(--text-body)' }}>
                <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--accent)' }} />
                {item}
              </li>
            ))}
          </ul>
          <div
            className="mt-4 pt-4 flex items-center justify-between"
            style={{ borderTop: '1px solid var(--border-subtle)' }}
          >
            <span className="text-xs font-mono" style={{ color: 'var(--text-faint)' }}>
              Founding rate — locked for life
            </span>
            <span className="text-xl font-extrabold" style={{ color: 'var(--text-primary)' }}>
              $9<span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>/mo</span>
            </span>
          </div>
        </div>

        {/* ── Progress bar ── */}
        <div
          className="w-full rounded-full overflow-hidden mb-4"
          style={{ height: '3px', background: 'var(--border)' }}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Redirect progress"
        >
          <div
            className="h-full rounded-full transition-all"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))',
              boxShadow: '0 0 8px rgba(0,180,255,0.5)',
              transition: 'width 30ms linear',
            }}
          />
        </div>

        {/* ── Trust signals ── */}
        <div className="flex items-center justify-center gap-6">
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
            <Shield size={12} style={{ color: 'var(--accent)' }} />
            Encrypted checkout
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-faint)' }}>
            <Lock size={12} style={{ color: 'var(--accent)' }} />
            Cancel anytime
          </div>
        </div>

      </div>
    </div>
  );
}
