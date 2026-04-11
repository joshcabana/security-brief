import { NextResponse } from 'next/server';
import { buildStatusSnapshot } from '@/lib/status-data.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const payload = buildStatusSnapshot();
  const runtime = payload.runtime as Record<string, string | null | undefined>;
  const publicPayload = {
    ...payload,
    runtime: {
      node_env: runtime.node_env ?? null,
      target_env: runtime.target_env ?? null,
      production_url: runtime.production_url ?? null,
      git_commit_ref: runtime.git_commit_ref ?? null,
      git_commit_sha: runtime.git_commit_sha ?? null,
    },
  };

  return NextResponse.json(publicPayload, {
    headers: {
      'cache-control': 'no-store',
    },
  });
}
