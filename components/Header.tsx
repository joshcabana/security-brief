'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import ShieldLogo from './ShieldLogo';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/blog', label: 'Blog' },
  { href: '/tools', label: 'Tools' },
];

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header
      className="sticky top-0 z-50 w-full bg-slate-950/90 border-b border-slate-800 backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-3 group" aria-label="AI Security Brief home">
            <div className="transition-all duration-300 group-hover:drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]">
              <ShieldLogo />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-bold text-base text-white tracking-tight font-sans">
                AI Security Brief
              </span>
              <span className="text-[0.6rem] tracking-[0.18em] uppercase text-cyan-400 font-mono">
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
                  className={`relative px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
                    isActive 
                      ? 'text-cyan-400 bg-cyan-400/10' 
                      : 'text-slate-400 hover:text-cyan-400 hover:bg-cyan-400/5'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {link.label}
                  {isActive && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full bg-cyan-400" />
                  )}
                </Link>
              );
            })}
            <Link
              href="/newsletter"
              className="ml-2 px-4 py-2 rounded-md text-sm font-semibold text-slate-400 hover:text-cyan-400 transition-colors duration-200"
            >
              Subscribe
            </Link>
            <Link
              href="/pro"
              id="header-pro-cta"
              className="ml-1 px-4 py-2 rounded-md text-sm font-bold transition-all duration-200 hover:shadow-[0_0_16px_rgba(212,160,23,0.35)]"
              style={{ background: '#d29922', color: '#0d1117' }}
            >
              Go Pro
            </Link>
          </nav>

          <button
            className="md:hidden p-2 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
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
          <nav className="md:hidden py-4 border-t border-slate-800" aria-label="Mobile navigation">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => {
                const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-3 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      isActive ? 'text-cyan-400 bg-cyan-400/10' : 'text-slate-200 hover:bg-slate-800'
                    }`}
                    onClick={() => setMobileOpen(false)}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {link.label}
                  </Link>
                );
              })}
              <Link
                href="/newsletter"
                className="mt-3 px-4 py-2.5 rounded-md text-sm font-semibold text-center text-slate-200 hover:bg-slate-800 transition-all duration-200"
                onClick={() => setMobileOpen(false)}
              >
                Subscribe Free
              </Link>
              <Link
                href="/pro"
                id="header-pro-cta-mobile"
                className="mt-1 px-4 py-2.5 rounded-md text-sm font-bold text-center transition-all duration-200"
                style={{ background: '#d29922', color: '#0d1117' }}
                onClick={() => setMobileOpen(false)}
              >
                Go Pro
              </Link>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
}
