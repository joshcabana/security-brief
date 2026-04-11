/**
 * POST /api/stripe/webhook
 *
 * Handles Stripe webhook events. Verifies the Stripe-Signature header.
 * Currently handles:
 *   - checkout.session.completed   → provision Pro access
 *   - customer.subscription.deleted → revoke Pro access
 *   - invoice.payment_failed       → send dunning signal
 *
 * The body must be read as raw bytes for signature verification — this
 * route must NOT apply body parsing middleware. The next.config.mjs
 * bodyParser: false pattern is not needed in App Router; reading
 * request.text() gives us the raw body directly.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import type Stripe from 'stripe';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Event handlers — extend these as your auth/DB layer grows
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  // TODO: when you add a database layer —
  //   1. Look up the user by session.customer_email
  //   2. Set their membership tier to 'pro'
  //   3. Store session.subscription as their subscription ID
  console.log('[stripe/webhook] checkout.session.completed', {
    sessionId: session.id,
    customerId: session.customer,
    subscriptionId: session.subscription,
    tier: session.metadata?.tier,
  });
}

async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  // TODO: find user by subscription.customer and downgrade tier
  console.log('[stripe/webhook] customer.subscription.deleted', {
    subscriptionId: subscription.id,
    customerId: subscription.customer,
  });
}

async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  // TODO: trigger dunning email / Beehiiv tag update
  console.log('[stripe/webhook] invoice.payment_failed', {
    invoiceId: invoice.id,
    customerId: invoice.customer,
    attemptCount: invoice.attempt_count,
  });
}

// ---------------------------------------------------------------------------
// Route handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET not set');
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 });
  }

  // Read raw body for signature verification
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Invalid signature';
    console.error('[stripe/webhook] signature verification failed:', message);
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 });
  }

  // Dispatch
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        // Silently ignore unhandled events
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Handler error';
    console.error('[stripe/webhook] handler error:', event.type, message);
    // Return 200 to prevent Stripe from retrying — log and handle separately
    return NextResponse.json({ received: true, warning: message }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
