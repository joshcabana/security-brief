/**
 * GET /api/stripe/portal
 *
 * Redirects an authenticated customer to their Stripe Billing Portal
 * where they can manage subscriptions, update payment methods, and
 * view invoices.
 *
 * In production, replace the hardcoded customerId lookup with your
 * actual auth layer (e.g. JWT → Supabase → stripe_customer_id).
 *
 * Query params:
 *   customer_id: Stripe customer ID (temporary — replace with auth session lookup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { buildSiteUrl } from '@/lib/site';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);

  // TODO: Replace this with your actual auth layer
  // e.g. const session = await getServerSession(authOptions)
  //      const customerId = session?.user?.stripeCustomerId
  const customerId = searchParams.get('customer_id');

  if (!customerId) {
    return NextResponse.json(
      { error: 'Customer ID is required. Pass ?customer_id=cus_xxx or implement auth.' },
      { status: 400 },
    );
  }

  try {
    const stripe = getStripe();
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: buildSiteUrl('/pro'),
    });

    return NextResponse.redirect(portalSession.url, 303);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Portal failed';
    console.error('[stripe/portal] error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
