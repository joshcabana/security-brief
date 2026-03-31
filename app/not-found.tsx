import Link from 'next/link';

export default function NotFound() {
  return (
    <div
      className="flex flex-col items-center justify-center text-center px-4"
      style={{ background: '#0d1117', minHeight: '70vh' }}
    >
      <div className="relative">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(0,180,255,0.06) 0%, transparent 60%)' }}
          aria-hidden="true"
        />
        <div className="relative py-20">
          <p
            className="text-8xl font-black font-mono mb-6"
            style={{ color: '#00b4ff', letterSpacing: '-0.04em' }}
          >
            404
          </p>
          <h1 className="text-white text-2xl font-bold mb-4">Page not found</h1>
          <p className="text-sm leading-relaxed max-w-md mx-auto mb-10" style={{ color: '#8b949e' }}>
            The page you are looking for does not exist, has been moved, or is no longer available.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md bg-[#00b4ff] px-6 py-2.5 text-sm font-bold text-[#0d1117] transition-all duration-200 hover:bg-[#33c3ff] hover:shadow-[0_0_14px_rgba(0,180,255,0.3)]"
            >
              Back to home
            </Link>
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 rounded-md border border-[#30363d] px-6 py-2.5 text-sm font-bold transition-all duration-200 hover:border-[#00b4ff59] hover:text-[#00b4ff]"
              style={{ color: '#8b949e' }}
            >
              Browse articles
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
