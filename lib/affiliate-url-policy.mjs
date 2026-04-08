import { normalizeOutboundUrl } from './url-safety.mjs';

export const AFFILIATE_HOST_ALLOWLIST = Object.freeze({
  NORDVPN: Object.freeze(['nordvpn.com', 'nordvpn.net']),
  PUREVPN: Object.freeze(['purevpn.com']),
  SURFSHARK: Object.freeze(['surfshark.com']),
  INCOGNI: Object.freeze(['incogni.com']),
  PROTON: Object.freeze(['getproton.me', 'proton.me', 'protonvpn.com']),
  PROTON_VPN: Object.freeze(['getproton.me', 'proton.me', 'protonvpn.com']),
  PROTON_MAIL: Object.freeze(['getproton.me', 'proton.me']),
  BITWARDEN: Object.freeze(['bitwarden.com']),
  '1PASSWORD': Object.freeze(['1password.com']),
  '1PASSWORD_BIZ': Object.freeze(['1password.com']),
  MALWAREBYTES: Object.freeze(['malwarebytes.com']),
  CYBERGHOST: Object.freeze(['cyberghostvpn.com', 'cyberghost.com']),
  JASPER: Object.freeze(['jasper.ai']),
  VANTA: Object.freeze(['vanta.com']),
  DRATA: Object.freeze(['drata.com']),
  PROTECT_AI: Object.freeze(['protectai.com']),
  LAKERA: Object.freeze(['lakera.ai']),
  CROWDSTRIKE: Object.freeze(['crowdstrike.com']),
  WIZ: Object.freeze(['wiz.io']),
  AUTH0: Object.freeze(['auth0.com']),
});

function hostnameMatchesAllowlist(hostname, allowedHosts) {
  const normalizedHostname = hostname.toLowerCase();

  return allowedHosts.some((allowedHost) => {
    const normalizedAllowedHost = allowedHost.toLowerCase();
    return (
      normalizedHostname === normalizedAllowedHost ||
      normalizedHostname.endsWith(`.${normalizedAllowedHost}`)
    );
  });
}

export function getApprovedAffiliateHosts(code) {
  if (typeof code !== 'string') {
    return null;
  }

  return AFFILIATE_HOST_ALLOWLIST[code] ?? null;
}

export function normalizeApprovedAffiliateUrl(code, rawValue) {
  const normalizedUrl = normalizeOutboundUrl(rawValue);
  const approvedHosts = getApprovedAffiliateHosts(code);

  if (!normalizedUrl || !approvedHosts || approvedHosts.length === 0) {
    return null;
  }

  let parsedUrl;

  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return null;
  }

  return hostnameMatchesAllowlist(parsedUrl.hostname, approvedHosts) ? normalizedUrl : null;
}
