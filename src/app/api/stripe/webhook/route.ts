import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { stripe, SUBSCRIPTION_TIERS, getWaxPackByPriceId, getSubscriptionByPriceId } from '@/lib/stripe'
import Stripe from 'stripe'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

// GET /api/stripe/webhook - Health check for webhook endpoint
export async function GET() {
  const hasSecret = !!process.env.STRIPE_WEBHOOK_SECRET
  const hasStripeKey = !!process.env.STRIPE_SECRET_KEY

  return NextResponse.json({
    status: 'ok',
    endpoint: '/api/stripe/webhook',
    configured: hasSecret && hasStripeKey,
    timestamp: new Date().toISOString(),
    checks: {
      STRIPE_SECRET_KEY: hasStripeKey ? 'set' : 'missing',
      STRIPE_WEBHOOK_SECRET: hasSecret ? 'set' : 'missing',
    }
  })
}

// In-memory cache for processed events (with TTL)
// Events are also tracked in WaxTransaction metadata for persistence
const processedEvents = new Map<string, number>()
const EVENT_TTL_MS = 24 * 60 * 60 * 1000 // 24 hours

// Check if event has already been processed (idempotency)
async function isEventProcessed(eventId: string): Promise<boolean> {
  // Check in-memory cache first
  const cachedAt = processedEvents.get(eventId)
  if (cachedAt && Date.now() - cachedAt < EVENT_TTL_MS) {
    return true
  }

  // Check database for persistent tracking
  const existing = await prisma.waxTransaction.findFirst({
    where: {
      metadata: {
        path: ['stripeEventId'],
        equals: eventId
      }
    }
  })

  if (existing) {
    processedEvents.set(eventId, Date.now())
    return true
  }

  return false
}

// Mark event as processed (in-memory only, actual record created during processing)
function markEventProcessed(eventId: string): void {
  processedEvents.set(eventId, Date.now())

  // Clean up old entries
  const now = Date.now()
  for (const [key, timestamp] of processedEvents.entries()) {
    if (now - timestamp > EVENT_TTL_MS) {
      processedEvents.delete(key)
    }
  }
}

async function grantSubscriptionWax(userId: string, tier: 'WAX_PLUS' | 'WAX_PRO') {
  const tierConfig = SUBSCRIPTION_TIERS[tier]
  const waxAmount = tierConfig.monthlyWaxGrant

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        waxBalance: { increment: waxAmount },
        lifetimeWaxEarned: { increment: waxAmount },
      }
    }),
    prisma.waxTransaction.create({
      data: {
        userId,
        amount: waxAmount,
        type: 'SUBSCRIPTION_GRANT',
        description: `Monthly ${tierConfig.name} Wax grant`,
        metadata: { tier }
      }
    })
  ])
}

