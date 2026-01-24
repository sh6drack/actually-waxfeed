import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'

// POST /api/stripe/portal - Create a customer portal session
export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth()

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { stripeCustomerId: true }
    })

    if (!dbUser?.stripeCustomerId) {
      return errorResponse('No subscription found', 400)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId,
      return_url: `${appUrl}/settings`,
    })

    return successResponse({ url: session.url })

  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error creating portal session:', error)
    return errorResponse('Failed to create portal session', 500)
  }
}
