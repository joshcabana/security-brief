import { NextResponse } from 'next/server';
import { buildStatusSnapshot } from '@/lib/status-data.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const payload = buildStatusSnapshot();
  const publicPayload = {
    ...payload,
    runtime: {
      node_env: payload.runtime.node_env,
      target_env: payload.runtime.target_env,
      production_url: payload.runtime.production_url,
      git_commit_ref: payload.runtime.git_commit_ref,
      git_commit_sha: payload.runtime.git_commit_sha,
    },
  };

  return NextResponse.json(publicPayload, {
    headers: {
      'cache-control': 'no-store',
    },
  });
}
