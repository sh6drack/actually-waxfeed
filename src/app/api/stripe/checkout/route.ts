import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe, SUBSCRIPTION_TIERS, WAX_PAX, WaxPaxId } from '@/lib/stripe'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// POST /api/stripe/checkout - Create a checkout session
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const body = await request.json()
    const { type, productId } = body

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
        email: dbUser.email,
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

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    if (type === 'subscription') {
      // Subscription checkout
      const tier = productId as 'WAX_PLUS' | 'WAX_PRO'
      const tierConfig = SUBSCRIPTION_TIERS[tier]

      if (!tierConfig) {
        return errorResponse('Invalid subscription tier', 400)
      }

      // Check if user already has this subscription
      if (dbUser.subscriptionTier === tier) {
        return errorResponse('You already have this subscription', 400)
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'subscription',
        line_items: [
          {
            price: tierConfig.priceId,
            quantity: 1,
          }
        ],
        success_url: `${appUrl}/settings?subscription=success`,
        cancel_url: `${appUrl}/pricing?canceled=true`,
        metadata: {
          userId: user.id,
          type: 'subscription',
          tier,
        },
        subscription_data: {
          metadata: {
            userId: user.id,
            tier,
          }
        }
      })

      // Record pending purchase
      await prisma.purchase.create({
        data: {
          userId: user.id,
          stripeSessionId: session.id,
          type: 'SUBSCRIPTION',
          amount: tierConfig.monthlyPriceCents,
          productId: tier,
          status: 'PENDING',
        }
      })

      return successResponse({ url: session.url })

    } else if (type === 'wax_pax') {
      // Wax pax purchase
      const paxId = productId as WaxPaxId
      const pax = WAX_PAX[paxId]

      if (!pax) {
        return errorResponse('Invalid wax pax', 400)
      }

      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        mode: 'payment',
        line_items: [
          {
            price: pax.priceId,
            quantity: 1,
          }
        ],
        success_url: `${appUrl}/wallet?purchase=success&wax=${pax.waxAmount}`,
        cancel_url: `${appUrl}/shop?canceled=true`,
        metadata: {
          userId: user.id,
          type: 'wax_pax',
          paxId,
          waxAmount: pax.waxAmount.toString(),
        }
      })

      // Record pending purchase
      await prisma.purchase.create({
        data: {
          userId: user.id,
          stripeSessionId: session.id,
          type: 'WAX_PAX',
          amount: pax.priceCents,
          waxAmount: pax.waxAmount,
          productId: paxId,
          status: 'PENDING',
        }
      })

      return successResponse({ url: session.url })

    } else {
      return errorResponse('Invalid checkout type', 400)
    }

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error creating checkout session:', error)
    return errorResponse('Failed to create checkout session', 500)
  }
}
