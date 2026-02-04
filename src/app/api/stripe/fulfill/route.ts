import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getStripe } from '@/lib/stripe'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// POST /api/stripe/fulfill - Check and fulfill pending purchases
// Handles both Checkout Sessions and Payment Intents (Stripe Elements)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()
    const stripe = getStripe()

    // Find all pending purchases for this user
    const pendingPurchases = await prisma.purchase.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
        stripeSessionId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    if (pendingPurchases.length === 0) {
      return successResponse({ fulfilled: 0, message: 'No pending purchases' })
    }

    let fulfilledCount = 0
    const results: { id: string; status: string; waxAmount?: number }[] = []

    for (const purchase of pendingPurchases) {
      if (!purchase.stripeSessionId) continue

      try {
        // Determine if this is a Checkout Session or Payment Intent
        const isPaymentIntent = purchase.stripeSessionId.startsWith('pi_')
        const isCheckoutSession = purchase.stripeSessionId.startsWith('cs_')
        const isSubscription = purchase.stripeSessionId.startsWith('sub_')

        let isPaid = false
        let paymentId = purchase.stripeSessionId

        if (isPaymentIntent) {
          // Retrieve Payment Intent (from Stripe Elements)
          const paymentIntent = await stripe.paymentIntents.retrieve(purchase.stripeSessionId)
          isPaid = paymentIntent.status === 'succeeded'
          paymentId = paymentIntent.id
        } else if (isCheckoutSession) {
          // Retrieve Checkout Session
          const session = await stripe.checkout.sessions.retrieve(purchase.stripeSessionId)
          isPaid = session.payment_status === 'paid' || session.status === 'complete'
          paymentId = (session.payment_intent as string) || session.id

          if (session.status === 'expired') {
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: { status: 'FAILED' },
            })
            results.push({ id: purchase.stripeSessionId, status: 'expired' })
            continue
          }
        } else if (isSubscription) {
          // Retrieve Subscription
          const subscription = await stripe.subscriptions.retrieve(purchase.stripeSessionId)
          isPaid = subscription.status === 'active' || subscription.status === 'trialing'
          paymentId = subscription.id
        } else {
          results.push({ id: purchase.stripeSessionId, status: 'unknown_type' })
          continue
        }

        if (isPaid) {
          // Check if already fulfilled (idempotency)
          const existingTx = await prisma.waxTransaction.findFirst({
            where: {
              userId: user.id,
              type: 'PURCHASE',
              metadata: {
                path: ['paymentId'],
                equals: paymentId,
              },
            },
          })

          if (existingTx) {
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: { status: 'COMPLETED' },
            })
            results.push({ id: purchase.stripeSessionId, status: 'already_fulfilled' })
            continue
          }

          // Fulfill WAX_PAX purchases
          if (purchase.type === 'WAX_PAX' && purchase.waxAmount && purchase.waxAmount > 0) {
            await prisma.$transaction([
              prisma.user.update({
                where: { id: user.id },
                data: {
                  waxBalance: { increment: purchase.waxAmount },
                  lifetimeWaxEarned: { increment: purchase.waxAmount },
                },
              }),
              prisma.waxTransaction.create({
                data: {
                  userId: user.id,
                  amount: purchase.waxAmount,
                  type: 'PURCHASE',
                  description: `Purchased ${purchase.productId || 'Wax'} pax`,
                  metadata: {
                    paxId: purchase.productId,
                    paymentId,
                    fulfilledVia: 'manual_check',
                  },
                },
              }),
              prisma.purchase.update({
                where: { id: purchase.id },
                data: {
                  status: 'COMPLETED',
                  stripePaymentId: paymentId,
                },
              }),
            ])

            fulfilledCount++
            results.push({
              id: purchase.stripeSessionId,
              status: 'fulfilled',
              waxAmount: purchase.waxAmount,
            })
          } else {
            // Non-wax purchase (subscription), just mark complete
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: { status: 'COMPLETED', stripePaymentId: paymentId },
            })
            results.push({ id: purchase.stripeSessionId, status: 'completed' })
          }
        } else {
          results.push({ id: purchase.stripeSessionId, status: 'pending_payment' })
        }
      } catch (stripeError) {
        console.error(`Failed to check ${purchase.stripeSessionId}:`, stripeError)
        results.push({ id: purchase.stripeSessionId, status: 'error' })
      }
    }

    return successResponse({
      fulfilled: fulfilledCount,
      checked: pendingPurchases.length,
      results,
    })

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error fulfilling purchases:', error)
    return errorResponse('Failed to fulfill purchases', 500)
  }
}
