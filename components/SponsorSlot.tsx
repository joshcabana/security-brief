interface SponsorSlotProps {
  sponsor: string;
  url: string;
  tagline: string;
  label?: string;
}

export default function SponsorSlot({
  sponsor,
  url,
  tagline,
  label = 'Advertisement',
}: SponsorSlotProps) {
  return (
    <div
      className="relative rounded-xl overflow-hidden"
      style={{
        background: 'rgba(20, 20, 20, 0.5)',
        border: '1px dashed rgba(255, 255, 255, 0.15)',
      }}
    >
      <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <span
            className="text-[10px] font-mono font-semibold uppercase tracking-widest"
            style={{ color: '#484f58', letterSpacing: '0.12em' }}
          >
            {label}
          </span>
        </div>

        <div className="flex-1 min-w-0">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer sponsored"
            className="group inline-flex items-center gap-2"
          >
            <span
              className="text-sm font-bold transition-colors duration-200 group-hover:text-[#00b4ff]"
              style={{ color: '#e6edf3' }}
            >
              {sponsor}
            </span>
            <svg
              width="10"
              height="10"
              viewBox="0 0 12 12"
              fill="currentColor"
              className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ color: '#00b4ff' }}
              aria-hidden="true"
            >
              <path d="M3.5 3a.5.5 0 000 1H7.293L1.146 10.146a.5.5 0 00.708.708L8 4.707V8.5a.5.5 0 001 0v-5a.5.5 0 00-.5-.5h-5z" />
            </svg>
          </a>
          <p className="text-xs mt-0.5" style={{ color: '#8b949e' }}>
            {tagline}
          </p>
        </div>
      </div>

      {/* Subtle accent line at top */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent 0%, rgba(0,180,255,0.3) 50%, transparent 100%)',
        }}
        aria-hidden="true"
      />
    </div>
  );
}
