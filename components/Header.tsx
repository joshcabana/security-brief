'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ShieldLogo from './ShieldLogo';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/blog', label: 'Blog' },
  { href: '/tools', label: 'Tools' },
  { href: '/newsletter', label: 'Newsletter' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full"
      style={{
        background: 'rgba(13, 17, 23, 0.92)',
        borderBottom: '1px solid #21262d',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group" aria-label="AI Security Brief home">
            <div className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(0,180,255,0.6)]">
              <ShieldLogo />
            </div>
            <div className="flex flex-col leading-none">
              <span
                className="font-bold text-base text-white tracking-tight"
                style={{ fontFamily: 'var(--font-inter, Inter, sans-serif)' }}
              >
                AI Security Brief
              </span>
              <span
                className="text-xs tracking-widest uppercase"
                style={{
                  color: '#00b4ff',
                  fontFamily: 'var(--font-jetbrains, "JetBrains Mono", monospace)',
                  fontSize: '0.6rem',
                  letterSpacing: '0.18em',
                }}
              >
                AI SECURITY BRIEFINGS
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {navLinks.map((link) => {
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200"
                  style={{
                    color: isActive ? '#00b4ff' : '#8b949e',
                    background: isActive ? 'rgba(0,180,255,0.08)' : 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#00b4ff';
                      e.currentTarget.style.background = 'rgba(0,180,255,0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#8b949e';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                      style={{ background: '#00b4ff' }}
                    />
                  )}
                </Link>
              );
            })}
            <Link
              href="/newsletter"
              className="ml-4 px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200"
              style={{ background: '#00b4ff', color: '#0d1117', fontWeight: 700 }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#33c3ff';
                e.currentTarget.style.boxShadow = '0 0 16px rgba(0,180,255,0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#00b4ff';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Subscribe
            </Link>
          </nav>

          <button
            className="md:hidden p-2 rounded-md transition-colors"
            style={{ color: '#8b949e' }}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {mobileOpen ? (
                <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
              ) : (
                <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              )}
            </svg>
          </button>
        </div>

        {mobileOpen && (
          <nav className="md:hidden py-4 border-t" style={{ borderColor: '#21262d' }} aria-label="Mobile navigation">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-3 py-2.5 text-sm font-medium rounded-md transition-colors"
                    style={{ color: isActive ? '#00b4ff' : '#e6edf3', background: isActive ? 'rgba(0,180,255,0.08)' : 'transparent' }}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/newsletter"
                className="mt-3 px-4 py-2.5 rounded-md text-sm font-bold text-center transition-all duration-200"
                style={{ background: '#00b4ff', color: '#0d1117' }}
                onClick={() => setMobileOpen(false)}
              >
                Subscribe Free
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
