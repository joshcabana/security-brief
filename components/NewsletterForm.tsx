'use client';

import { useState, useEffect, type FormEvent } from 'react';

interface NewsletterFormProps {
  variant?: 'default' | 'hero' | 'footer' | 'page';
  placeholder?: string;
  buttonText?: string;
  source?: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

export default function NewsletterForm({
  variant = 'default',
  placeholder = 'Enter your email address',
  buttonText = 'Subscribe free',
  source = 'unknown',
}: NewsletterFormProps) {
  const [email, setEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [status, setStatus] = useState<FormStatus>('idle');
  const [message, setMessage] = useState('');
  const [isDismissed, setIsDismissed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Initialize state from localStorage after mount
  useEffect(() => {
    setIsMounted(true);
    if (window.localStorage.getItem('hide-newsletter') === 'true') {
      setIsDismissed(true);
    }
  }, []);

  const handleDismiss = () => {
    window.localStorage.setItem('hide-newsletter', 'true');
    setIsDismissed(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email || !email.includes('@')) {
      setStatus('error');
      setMessage('Please enter a valid email address.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source, website }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus('error');
        setMessage(payload.message || 'The signup request failed. Please try again later.');
        return;
      }

      setStatus('success');
      setMessage(payload.message || "You're in. Check your inbox for the confirmation email.");
      setEmail('');
      setWebsite('');
    } catch {
      setStatus('error');
      setMessage('The signup request could not reach the server. Please try again later.');
    }
  };

  if (status === 'success') {
    return (
      <div
        className="flex items-start gap-3 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/25"
        role="alert"
        aria-live="polite"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" className="text-emerald-500 shrink-0 mt-[1px]" aria-hidden="true">
          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor" />
        </svg>
        <div>
          <p className="text-sm font-medium text-emerald-500">Subscription confirmed</p>
          <p className="text-sm mt-0.5 text-slate-400">{message}</p>
        </div>
      </div>
    );
  }

  // Only hide inline conversions if dismissed
  if (isMounted && isDismissed && variant === 'default') {
    return null;
  }

  const isHero = variant === 'hero';
  const isPage = variant === 'page';

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full ${isPage ? 'max-w-lg mx-auto flex flex-col gap-3' : ''}`}
      aria-label="Newsletter subscription form"
      data-newsletter-source={source}
    >
      <div className={`flex ${isHero || isPage ? 'flex-col sm:flex-row gap-3' : 'flex-row gap-2'}`}>
        <div className="flex-1 relative">
          <label htmlFor={`email-${variant}`} className="sr-only">Email address</label>
          <input
            id={`email-${variant}`}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={placeholder}
            required
            disabled={status === 'loading'}
            className={`w-full rounded-md text-sm transition-all duration-200 disabled:opacity-60 bg-slate-900/90 text-slate-200 outline-none focus:ring-4 focus:ring-cyan-500/10 ${isHero || isPage ? 'px-4 py-3.5' : 'px-4 py-2.5'
              } ${status === 'error' ? 'border border-red-500' : 'border border-slate-700 focus:border-cyan-400'}`}
          />
        </div>
        <input type="hidden" name="source" value={source} readOnly />
        <div hidden aria-hidden="true">
          <label htmlFor={`website-${variant}`}>Website</label>
          <input
            id={`website-${variant}`}
            type="text"
            name="website"
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            autoComplete="off"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`flex-shrink-0 font-bold text-sm text-slate-950 bg-cyan-500 hover:bg-cyan-400 hover:shadow-[0_0_16px_rgba(34,211,238,0.35)] rounded-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed whitespace-nowrap ${isHero || isPage ? 'px-6 py-3.5' : 'px-5 py-2.5'
            }`}
          aria-label={status === 'loading' ? 'Subscribing...' : buttonText}
        >
          {status === 'loading' ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="32" strokeDashoffset="8" />
              </svg>
              Subscribing…
            </span>
          ) : (
            buttonText
          )}
        </button>
      </div>

      {status === 'error' ? (
        <p className="mt-2 text-xs text-red-500" role="alert" aria-live="polite">{message}</p>
      ) : null}

      <p className="mt-2 text-xs text-slate-500 flex justify-between items-center">
        <span>No spam. Unsubscribe anytime. Powered by <a href="https://beehiiv.com" target="_blank" rel="noopener noreferrer" className="text-slate-400 hover:underline">Beehiiv</a>.</span>
        {variant === 'default' && (
          <button type="button" onClick={handleDismiss} className="text-slate-400 hover:underline">
            Dismiss
          </button>
        )}
      </p>
    </form>
  );
}
