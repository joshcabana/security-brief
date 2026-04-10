import type { Metadata } from 'next';
import { buildStatusSnapshot } from '@/lib/status-data.mjs';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/status',
  title: 'Public Status',
  description:
    'Operational status for AI Security Brief.',
  openGraphDescription:
    'Operational status for AI Security Brief.',
  twitterDescription:
    'Operational status for AI Security Brief.',
});

export default function StatusPage() {
  const snapshot = buildStatusSnapshot();

  return (
    <div className="bg-[#0d1117] min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#080c11] to-[#0d1117] border-b border-[#21262d] py-14">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">Operations</div>
          <h1 className="text-white mb-4">Public Status</h1>
          <p className="text-lg max-w-3xl text-[#8b949e]">
            Current operational status for {snapshot.site.name}.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section className="rounded-2xl border p-6 bg-[#161b22] border-[#30363d]">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-white text-xl font-bold">{snapshot.site.name}</h2>
              <p className="text-sm mt-2 text-[#8b949e]">
                Last checked: {snapshot.generated_at}
              </p>
            </div>
            <div className="inline-flex items-center rounded-full px-3 py-1 text-xs font-mono font-semibold uppercase tracking-widest border bg-[rgba(63,185,80,0.12)] text-[#3fb950] border-[rgba(63,185,80,0.28)]">
              Operational
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
