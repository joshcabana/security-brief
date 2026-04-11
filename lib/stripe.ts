/**
 * lib/stripe.ts
 *
 * Stripe client singleton + pricing tier configuration.
 * Never import this on the client side — it reads STRIPE_SECRET_KEY.
 *
 * Usage (server only):
 *   import { stripe, STRIPE_PRICES, getTierByPriceId } from '@/lib/stripe';
 */

import Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Client singleton
// ---------------------------------------------------------------------------

let _stripe: Stripe | null = null;

export function getStripe(): Stripe {
  if (_stripe) return _stripe;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      'STRIPE_SECRET_KEY is not set. Add it to your environment variables.',
    );
  }

  _stripe = new Stripe(key, {
    apiVersion: '2025-01-27.acacia',
    typescript: true,
  });

  return _stripe;
}

// Alias for convenience
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as Record<string, unknown>)[prop as string];
  },
});

// ---------------------------------------------------------------------------
// Pricing config
// ---------------------------------------------------------------------------

export type Tier = 'free' | 'pro_monthly' | 'pro_yearly' | 'enterprise';

export interface TierConfig {
  id: Tier;
  name: string;
  monthlyEquivalent: number | null;
  priceId: string | null;
  description: string;
}

export const STRIPE_PRICES: Record<Tier, TierConfig> = {
  free: {
    id: 'free',
    name: 'Free',
    monthlyEquivalent: 0,
    priceId: null,
    description: 'Weekly briefings, full editorial archive, tools directory',
  },
  pro_monthly: {
    id: 'pro_monthly',
    name: 'Pro Monthly',
    monthlyEquivalent: 39,
    priceId: process.env.STRIPE_PRICE_PRO_MONTHLY ?? null,
    description: 'Full Pro access, billed monthly',
  },
  pro_yearly: {
    id: 'pro_yearly',
    name: 'Pro Yearly',
    monthlyEquivalent: 32.5, // $390/12
    priceId: process.env.STRIPE_PRICE_PRO_YEARLY ?? null,
    description: 'Full Pro access, billed yearly — save 16%',
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    monthlyEquivalent: null, // custom
    priceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    description: 'Team seats, white-label reports, dedicated support',
  },
};

/**
 * Look up a TierConfig by Stripe price ID.
 * Returns null if the price ID doesn't match any configured tier.
 */
export function getTierByPriceId(priceId: string): TierConfig | null {
  return (
    Object.values(STRIPE_PRICES).find((t) => t.priceId === priceId) ?? null
  );
}

/**
 * Get the allowed plans from a query param string.
 * Validates against known tiers to prevent open-redirect abuse.
 */
export function resolvePlanParam(
  raw: string | undefined | null,
): 'pro_monthly' | 'pro_yearly' {
  if (raw === 'pro_monthly' || raw === 'pro_yearly') return raw;
  // Default: monthly (lower friction entry)
  return 'pro_monthly';
}
