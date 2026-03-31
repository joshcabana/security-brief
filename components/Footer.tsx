import Link from 'next/link';
import NewsletterForm from './NewsletterForm';
import ShieldLogo from './ShieldLogo';

const footerSections = [
  {
    title: 'Briefings',
    links: [
      { label: 'Latest articles', href: '/blog' },
      { label: 'AI Threats', href: `/blog?category=${encodeURIComponent('AI Threats')}` },
      { label: 'Privacy', href: `/blog?category=${encodeURIComponent('Privacy')}` },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Security tools', href: '/tools' },
      { label: 'VPN reviews', href: '/tools#vpns' },
      { label: 'Password managers', href: '/tools#password-managers' },
      { label: 'Email security', href: '/tools#email-security' },
    ],
  },
  {
    title: 'Project',
    links: [
      { label: 'Home', href: '/' },
      { label: 'About', href: '/about' },
      { label: 'Newsletter', href: '/newsletter' },
      { label: 'Operational status', href: '/status' },
      { label: 'RSS feed', href: '/feed.xml', external: true },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of service', href: '/terms' },
      { label: 'GitHub repo', href: 'https://github.com/joshcabana/ai-security-brief', external: true },
    ],
  },
];

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ background: '#080c11', borderTop: '1px solid #21262d' }} aria-label="Site footer">
      <div style={{ background: 'rgba(0,180,255,0.04)', borderBottom: '1px solid #21262d' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8">
            <div className="flex-1 min-w-0">
              <p className="text-xs uppercase tracking-widest font-mono mb-2" style={{ color: '#00b4ff', letterSpacing: '0.15em' }}>Stay briefed</p>
              <h3 className="text-xl font-bold text-white mb-1">Weekly briefings and tooling notes</h3>
              <p className="text-sm" style={{ color: '#8b949e' }}>One useful issue each week covering AI threats, privacy changes, and practical security tools.</p>
            </div>
            <div className="w-full md:w-auto md:min-w-80">
              <NewsletterForm variant="footer" source="footer" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4 group" aria-label="AI Security Brief home">
              <ShieldLogo width={26} height={30} className="transition-all duration-300 group-hover:drop-shadow-[0_0_6px_rgba(0,180,255,0.5)]" />
              <span className="font-bold text-white text-sm tracking-tight">AI Security Brief</span>
            </Link>
            <p className="text-sm leading-relaxed mb-5" style={{ color: '#8b949e' }}>
              AI-assisted security briefings on AI-powered threats, privacy defence, and the tooling choices that support both.
            </p>
            <a
              href="https://github.com/joshcabana/ai-security-brief"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm"
              style={{ color: '#00b4ff' }}
            >
              View the source repo
              <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" aria-hidden="true">
                <path d="M3.5 3a.5.5 0 000 1H7.293L1.146 10.146a.5.5 0 00.708.708L8 4.707V8.5a.5.5 0 001 0v-5a.5.5 0 00-.5-.5h-5z" />
              </svg>
            </a>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-mono uppercase tracking-widest mb-4" style={{ color: '#8b949e', letterSpacing: '0.12em' }}>{section.title}</h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.href}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-[#484f58] transition-colors duration-200 hover:text-[#00b4ff]"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="text-sm text-[#484f58] transition-colors duration-200 hover:text-[#00b4ff]"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4" style={{ borderTop: '1px solid #21262d' }}>
          <p className="text-xs" style={{ color: '#484f58' }}>
            © {currentYear} AI Security Brief. All rights reserved.
            <span className="mx-2">·</span>
            <span style={{ fontFamily: '"JetBrains Mono", monospace', color: '#30363d' }}>Independent editorial publication</span>
          </p>
          <span className="text-xs text-[#484f58]">
            AI threats, privacy, and practical defence
          </span>
        </div>
      </div>
    </footer>
  );
}
