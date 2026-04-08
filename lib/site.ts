const fallbackSiteName = 'AI Security Brief';
const fallbackSiteUrl = 'http://localhost:3000';
const fallbackLinkedInProfileUrl = 'https://www.linkedin.com/in/josh-cabana-351631393/';

function resolvePublicHttpsUrl(rawValue: string | undefined): string | null {
  if (typeof rawValue !== 'string') {
    return null;
  }

  const trimmedValue = rawValue.trim();

  if (trimmedValue.length === 0) {
    return null;
  }

  try {
    const parsed = new URL(trimmedValue);

    if (parsed.protocol !== 'https:' || parsed.username || parsed.password) {
      return null;
    }

    return parsed.toString();
  } catch {
    return null;
  }
}

export const siteName = process.env.NEXT_PUBLIC_SITE_NAME?.trim() || fallbackSiteName;
export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim() || fallbackSiteUrl;
export const siteDescription =
  'AI-assisted security briefings on AI-powered threats, privacy defence, and security tooling for technical teams.';

export function getSiteUrl(): URL {
  return new URL(siteUrl);
}

export function isBeehiivCheckoutLive(): boolean {
  return process.env.NEXT_PUBLIC_PRO_CHECKOUT_LIVE?.trim().toLowerCase() === 'true';
}

export function getFounderLinkedInUrl(): string {
  return resolvePublicHttpsUrl(process.env.NEXT_PUBLIC_LINKEDIN_PROFILE_URL) ?? fallbackLinkedInProfileUrl;
}

export function getAssessmentBookingUrl(): string | null {
  return resolvePublicHttpsUrl(process.env.NEXT_PUBLIC_ASSESSMENT_BOOKING_URL);
}

export function getAssessmentPaymentUrl(): string | null {
  return resolvePublicHttpsUrl(process.env.NEXT_PUBLIC_ASSESSMENT_PAYMENT_URL);
}

export const siteConfig = {
  beehiiv: {
    upgradeUrl: 'https://aisec.beehiiv.com/upgrade',
    loginUrl: 'https://aisec.beehiiv.com/login',
    checkoutLive: isBeehiivCheckoutLive(),
  },
  founder: {
    linkedInUrl: getFounderLinkedInUrl(),
    xUrl: 'https://twitter.com/joshcabana',
  },
  offers: {
    assessment: {
      path: '/assessment',
      previewReportPath: '/report/2026-ai-threat-landscape',
      leadMagnetPath: '/lead-magnet',
      name: 'AI Agent Security Readiness Review',
      headline:
        'Founder, AI Security Brief | AI Application Security, Prompt Injection, Agentic Risk, Red Team-Informed Advisory',
      priceLabel: 'AUD 3,500',
      workshopPriceLabel: 'AUD 1,500',
      retainerPriceLabel: 'AUD 2,500/mo',
      deliveryWindow: '7 business days',
      bookingUrl: getAssessmentBookingUrl(),
      paymentUrl: getAssessmentPaymentUrl(),
    },
  },
};
