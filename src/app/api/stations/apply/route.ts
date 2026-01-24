import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { z } from 'zod'

const applicationSchema = z.object({
  email: z.string().email("Invalid email address"),
  stationName: z.string().min(2, "Station name must be at least 2 characters"),
  university: z.string().optional(),
})

// Founding Station Program Constants
const FOUNDING_STATION_LIMIT = 50

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const validation = applicationSchema.safeParse(body)
    if (!validation.success) {
      return errorResponse(validation.error.errors[0].message, 400)
    }

    const { email, stationName, university } = validation.data

    // Check if founding spots are still available
    const foundingCount = await prisma.station.count({
      where: { isFoundingStation: true }
    })

    if (foundingCount >= FOUNDING_STATION_LIMIT) {
      return errorResponse(
        "All founding station spots have been claimed. Please contact us about standard partnership.",
        400
      )
    }

    // Check if station with this name already exists
    const existingStation = await prisma.station.findFirst({
      where: {
        OR: [
          { name: { equals: stationName, mode: 'insensitive' } },
          { slug: stationName.toLowerCase().replace(/[^a-z0-9]/g, '') }
        ]
      }
    })

    if (existingStation) {
      return errorResponse(
        "A station with this name already exists. If this is your station, please contact us.",
        409
      )
    }

    // Create the station application (pending approval)
    // For now, we'll create the station directly - in production you might want an approval flow
    const slug = stationName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')

    const station = await prisma.station.create({
      data: {
        name: stationName,
        slug,
        university: university || null,
        isFoundingStation: true, // Auto-approve founding stations
        email,
        // Default stats
        tastemakeScore: 0,
        goldSpinCount: 0,
        silverSpinCount: 0,
        bronzeSpinCount: 0,
        totalReviews: 0,
      }
    })

    // TODO: Send confirmation email to the station manager
    // TODO: Create a notification/admin alert for review

    return successResponse({
      message: "Application received! We'll be in touch within 48 hours.",
      stationId: station.id,
      foundingSpotsRemaining: FOUNDING_STATION_LIMIT - (foundingCount + 1),
    }, 201)
  } catch (error) {
    console.error('Error processing station application:', error)
    return errorResponse('Failed to submit application. Please try again.', 500)
  }
}
