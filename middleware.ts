import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { CSP_NONCE_HEADER, getSecurityHeaders } from './lib/security-headers.mjs';

function generateScriptNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);

  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

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
  const scriptNonce = generateScriptNonce();
  const requestHeaders = new Headers(_request.headers);
  requestHeaders.set(CSP_NONCE_HEADER, scriptNonce);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
  const securityHeaders = getSecurityHeaders({ scriptNonce });

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
