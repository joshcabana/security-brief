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
      // Affiliate & Vendor Redirects
      { source: '/go/lakera', destination: 'https://lakera.ai/', permanent: false },
      { source: '/go/protectai', destination: 'https://protectai.com/', permanent: false },
      { source: '/go/hiddenlayer', destination: 'https://hiddenlayer.com/', permanent: false },
      { source: '/go/mullvad', destination: 'https://mullvad.net/', permanent: false },
      { source: '/go/tailscale', destination: 'https://tailscale.com/', permanent: false },
      { source: '/go/proton', destination: 'https://proton.me/', permanent: false },
      { source: '/go/1password', destination: 'https://1password.com/', permanent: false },
      { source: '/go/yubico', destination: 'https://yubico.com/', permanent: false },
      { source: '/go/auth0', destination: 'https://auth0.com/', permanent: false },
      { source: '/go/snyk', destination: 'https://snyk.io/', permanent: false },
      { source: '/go/wiz', destination: 'https://wiz.io/', permanent: false },
      { source: '/go/pangea', destination: 'https://pangea.cloud/', permanent: false },
      { source: '/go/crowdstrike', destination: 'https://crowdstrike.com/', permanent: false },
      { source: '/go/vanta', destination: 'https://vanta.com/', permanent: false },
      { source: '/go/sentinelone', destination: 'https://sentinelone.com/', permanent: false },
      { source: '/go/drata', destination: 'https://drata.com/', permanent: false }
    ];
  },
};

export default nextConfig;
