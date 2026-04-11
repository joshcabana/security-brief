/**
 * POST /api/stripe/checkout
 *
 * Creates a Stripe Checkout Session and redirects the user.
 * Validates the plan param to prevent open-redirect abuse.
 * Rate-limited via Upstash Redis.
 *
 * Query params:
 *   plan: 'pro_monthly' | 'pro_yearly' (default: pro_monthly)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe, STRIPE_PRICES, resolvePlanParam } from '@/lib/stripe';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { buildSiteUrl } from '@/lib/site';

// Rate limit: 10 checkout attempts per hour per IP
let ratelimit: Ratelimit | null = null;
function getRatelimit(): Ratelimit | null {
  if (ratelimit) return ratelimit;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(10, '1 h'),
    prefix: 'rl:stripe:checkout',
  });
  return ratelimit;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const planParam = searchParams.get('plan');
  const plan = resolvePlanParam(planParam);
  const tierConfig = STRIPE_PRICES[plan];

  if (!tierConfig.priceId) {
    return NextResponse.json(
      { error: 'Stripe price not configured for this plan. Set the STRIPE_PRICE_* env var.' },
      { status: 503 },
    );
  }

  // Rate limiting
  const rl = getRatelimit();
  if (rl) {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'anonymous';
    const { success } = await rl.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 },
      );
    }
  }

  try {
    const stripe = getStripe();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{ price: tierConfig.priceId, quantity: 1 }],
      success_url: buildSiteUrl('/pro?checkout=success&session_id={CHECKOUT_SESSION_ID}'),
      cancel_url: buildSiteUrl('/pricing?checkout=cancelled'),
      allow_promotion_codes: true,
      subscription_data: {
        trial_period_days: 0,
        metadata: {
          tier: plan,
          source: 'web_checkout',
        },
      },
      metadata: {
        tier: plan,
      },
    });

    if (!session.url) {
      throw new Error('Stripe session created without a redirect URL.');
    }

    return NextResponse.redirect(session.url, 303);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Checkout failed';
    console.error('[stripe/checkout] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Stripe checkout only needs GET (redirect flow)
export const dynamic = 'force-dynamic';
