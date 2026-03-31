import type { Metadata } from 'next';
import Link from 'next/link';
import { createPageMetadata } from '@/lib/page-metadata.mjs';
import { buildStatusSnapshot } from '@/lib/status-data.mjs';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = createPageMetadata({
  canonicalPath: '/status',
  title: 'Operational Status — Deployment Truth & Release Verification',
  description:
    'Public operational status for AI Security Brief: pinned main baseline, deployment context, and release verification signals.',
  openGraphTitle: 'Operational Status — AI Security Brief',
  openGraphDescription:
    'Public operational status for AI Security Brief: pinned main baseline, deployment context, and release verification signals.',
  twitterTitle: 'AI Security Brief Status',
  twitterDescription:
    'Pinned main baseline, deployment context, and release verification signals for AI Security Brief.',
});

interface StatusRow {
  key: string;
  label: string;
  value: string;
}

interface StatusDocumentSnapshot {
  pinned_baseline_ref: string;
  pinned_baseline_sha: string;
  last_updated: string;
  updated_by: string;
  verification_pipeline: string;
  site_status_rows: StatusRow[];
  content_rows: StatusRow[];
  open_pull_requests: string[];
  recent_merges: string[];
  drift: {
    detected: boolean;
    summary: string;
    document_pinned_baseline_ref: string;
    document_pinned_baseline_sha: string;
    document_latest_deploy: string | null;
    runtime_git_commit_ref: string | null;
    runtime_git_commit_sha: string | null;
    runtime_latest_deploy: string | null;
  };
}

function renderStatusRows(rows: StatusRow[]) {
  return rows.map((row) => (
    <div
      key={row.key}
      className="grid gap-2 rounded-xl border px-4 py-4 sm:grid-cols-[220px_minmax(0,1fr)]"
      style={{ borderColor: '#21262d', background: 'rgba(13, 17, 23, 0.72)' }}
    >
      <dt className="text-xs font-mono uppercase tracking-widest" style={{ color: '#8b949e', letterSpacing: '0.12em' }}>
        {row.label}
      </dt>
      <dd className="text-sm leading-7 text-white" style={{ wordBreak: 'break-word' }}>
        {row.value}
      </dd>
    </div>
  ));
}

export default async function StatusPage() {
  const snapshot = buildStatusSnapshot({});
  const baseline = snapshot.status_document as StatusDocumentSnapshot;
  const runtimeRows: StatusRow[] = [
    {
      key: 'generated_at',
      label: 'Generated at',
      value: snapshot.generated_at,
    },
    {
      key: 'runtime_commit',
      label: 'Runtime commit',
      value: snapshot.runtime.git_commit_sha ?? 'Not exposed in runtime environment variables.',
    },
    {
      key: 'runtime_ref',
      label: 'Runtime ref',
      value: snapshot.runtime.git_commit_ref ?? 'Not exposed in runtime environment variables.',
    },
    {
      key: 'target_env',
      label: 'Target environment',
      value: snapshot.runtime.target_env ?? 'Unknown',
    },
    {
      key: 'deployment_url',
      label: 'Deployment URL',
      value: snapshot.runtime.deployment_url ?? snapshot.site.url,
    },
    {
      key: 'production_url',
      label: 'Production URL',
      value: snapshot.runtime.production_url,
    },
  ];
  const baselineRows: StatusRow[] = [
    {
      key: 'pinned_baseline',
      label: 'Pinned baseline',
      value: `${baseline.pinned_baseline_ref} @ ${baseline.pinned_baseline_sha}`,
    },
    {
      key: 'last_updated',
      label: 'Last updated',
      value: baseline.last_updated,
    },
    {
      key: 'updated_by',
      label: 'Updated by',
      value: baseline.updated_by,
    },
    {
      key: 'verification_pipeline',
      label: 'Verification pipeline',
      value: baseline.verification_pipeline,
    },
  ];

  return (
    <div style={{ background: '#0d1117', minHeight: '100vh' }}>
      <section
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom, #080c11, #0d1117)',
          borderBottom: '1px solid #21262d',
          paddingTop: '4.5rem',
          paddingBottom: '4rem',
        }}
      >
        <div className="absolute inset-0 bg-grid opacity-40 pointer-events-none" aria-hidden="true" />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at top right, rgba(0,180,255,0.12), transparent 45%)' }}
          aria-hidden="true"
        />
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-mono uppercase tracking-widest"
            style={{ border: '1px solid rgba(0,180,255,0.28)', background: 'rgba(0,180,255,0.08)', color: '#00b4ff', letterSpacing: '0.12em' }}
          >
            Operational Truth Surface
          </div>
          <h1 className="mt-6 text-white" style={{ letterSpacing: '-0.03em' }}>
            Public deployment truth for the site, the repo baseline, and the current runtime.
          </h1>
          <p className="mt-5 max-w-3xl text-lg leading-8" style={{ color: '#8b949e' }}>
            This page is the human-readable companion to the machine-readable
            {' '}
            <Link href="/status.json" className="underline decoration-[#00b4ff] underline-offset-4 hover:text-white" style={{ color: '#00b4ff' }}>
              /status.json
            </Link>
            {' '}
            endpoint. The document baseline comes from `STATUS.md`; runtime deployment fields come from the live environment.
          </p>
        </div>
      </section>

      <section className="py-14" style={{ background: '#0d1117' }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div>
            <div className="section-label mb-4">Runtime Snapshot</div>
            <dl className="space-y-3">{renderStatusRows(runtimeRows)}</dl>
          </div>

          <div>
            <div className="section-label mb-4">Document Baseline</div>
            {baseline.drift.detected && (
              <div
                className="mb-4 rounded-2xl border px-4 py-4 text-sm leading-7"
                style={{ borderColor: 'rgba(255, 166, 87, 0.35)', background: 'rgba(255, 166, 87, 0.08)', color: '#ffa657' }}
              >
                {baseline.drift.summary}
              </div>
            )}
            <dl className="space-y-3">{renderStatusRows(baselineRows)}</dl>
          </div>

          <div>
            <div className="section-label mb-4">Site Status</div>
            <dl className="space-y-3">{renderStatusRows(baseline.site_status_rows)}</dl>
          </div>

          <div>
            <div className="section-label mb-4">Content Snapshot</div>
            <dl className="space-y-3">{renderStatusRows(baseline.content_rows)}</dl>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: '#21262d', background: 'rgba(13, 17, 23, 0.72)' }}
            >
              <h2 className="text-white text-2xl">Open Pull Requests</h2>
              <p className="mt-3 text-sm leading-7" style={{ color: '#8b949e' }}>
                {baseline.open_pull_requests.length === 0
                  ? 'No open pull requests are recorded in the status document.'
                  : `${baseline.open_pull_requests.length} open pull requests are recorded in the status document.`}
              </p>
              {baseline.open_pull_requests.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm" style={{ color: '#e6edf3' }}>
                  {baseline.open_pull_requests.map((pullRequest) => (
                    <li key={pullRequest}>{pullRequest}</li>
                  ))}
                </ul>
              )}
            </div>

            <div
              className="rounded-2xl border p-6"
              style={{ borderColor: '#21262d', background: 'rgba(13, 17, 23, 0.72)' }}
            >
              <h2 className="text-white text-2xl">Recent Merges</h2>
              <ul className="mt-4 space-y-2 text-sm leading-7" style={{ color: '#e6edf3' }}>
                {baseline.recent_merges.map((mergeSummary) => (
                  <li key={mergeSummary}>{mergeSummary}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
