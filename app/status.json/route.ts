import { NextResponse } from 'next/server';
import { buildStatusSnapshot } from '@/lib/status-data.mjs';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  const payload = buildStatusSnapshot();

  return NextResponse.json(payload, {
    headers: {
      'cache-control': 'no-store',
    },
  });
}
