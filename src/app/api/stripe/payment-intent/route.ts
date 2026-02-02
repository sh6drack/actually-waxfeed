import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStripe, SUBSCRIPTION_TIERS, WAX_PAX, WaxPaxId } from '@/lib/stripe'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// POST /api/stripe/payment-intent - Create a Payment Intent for Elements
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { type, productId } = body

    const stripe = getStripe()

    // Get or create Stripe customer
    let dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true, email: true, subscriptionTier: true }
    })

    if (!dbUser) {
      return errorResponse('User not found', 404)
    }

    let customerId = dbUser.stripeCustomerId

    if (!customerId) {
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: dbUser.email || undefined,
        metadata: {
          userId: user.id,
        }
      })
      customerId = customer.id

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId }
      })
    }

    if (type === 'subscription') {
      // For subscriptions, we need to create a SetupIntent or use subscription creation
      // Stripe Elements handles subscription differently - using subscription creation with payment
      const tier = productId as 'WAX_PLUS' | 'WAX_PRO'
      const tierConfig = SUBSCRIPTION_TIERS[tier]

      if (!tierConfig) {
        return errorResponse('Invalid subscription tier', 400)
      }

      if (dbUser.subscriptionTier === tier) {
        return errorResponse('You already have this subscription', 400)
      }

      // Create a subscription with payment_behavior: 'default_incomplete'
      // This returns a client_secret for Elements to complete payment
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: tierConfig.priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId: user.id,
          tier,
        }
      })

      const invoice = subscription.latest_invoice as { payment_intent?: { client_secret: string } }
      const clientSecret = invoice?.payment_intent?.client_secret

      if (!clientSecret) {
        return errorResponse('Failed to create subscription', 500)
      }

      // Record pending purchase (upsert to handle retries)
      await prisma.purchase.upsert({
        where: { stripeSessionId: subscription.id },
        create: {
          userId: user.id,
          stripeSessionId: subscription.id,
          type: 'SUBSCRIPTION',
          amount: tierConfig.monthlyPriceCents,
          productId: tier,
          status: 'PENDING',
        },
        update: {} // No update needed, just prevent duplicate
      })

      return successResponse({
        clientSecret,
        subscriptionId: subscription.id,
        type: 'subscription',
      })

    } else if (type === 'wax_pax') {
      // One-time payment for Wax Pax
      const paxId = productId as WaxPaxId
      const pax = WAX_PAX[paxId]

      if (!pax) {
        return errorResponse('Invalid wax pax', 400)
      }

      // Create PaymentIntent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: pax.priceCents,
        currency: 'usd',
        customer: customerId,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          userId: user.id,
          type: 'wax_pax',
          paxId,
          waxAmount: pax.waxAmount.toString(),
        }
      })

      // Record pending purchase (upsert to handle retries)
      await prisma.purchase.upsert({
        where: { stripeSessionId: paymentIntent.id },
        create: {
          userId: user.id,
          stripeSessionId: paymentIntent.id,
          type: 'WAX_PAX',
          amount: pax.priceCents,
          waxAmount: pax.waxAmount,
          productId: paxId,
          status: 'PENDING',
        },
        update: {} // No update needed, just prevent duplicate
      })

      return successResponse({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        type: 'payment',
      })

    } else {
      return errorResponse('Invalid payment type', 400)
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error creating payment intent:', error)

    // Return more specific Stripe errors in development
    if (error instanceof Error) {
      const stripeError = error as { type?: string; code?: string; message?: string }
      if (stripeError.type === 'StripeInvalidRequestError' || stripeError.code) {
        return errorResponse(stripeError.message || 'Stripe error', 400)
      }
    }

    return errorResponse('Failed to create payment intent', 500)
  }
}
