import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// POST /api/stripe/fulfill - Check and fulfill pending purchases
// This handles cases where webhooks don't fire (local dev, network issues, etc.)
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    // Find all pending purchases for this user
    const pendingPurchases = await prisma.purchase.findMany({
      where: {
        userId: user.id,
        status: 'PENDING',
        stripeSessionId: { not: null },
      },
      orderBy: { createdAt: 'desc' },
      take: 10, // Limit to recent purchases
    })

    if (pendingPurchases.length === 0) {
      return successResponse({ fulfilled: 0, message: 'No pending purchases' })
    }

    let fulfilledCount = 0
    const results: { sessionId: string; status: string; waxAmount?: number }[] = []

    for (const purchase of pendingPurchases) {
      if (!purchase.stripeSessionId) continue

      try {
        // Retrieve session from Stripe
        const session = await stripe.checkout.sessions.retrieve(purchase.stripeSessionId)

        // Check if payment is complete
        if (session.payment_status === 'paid' || session.status === 'complete') {
          // Check if already fulfilled (idempotency)
          const existingTx = await prisma.waxTransaction.findFirst({
            where: {
              userId: user.id,
              type: 'PURCHASE',
              metadata: {
                path: ['sessionId'],
                equals: session.id,
              },
            },
          })

          if (existingTx) {
            // Already fulfilled, just mark as completed
            await prisma.purchase.update({
              where: { id: purchase.id },
              data: { status: 'COMPLETED' },
            })
            results.push({ sessionId: session.id, status: 'already_fulfilled' })
            continue
          }

          // Fulfill the purchase
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
                    sessionId: session.id,
                    fulfilledVia: 'manual_check',
                  },
                },
              }),
              prisma.purchase.update({
                where: { id: purchase.id },
                data: {
                  status: 'COMPLETED',
                  stripePaymentId: session.payment_intent as string,
                },
              }),
            ])

            fulfilledCount++
            results.push({
              sessionId: session.id,
              status: 'fulfilled',
              waxAmount: purchase.waxAmount,
            })
          }
        } else if (session.status === 'expired') {
          // Mark as failed
          await prisma.purchase.update({
            where: { id: purchase.id },
            data: { status: 'FAILED' },
          })
          results.push({ sessionId: session.id, status: 'expired' })
        } else {
          results.push({ sessionId: session.id, status: session.status || 'unknown' })
        }
      } catch (stripeError) {
        console.error(`Failed to check session ${purchase.stripeSessionId}:`, stripeError)
        results.push({ sessionId: purchase.stripeSessionId, status: 'error' })
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
