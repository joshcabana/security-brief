'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { Shield, Lock, Check, Zap, ChevronRight } from 'lucide-react';
import { siteConfig } from '@/lib/site';

/**
 * If true, the page redirects directly to the live Beehiiv checkout flow.
 * If false, it captures upgrade-intent signups via the existing /api/subscribe
 * endpoint until Beehiiv paid subscriptions are confirmed live.
 */
const PRO_CHECKOUT_LIVE = siteConfig.beehiiv.checkoutLive;

const BEEHIIV_CHECKOUT_URL = siteConfig.beehiiv.upgradeUrl;

const INCLUDED = [
  'Member-only technical briefings',
  'Full searchable brief archive',
  'Research report access and updates',
  'AI security tooling coverage',
  'Email updates when new member content is published',
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

function RedirectFlow() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fireLinkedInConversion();
    firePlausibleGoal();

    const durationMs = 1800;
    const tickMs = 30;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += tickMs;
      setProgress(Math.min(100, Math.round((elapsed / durationMs) * 100)));
      if (elapsed >= durationMs) {
        clearInterval(timer);
        window.location.href = BEEHIIV_CHECKOUT_URL;
      }
    }, tickMs);

    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-extrabold mb-2 text-[var(--text-primary)] tracking-[-0.02em]"
        >
          Opening Pro Checkout
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Transferring to secure Beehiiv checkout.
        </p>
      </div>

      <progress
        className="w-full h-[3px] rounded-full overflow-hidden mb-4 appearance-none [&::-webkit-progress-bar]:bg-[var(--border)] [&::-webkit-progress-value]:bg-[linear-gradient(90deg,var(--accent-dim),var(--accent))] [&::-webkit-progress-value]:shadow-[0_0_8px_rgba(0,180,255,0.5)] [&::-webkit-progress-value]:transition-[width] [&::-webkit-progress-value]:duration-75 [&::-webkit-progress-value]:ease-linear [&::-moz-progress-bar]:bg-[linear-gradient(90deg,var(--accent-dim),var(--accent))] [&::-moz-progress-bar]:shadow-[0_0_8px_rgba(0,180,255,0.5)] bg-[var(--border)]"
        value={progress}
        max={100}
        aria-label="Redirect progress"
      />
    </>
  );
}

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
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 bg-[rgba(63,185,80,0.15)] border border-[rgba(63,185,80,0.3)]"
        >
          <Check size={32} className="text-[var(--success)]" />
        </div>
        <h1
          className="text-2xl font-extrabold mb-3 text-[var(--text-primary)]"
        >
          You&apos;re on the list
        </h1>
        <p className="text-sm mb-6 text-[var(--text-muted)]">
          We&apos;ll email you when Pro checkout opens. In the meantime, you can keep reading the free weekly briefing.
        </p>
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors text-[var(--accent)]"
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
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-6 text-xs font-mono font-bold uppercase tracking-widest bg-[rgba(0,180,255,0.08)] border border-[rgba(0,180,255,0.3)] text-[var(--accent)]"
        >
          <Zap size={12} />
          Pro waitlist
        </div>
        <h1
          className="text-3xl font-extrabold mb-3 text-[var(--text-primary)] tracking-[-0.02em]"
        >
          Join the Pro Waitlist
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Paid access is not live yet. Join the waitlist and we&apos;ll email you when checkout opens.
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
              onChange={(event) => setEmail(event.target.value)}
              placeholder="your@work-email.com"
              required
              disabled={status === 'loading'}
              className={`w-full rounded-lg text-sm px-4 py-3.5 transition-all duration-200 disabled:opacity-60 outline-none bg-[rgba(22,27,34,0.8)] text-[var(--text-body)] ${status === 'error' ? 'border border-[var(--danger)]' : 'border border-[var(--border)]'}`}
            />
          </div>
          <div hidden aria-hidden="true">
            <input
              type="text"
              name="website"
              value={website}
              onChange={(event) => setWebsite(event.target.value)}
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
              'Join the waitlist'
            )}
          </button>
        </div>
        {status === 'error' && (
          <p className="mt-2 text-xs text-[var(--danger)]" role="alert">
            {message}
          </p>
        )}
      </form>
    </>
  );
}

export default function UpgradeClient() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-[var(--bg)]"
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(circle_at_1px_1px,rgba(0,180,255,0.07)_1px,transparent_0)] bg-[size:28px_28px]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_60%_50%_at_50%_50%,rgba(0,180,255,0.08)_0%,transparent_70%)]"
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="flex justify-center mb-8">
          <div className="relative">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center animate-pulse-glow bg-[rgba(0,180,255,0.1)] border border-[rgba(0,180,255,0.3)]"
            >
              <Lock size={34} className="text-[var(--accent)]" />
            </div>
            <div
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center bg-[var(--surface)] border border-[rgba(0,180,255,0.4)]"
            >
              <Zap size={14} className="text-[var(--accent)]" />
            </div>
          </div>
        </div>

        {PRO_CHECKOUT_LIVE ? <RedirectFlow /> : <SignupFlow />}

        <div
          className="rounded-xl p-5 mb-8 bg-[var(--surface)] border border-[rgba(0,180,255,0.2)]"
        >
          <p
            className="text-xs font-mono font-bold uppercase tracking-widest mb-4 text-[var(--accent)]"
          >
            Planned Pro coverage
          </p>
          <ul className="space-y-2.5">
            {INCLUDED.map((item) => (
              <li
                key={item}
                className="flex items-start gap-3 text-sm text-[var(--text-body)]"
              >
                <Check
                  size={14}
                  className="mt-0.5 flex-shrink-0 text-[var(--accent)]"
                />
                {item}
              </li>
            ))}
          </ul>
          <div
            className="mt-4 pt-4 flex items-center justify-between border-t border-[var(--border-subtle)]"
          >
            <span className="text-xs font-mono text-[var(--text-faint)]">
              Current status
            </span>
            <span className="text-sm font-bold text-[var(--text-primary)]">
              {PRO_CHECKOUT_LIVE ? 'Checkout live' : 'Waitlist open'}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-6">
          <div
            className="flex items-center gap-2 text-xs text-[var(--text-faint)]"
          >
            <Shield size={12} className="text-[var(--accent)]" />
            {PRO_CHECKOUT_LIVE ? 'Secure Beehiiv checkout' : 'No credit card required'}
          </div>
          <div
            className="flex items-center gap-2 text-xs text-[var(--text-faint)]"
          >
            <Lock size={12} className="text-[var(--accent)]" />
            {PRO_CHECKOUT_LIVE ? 'Member access live' : 'Email notice when access opens'}
          </div>
        </div>
      </div>
    </div>
  );
}
