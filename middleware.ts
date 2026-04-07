import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getSecurityHeaders } from './lib/security-headers.mjs';

/**
 * Next.js middleware that enforces security headers on every response.
 *
 * The next.config.mjs `headers()` block is kept as a fallback, but this
 * middleware is the primary enforcement mechanism because it runs on the
 * Edge Runtime and is guaranteed to execute for every request — including
 * statically generated pages that may bypass `headers()` on certain
 * CDN edge caches.
 */
export function middleware(_request: NextRequest) {
  const response = NextResponse.next();
  const securityHeaders = getSecurityHeaders();

  for (const header of securityHeaders) {
    response.headers.set(header.key, header.value);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
