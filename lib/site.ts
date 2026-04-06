const fallbackSiteName = 'AI Security Brief';
const fallbackSiteUrl = 'http://localhost:3000';

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || fallbackSiteName;
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl;
export const siteDescription =
  'AI-assisted security briefings on AI-powered threats, privacy defence, and security tooling for technical teams.';

export function getSiteUrl(): URL {
  return new URL(siteUrl);
}

export function isBeehiivCheckoutLive(env: Record<string, string | undefined> = process.env): boolean {
  return env.NEXT_PUBLIC_PRO_CHECKOUT_LIVE?.trim().toLowerCase() === 'true';
}

export const siteConfig = {
  beehiiv: {
    upgradeUrl: 'https://aisec.beehiiv.com/upgrade',
    loginUrl: 'https://aisec.beehiiv.com/login',
    checkoutLive: isBeehiivCheckoutLive(),
  }
};
