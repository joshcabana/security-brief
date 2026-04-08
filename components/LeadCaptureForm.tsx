'use client';

import { useState, type FormEvent } from 'react';

interface LeadCaptureFormProps {
  buttonText?: string;
  source?: string;
  asset?: string;
  successTitle?: string;
  successMessageOverride?: string;
}

type FormStatus = 'idle' | 'loading' | 'success' | 'error';

const FREE_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'yahoo.co.uk',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'aol.com',
  'icloud.com',
  'me.com',
  'mail.com',
  'protonmail.com',
  'proton.me',
  'gmx.com',
  'zoho.com',
  'yandex.com',
  'tutanota.com',
  'fastmail.com',
]);

const JOB_TITLES = [
  'CISO / CSO',
  'VP of Security',
  'Security Engineer',
  'AppSec Engineer',
  'DevSecOps Engineer',
  'Cloud Security Engineer',
  'SOC Analyst',
  'Penetration Tester',
  'Security Architect',
  'Engineering Manager',
  'CTO / VP Engineering',
  'AI / ML Engineer',
  'Software Engineer',
  'Consultant / Advisor',
  'Student / Researcher',
  'Other',
] as const;

function isWorkEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase();
  if (!domain) return false;
  return !FREE_EMAIL_DOMAINS.has(domain);
}

export default function LeadCaptureForm({
  buttonText = 'Send me the report',
  source = 'lead-capture',
  asset = 'ai-security-tools-matrix',
  successTitle = 'Report queued',
  successMessageOverride,
}: LeadCaptureFormProps) {
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
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

    if (!isWorkEmail(email)) {
      setStatus('error');
      setMessage('Please use your work email. We send reports to professional addresses only.');
      return;
    }

    if (!jobTitle) {
      setStatus('error');
      setMessage('Please select your role so we can tailor the report.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const response = await fetch('/api/lead-capture', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          jobTitle,
          source,
          asset,
          website,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setStatus('error');
        setMessage(payload.message || 'Request failed. Please try again.');
        return;
      }

      setStatus('success');
      setMessage(successMessageOverride || payload.message || 'Check your inbox — the report is on its way.');
      setEmail('');
      setJobTitle('');
      setWebsite('');
    } catch {
      setStatus('error');
      setMessage('Could not reach the server. Please try again.');
    }
  };

  if (status === 'success') {
    return (
      <div
        className="flex items-start gap-3 p-5 rounded-xl"
        style={{
          background: 'rgba(63, 185, 80, 0.06)',
          border: '1px solid rgba(63, 185, 80, 0.2)',
        }}
        role="alert"
        aria-live="polite"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{ color: '#3fb950', flexShrink: 0, marginTop: '2px' }}
          aria-hidden="true"
        >
          <path
            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
            fill="currentColor"
          />
        </svg>
        <div>
          <p className="text-sm font-semibold" style={{ color: '#3fb950' }}>
            {successTitle}
          </p>
          <p className="text-sm mt-1" style={{ color: '#8b949e' }}>
            {message}
          </p>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full"
      aria-label="Report download form"
      data-lead-source={source}
    >
      <div className="space-y-3">
        {/* Work email */}
        <div>
          <label htmlFor={`lead-email-${source}`} className="sr-only">
            Work email
          </label>
          <input
            id={`lead-email-${source}`}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            placeholder="you@company.com"
            required
            disabled={status === 'loading'}
            className="w-full rounded-md text-sm transition-all duration-200 disabled:opacity-60"
            style={{
              background: 'rgba(22, 27, 34, 0.9)',
              border: status === 'error' ? '1px solid #f85149' : '1px solid #30363d',
              color: '#e6edf3',
              outline: 'none',
              padding: '0.75rem 1rem',
            }}
            onFocus={(e) => {
              if (status !== 'error') {
                e.currentTarget.style.borderColor = '#00b4ff';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.1)';
              }
            }}
            onBlur={(e) => {
              if (status !== 'error') {
                e.currentTarget.style.borderColor = '#30363d';
                e.currentTarget.style.boxShadow = 'none';
              }
            }}
          />
          <p className="mt-1.5 text-xs" style={{ color: '#484f58' }}>
            Work email required — we don&apos;t send reports to personal addresses.
          </p>
        </div>

        {/* Job title */}
        <div>
          <label htmlFor={`lead-title-${source}`} className="sr-only">
            Job title
          </label>
          <select
            id={`lead-title-${source}`}
            value={jobTitle}
            onChange={(e) => {
              setJobTitle(e.target.value);
              if (status === 'error') setStatus('idle');
            }}
            required
            disabled={status === 'loading'}
            className="w-full rounded-md text-sm transition-all duration-200 disabled:opacity-60 appearance-none cursor-pointer"
            style={{
              background: 'rgba(22, 27, 34, 0.9)',
              border: '1px solid #30363d',
              color: jobTitle ? '#e6edf3' : '#484f58',
              outline: 'none',
              padding: '0.75rem 1rem',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#00b4ff';
              e.currentTarget.style.boxShadow = '0 0 0 3px rgba(0,180,255,0.1)';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#30363d';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <option value="" disabled>
              Select your role
            </option>
            {JOB_TITLES.map((title) => (
              <option key={title} value={title}>
                {title}
              </option>
            ))}
          </select>
        </div>

        {/* Honeypot */}
        <div hidden aria-hidden="true">
          <label htmlFor={`lead-website-${source}`}>Website</label>
          <input
            id={`lead-website-${source}`}
            type="text"
            name="website"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            autoComplete="off"
            aria-hidden="true"
            tabIndex={-1}
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full font-bold text-sm rounded-md transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: '#00b4ff',
            color: '#0d1117',
            padding: '0.875rem 1.5rem',
          }}
          onMouseEnter={(e) => {
            if (status !== 'loading') {
              e.currentTarget.style.background = '#33c3ff';
              e.currentTarget.style.boxShadow = '0 0 20px rgba(0,180,255,0.35)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#00b4ff';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {status === 'loading' ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeDasharray="32"
                  strokeDashoffset="8"
                />
              </svg>
              Sending…
            </span>
          ) : (
            buttonText
          )}
        </button>
      </div>

      {status === 'error' && (
        <p className="mt-2 text-xs" style={{ color: '#f85149' }} role="alert" aria-live="polite">
          {message}
        </p>
      )}

      <p className="mt-3 text-xs" style={{ color: '#484f58' }}>
        We respect your inbox. No spam, no list-selling. Unsubscribe anytime.
      </p>
    </form>
  );
}
