'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Shield, Lock, Check, Zap, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/lib/site';

/**
 * If true, the page redirects directly to the live Beehiiv checkout flow.
 * If false, it captures upgrade-intent signups via the existing /api/subscribe
 * endpoint until paid checkout is ready.
 */
const PRO_CHECKOUT_LIVE = true;

const BEEHIIV_CHECKOUT_URL = siteConfig.beehiiv.upgradeUrl;

const INCLUDED = [
  'Priority threat advisories — 48h before mainstream press',
  'Architecture-level technical deep-dives',
  'Full searchable brief archive',
  'Quarterly AI threat landscape reports',
  'No vendor affiliates. Ever.',
];

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

function fireLinkedInConversion(): void {
  try {
    const conversionId = process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP;
    const win = window as unknown as {
      lintrk?: (a: string, p: { conversion_id: number }) => void;
    };
    if (win.lintrk && conversionId) {
      win.lintrk('track', { conversion_id: Number(conversionId) });
    }
  } catch {
    // Never block checkout for tracking errors
  }
}

function firePlausibleGoal(): void {
  try {
    const win = window as unknown as {
      plausible?: (goal: string, opts?: { props?: Record<string, string> }) => void;
    };
    win.plausible?.('Pro Upgrade Intent', { props: { source: 'upgrade-page' } });
  } catch {
    // Gracefully degrade
  }
}

// ─── Redirect Flow (used when PRO_CHECKOUT_LIVE === true) ─────────────────────

function RedirectFlow() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fireLinkedInConversion();
    firePlausibleGoal();

    const DURATION = 1800;
    const TICK = 30;
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
    <>
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
          className="h-full rounded-full"
          style={{
            width: `${progress}%`,
            background: 'linear-gradient(90deg, var(--accent-dim), var(--accent))',
            boxShadow: '0 0 8px rgba(0,180,255,0.5)',
            transition: 'width 30ms linear',
          }}
        />
      </div>
    </>
  );
}

// ─── Signup Flow (used when PRO_CHECKOUT_LIVE === false) ──────────────────────

function SignupFlow() {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    firePlausibleGoal();
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Enter a valid work email.');
      return;
    }

    setStatus('loading');
    setMessage('');

    // Fire LinkedIn conversion when they actually submit
    fireLinkedInConversion();

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'pro-upgrade-intent', website }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus('error');
        setMessage(payload.message || 'Something went wrong. Try again.');
        return;
      }

      setStatus('success');
      setMessage('');
      setEmail('');
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Try again.');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: 'rgba(63,185,80,0.15)',
            border: '1px solid rgba(63,185,80,0.3)',
          }}
        >
          <Check size={32} style={{ color: 'var(--success)' }} />
        </div>
        <h1
          className="text-2xl font-extrabold mb-3"
          style={{ color: 'var(--text-primary)' }}
        >
          You&apos;re on the list
        </h1>
        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          We&apos;ll email you the moment Pro checkout opens — at the $9/mo founding rate, locked for life.
          In the meantime, check your inbox for the free weekly briefing.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color: 'var(--accent)' }}
        >
          Read the latest briefings
          <ChevronRight size={14} />
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="text-center mb-8">
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-mono font-bold uppercase tracking-widest"
          style={{
            background: 'rgba(0,180,255,0.08)',
            border: '1px solid rgba(0,180,255,0.3)',
            color: 'var(--accent)',
          }}
        >
          <Zap size={12} />
          Founding cohort — limited spots
        </div>
        <h1
          className="text-3xl font-extrabold mb-3"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Get Pro Access — $9/mo
        </h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          Secure your founding rate. We&apos;ll notify you the moment checkout opens — you&apos;ll be first in.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="w-full mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <label htmlFor="upgrade-email" className="sr-only">
              Work email address
            </label>
            <input
              id="upgrade-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@work-email.com"
              required
              disabled={status === 'loading'}
              className="w-full rounded-lg text-sm px-4 py-3.5 transition-all duration-200 disabled:opacity-60 outline-none"
              style={{
                background: 'rgba(22,27,34,0.8)',
                border: status === 'error' ? '1px solid var(--danger)' : '1px solid var(--border)',
                color: 'var(--text-body)',
              }}
            />
          </div>
          {/* Honeypot */}
          <div hidden aria-hidden="true">
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              autoComplete="off"
              tabIndex={-1}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'loading'}
            className="flex-shrink-0 px-6 py-3.5 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap pro-cta-btn"
          >
            {status === 'loading' ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
                </svg>
                Securing…
              </span>
            ) : (
              'Lock in $9/mo'
            )}
          </button>
        </div>
        {status === 'error' && (
          <p className="mt-2 text-xs" style={{ color: 'var(--danger)' }} role="alert">
            {message}
          </p>
        )}
      </form>
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function UpgradePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'var(--bg)' }}
    >
      {/* Background grid */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(0,180,255,0.07) 1px, transparent 0)',
          backgroundSize: '28px 28px',
        }}
        aria-hidden="true"
      />
      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(0,180,255,0.08) 0%, transparent 70%)',
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md mx-auto">
        {/* Lock icon */}
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

        {/* Conditional: signup or redirect */}
        {PRO_CHECKOUT_LIVE ? <RedirectFlow /> : <SignupFlow />}

        {/* What's included */}
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
              <li
                key={item}
                className="flex items-start gap-3 text-sm"
                style={{ color: 'var(--text-body)' }}
              >
                <Check
                  size={14}
                  className="mt-0.5 flex-shrink-0"
                  style={{ color: 'var(--accent)' }}
                />
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
              $9
              <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
                /mo
              </span>
            </span>
          </div>
        </div>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-6">
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--text-faint)' }}
          >
            <Shield size={12} style={{ color: 'var(--accent)' }} />
            {PRO_CHECKOUT_LIVE ? 'Secure Beehiiv checkout' : 'No credit card required'}
          </div>
          <div
            className="flex items-center gap-2 text-xs"
            style={{ color: 'var(--text-faint)' }}
          >
            <Lock size={12} style={{ color: 'var(--accent)' }} />
            Cancel anytime
          </div>
        </div>
      </div>
    </div>
  );
}
