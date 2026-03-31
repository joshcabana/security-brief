'use client';

import { useState, type FormEvent } from 'react';

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
        className="flex items-start gap-3 p-4 rounded-lg"
        style={{ background: 'rgba(63, 185, 80, 0.08)', border: '1px solid rgba(63, 185, 80, 0.25)' }}
        role="alert"
        aria-live="polite"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" style={{ color: '#3fb950', flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
          <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" fill="currentColor" />
        </svg>
        <div>
          <p className="text-sm font-medium" style={{ color: '#3fb950' }}>Subscription confirmed</p>
          <p className="text-sm mt-0.5" style={{ color: '#8b949e' }}>{message}</p>
        </div>
      </div>
    );
  }

  const isHero = variant === 'hero';
  const isPage = variant === 'page';

  return (
    <form onSubmit={handleSubmit} className={`w-full ${isPage ? 'max-w-lg mx-auto' : ''}`} aria-label="Newsletter subscription form">
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
            className="w-full rounded-md text-sm transition-all duration-200 disabled:opacity-60"
            style={{
              background: 'rgba(22, 27, 34, 0.9)',
              border: status === 'error' ? '1px solid #f85149' : '1px solid #30363d',
              color: '#e6edf3',
              outline: 'none',
              padding: isHero || isPage ? '0.875rem 1rem' : '0.625rem 1rem',
            }}
            onFocus={(event) => {
              if (status !== 'error') {
                event.currentTarget.style.borderColor = '#00b4ff';
                event.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.1)';
              }
            }}
            onBlur={(event) => {
              if (status !== 'error') {
                event.currentTarget.style.borderColor = '#30363d';
                event.currentTarget.style.boxShadow = 'none';
              }
            }}
          />
        </div>
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
          className="flex-shrink-0 font-bold text-sm rounded-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: '#00b4ff',
            color: '#0d1117',
            padding: isHero || isPage ? '0.875rem 1.5rem' : '0.625rem 1.25rem',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={(event) => {
            if (status !== 'loading') {
              event.currentTarget.style.background = '#33c3ff';
              event.currentTarget.style.boxShadow = '0 0 16px rgba(0,180,255,0.35)';
            }
          }}
          onMouseLeave={(event) => {
            event.currentTarget.style.background = '#00b4ff';
            event.currentTarget.style.boxShadow = 'none';
          }}
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
        <p className="mt-2 text-xs" style={{ color: '#f85149' }} role="alert" aria-live="polite">{message}</p>
      ) : null}

      <p className="mt-2 text-xs" style={{ color: '#484f58' }}>
        No spam. Unsubscribe anytime. Powered by{' '}
        <a href="https://beehiiv.com" target="_blank" rel="noopener noreferrer" style={{ color: '#8b949e' }} className="hover:underline">Beehiiv</a>.
      </p>
    </form>
  );
}
