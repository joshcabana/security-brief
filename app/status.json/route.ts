import { NextResponse } from 'next/server';
import { buildStatusSnapshot } from '@/lib/status-data.mjs';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const status = buildStatusSnapshot({});

  return NextResponse.json(status, {
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}
