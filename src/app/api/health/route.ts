import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Test database connection
    const albumCount = await prisma.album.count()
    const reviewCount = await prisma.review.count()
    const userCount = await prisma.user.count()

    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      counts: {
        albums: albumCount,
        reviews: reviewCount,
        users: userCount,
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Health check failed:', error)
    return NextResponse.json({
      status: 'unhealthy',
      database: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
