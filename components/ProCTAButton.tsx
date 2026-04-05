'use client';

import { useCallback } from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface ProCTAButtonProps {
  id: string;
  /** Which variant to render. */
  variant?: 'primary' | 'ghost';
  children?: React.ReactNode;
  className?: string;
  href?: string;
}

/**
 * Client-side CTA button that fires a LinkedIn Insight Tag conversion event
 * (`lintrk('track', { conversion_id })`) on click, then navigates to `href`.
 *
 * LinkedIn Conversion ID must be in env as NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP.
 */
export default function ProCTAButton({
  id,
  variant = 'primary',
  children,
  className,
  href = '/upgrade',
}: ProCTAButtonProps) {
  const fireLinkedInConversion = useCallback(() => {
    try {
      const conversionId = process.env.NEXT_PUBLIC_LINKEDIN_CONVERSION_PRO_SIGNUP;
      const win = window as unknown as LinkedInWindow;
      if (typeof window !== 'undefined' && win.lintrk && conversionId) {
        win.lintrk('track', { conversion_id: Number(conversionId) });
      }
    } catch {
      // Gracefully degrade - never block the click
    }
  }, []);

  const baseStyles =
    variant === 'primary'
      ? 'pro-cta-btn inline-flex items-center gap-2 px-8 py-4 rounded-lg font-bold text-base transition-all duration-200 group'
      : 'inline-flex items-center gap-2 px-6 py-4 rounded-lg font-semibold text-sm transition-all duration-200';

  const ghostStyles =
    variant === 'ghost'
      ? 'border border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
      : '';

  return (
    <Link
      href={href}
      id={id}
      onClick={fireLinkedInConversion}
      className={`${baseStyles} ${ghostStyles} ${className ?? ''}`}
    >
      {children ?? (
        <>
          Get Pro Access
          <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
        </>
      )}
    </Link>
  );
}

/** Minimal window type extension for LinkedIn Insight Tag. */
interface LinkedInWindow extends Window {
  lintrk: (action: string, payload: { conversion_id: number }) => void;
}
