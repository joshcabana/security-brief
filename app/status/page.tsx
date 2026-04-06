import type { Metadata } from 'next';
import { buildStatusSnapshot } from '@/lib/status-data.mjs';
import { createPageMetadata } from '@/lib/page-metadata.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/status',
  title: 'Public Status',
  description:
    'Runtime deployment snapshot and public operational status for AI Security Brief.',
});

type StatusRow = {
  key: string;
  label: string;
  value: string;
};

function formatLabel(label: string) {
  return label
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export default function StatusPage() {
  const snapshot = buildStatusSnapshot();
  const runtimeEntries = Object.entries(snapshot.runtime).filter(([, value]) => value !== null && value !== '');
  const driftDetected = snapshot.status_document.drift?.detected === true;

  return (
    <div className="bg-[#0d1117] min-h-screen">
      <div className="relative overflow-hidden bg-gradient-to-b from-[#080c11] to-[#0d1117] border-b border-[#21262d] py-14">
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden="true" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="section-label mb-3">Operations</div>
          <h1 className="text-white mb-4">Public Status</h1>
          <p className="text-lg max-w-3xl text-[#8b949e]">
            Runtime deployment snapshot for AI Security Brief, including the operator-maintained status document and the currently reported production metadata.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12">
        <section
          className={`rounded-2xl border p-6 bg-[#161b22] ${driftDetected ? 'border-[#d29922]' : 'border-[#30363d]'}`}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-white text-xl font-bold">Deployment Health</h2>
              <p className="text-sm mt-2 text-[#8b949e]">
                Generated at {snapshot.generated_at}
              </p>
            </div>
            <div
              className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-mono font-semibold uppercase tracking-widest border ${
                driftDetected 
                  ? 'bg-[rgba(210,153,34,0.12)] text-[#d29922] border-[rgba(210,153,34,0.28)]' 
                  : 'bg-[rgba(63,185,80,0.12)] text-[#3fb950] border-[rgba(63,185,80,0.28)]'
              }`}
            >
              {driftDetected ? 'Document drift detected' : 'Status aligned'}
            </div>
          </div>
          <p className="text-sm mt-4 leading-relaxed text-[#8b949e]">
            {snapshot.status_document.drift.summary}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border p-6 bg-[#161b22] border-[#30363d]">
            <h2 className="text-white text-xl font-bold mb-4">Site Status</h2>
            <dl className="space-y-3">
              {snapshot.status_document.site_status_rows.map((row: StatusRow) => (
                <div key={row.key} className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0 border-[#21262d]">
                  <dt className="text-xs font-mono uppercase tracking-widest text-[#00b4ff]">
                    {row.label}
                  </dt>
                  <dd className="text-sm leading-relaxed text-[#e6edf3]">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rounded-2xl border p-6 bg-[#161b22] border-[#30363d]">
            <h2 className="text-white text-xl font-bold mb-4">Runtime Metadata</h2>
            <dl className="space-y-3">
              {runtimeEntries.map(([key, value]: [string, any]) => (
                <div key={key} className="flex flex-col gap-1 border-b pb-3 last:border-b-0 last:pb-0 border-[#21262d]">
                  <dt className="text-xs font-mono uppercase tracking-widest text-[#00b4ff]">
                    {formatLabel(key)}
                  </dt>
                  <dd className="text-sm break-all text-[#e6edf3]">
                    {String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="rounded-2xl border p-6 bg-[#161b22] border-[#30363d]">
          <h2 className="text-white text-xl font-bold mb-4">Recent Merges</h2>
          {snapshot.status_document.recent_merges.length > 0 ? (
            <ul className="space-y-2 text-sm text-[#8b949e]">
              {snapshot.status_document.recent_merges.map((entry: string) => (
                <li key={entry} className="flex items-start gap-2">
                  <span className="text-[#00b4ff]" aria-hidden="true">&bull;</span>
                  <span>{entry}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-[#8b949e]">
              No recent merges are currently listed in the status document.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