async function handleCheckoutComplete(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId

  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  // Update purchase record status only
  // Wax granting is handled by payment_intent.succeeded to avoid double-granting
  await prisma.purchase.updateMany({
    where: { stripeSessionId: session.id },
    data: {
      status: 'COMPLETED',
      stripePaymentId: session.payment_intent as string,
    }
  })
  // Subscription activation is handled by subscription.created event
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId
  const tier = subscription.metadata?.tier as 'WAX_PLUS' | 'WAX_PRO'

  if (!userId || !tier) {
    // Try to get from customer
    const customer = await stripe.customers.retrieve(subscription.customer as string)
    if (customer.deleted) return
    
    const metaUserId = (customer.metadata as { userId?: string })?.userId
    if (!metaUserId) {
      console.error('No userId in subscription or customer metadata')
      return
    }
  }

  const finalUserId = userId || (await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer).metadata?.userId

  if (!finalUserId) return

  // Determine tier from price
  let finalTier = tier
  if (!finalTier && subscription.items.data[0]) {
    const priceId = subscription.items.data[0].price.id
    const subInfo = getSubscriptionByPriceId(priceId)
    if (subInfo) {
      finalTier = subInfo.tier as 'WAX_PLUS' | 'WAX_PRO'
    }
  }

  if (!finalTier) return

  // Update user subscription
  const periodEnd = (subscription as { current_period_end?: number }).current_period_end
  await prisma.user.update({
    where: { id: finalUserId },
    data: {
      subscriptionTier: finalTier,
      stripeSubscriptionId: subscription.id,
      isPremium: true,
      role: 'PREMIUM',
      premiumExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
    }
  })

  // Grant initial monthly Wax
  await grantSubscriptionWax(finalUserId, finalTier)
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  // Handle tier changes
  const priceId = subscription.items.data[0]?.price.id
  const subInfo = getSubscriptionByPriceId(priceId)

  if (!subInfo) return

  const userId = subscription.metadata?.userId
  if (!userId) return

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { subscriptionTier: true }
  })

  if (!currentUser) return

  const newTier = subInfo.tier as 'WAX_PLUS' | 'WAX_PRO'

  // Only update if tier changed
  if (currentUser.subscriptionTier !== newTier) {
    const periodEnd = (subscription as { current_period_end?: number }).current_period_end
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: newTier,
        premiumExpiresAt: periodEnd ? new Date(periodEnd * 1000) : null,
      }
    })
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId

  if (!userId) {
    // Try to find user by subscription ID
    const user = await prisma.user.findFirst({
      where: { stripeSubscriptionId: subscription.id }
    })
    if (!user) return

    await prisma.user.update({
      where: { id: user.id },
      data: {
        subscriptionTier: 'FREE',
        stripeSubscriptionId: null,
        isPremium: false,
        role: 'USER',
        premiumExpiresAt: null,
      }
    })
    return
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'FREE',
      stripeSubscriptionId: null,
      isPremium: false,
      role: 'USER',
      premiumExpiresAt: null,
    }
  })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  // Grant monthly Wax on subscription renewal
  if (invoice.billing_reason !== 'subscription_cycle') return

  const subscription = (invoice as { subscription?: string | null }).subscription
  if (!subscription) return

  const sub = await stripe.subscriptions.retrieve(subscription as string)
  const userId = sub.metadata?.userId
  if (!userId) return

  const priceId = sub.items.data[0]?.price.id
  const subInfo = getSubscriptionByPriceId(priceId)
  if (!subInfo) return

  const tier = subInfo.tier as 'WAX_PLUS' | 'WAX_PRO'
  await grantSubscriptionWax(userId, tier)
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent, stripeEventId: string) {
  const userId = paymentIntent.metadata?.userId
  const type = paymentIntent.metadata?.type

  if (!userId) {
    console.error('No userId in payment intent metadata')
    return
  }

  // Update purchase record
  await prisma.purchase.updateMany({
    where: { stripeSessionId: paymentIntent.id },
    data: {
      status: 'COMPLETED',
      stripePaymentId: paymentIntent.id,
    }
  })

  if (type === 'wax_pax') {
    const waxAmount = parseInt(paymentIntent.metadata?.waxAmount || '0')
    const paxId = paymentIntent.metadata?.paxId

    if (waxAmount > 0) {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: {
            waxBalance: { increment: waxAmount },
            lifetimeWaxEarned: { increment: waxAmount },
          }
        }),
        prisma.waxTransaction.create({
          data: {
            userId,
            amount: waxAmount,
            type: 'PURCHASE',
            description: `Purchased ${paxId} Wax pax`,
            metadata: { paxId, paymentIntentId: paymentIntent.id, stripeEventId }
          }
        })
      ])
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature or webhook secret' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )
  } catch (error) {
    console.error('Webhook signature verification failed:', error)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  try {
    // Idempotency check - skip if event already processed
    if (await isEventProcessed(event.id)) {
      console.log(`Event ${event.id} already processed, skipping`)
      return NextResponse.json({ received: true, skipped: true })
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        markEventProcessed(event.id)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        markEventProcessed(event.id)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        markEventProcessed(event.id)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        markEventProcessed(event.id)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        markEventProcessed(event.id)
        break

      case 'invoice.payment_failed':
        // Could notify user, but subscription.deleted will handle downgrade
        console.log('Payment failed for invoice:', event.data.object.id)
        break

      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent, event.id)
        markEventProcessed(event.id)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}
