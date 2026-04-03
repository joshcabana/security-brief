import { getSecurityHeaders } from './lib/security-headers.mjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: getSecurityHeaders(),
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/assets/2026-ai-threat-landscape.pdf',
        destination: '/report/2026-ai-threat-landscape',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
