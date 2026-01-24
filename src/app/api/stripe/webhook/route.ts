import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { prisma } from '@/lib/prisma'
import { stripe, SUBSCRIPTION_TIERS, getWaxPackByPriceId, getSubscriptionByPriceId } from '@/lib/stripe'
import Stripe from 'stripe'

// Disable body parsing for webhooks
export const runtime = 'nodejs'

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
  const type = session.metadata?.type

  if (!userId) {
    console.error('No userId in checkout session metadata')
    return
  }

  // Update purchase record
  await prisma.purchase.updateMany({
    where: { stripeSessionId: session.id },
    data: { 
      status: 'COMPLETED',
      stripePaymentId: session.payment_intent as string,
    }
  })

  if (type === 'wax_pax') {
    const waxAmount = parseInt(session.metadata?.waxAmount || '0')
    const paxId = session.metadata?.paxId

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
            metadata: { paxId, sessionId: session.id }
          }
        })
      ])
    }
  }
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
  await prisma.user.update({
    where: { id: finalUserId },
    data: {
      subscriptionTier: finalTier,
      stripeSubscriptionId: subscription.id,
      isPremium: true,
      role: 'PREMIUM',
      premiumExpiresAt: new Date(subscription.current_period_end * 1000),
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
    await prisma.user.update({
      where: { id: userId },
      data: {
        subscriptionTier: newTier,
        premiumExpiresAt: new Date(subscription.current_period_end * 1000),
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

  const subscription = invoice.subscription
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
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutComplete(event.data.object as Stripe.Checkout.Session)
        break

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.payment_succeeded':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        // Could notify user, but subscription.deleted will handle downgrade
        console.log('Payment failed for invoice:', event.data.object.id)
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
