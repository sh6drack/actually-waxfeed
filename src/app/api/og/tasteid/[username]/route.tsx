import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { getArchetypeInfo } from '@/lib/tasteid'
import { getCurrentTier } from '@/lib/tasteid-tiers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      select: {
        username: true,
        tasteId: {
          select: {
            primaryArchetype: true,
            topGenres: true,
            adventurenessScore: true,
            polarityScore: true,
            averageRating: true,
            reviewCount: true,
          },
        },
      },
    })

    if (!user || !user.tasteId) {
      return new Response('TasteID not found', { status: 404 })
    }

    const archetype = getArchetypeInfo(user.tasteId.primaryArchetype)
    const tier = getCurrentTier(user.tasteId.reviewCount)

    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0a',
            color: '#fff',
            fontFamily: 'system-ui, -apple-system, sans-serif',
            padding: '48px',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: '32px',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '14px',
                  color: '#666',
                  letterSpacing: '0.2em',
                  textTransform: 'uppercase',
                }}
              >
                TASTEID
              </span>
              <span style={{ fontSize: '36px', fontWeight: 'bold' }}>
                @{user.username}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span
                style={{
                  fontSize: '20px',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                }}
              >
                WAXFEED
              </span>
              {/* Tier badge */}
              <span
                style={{
                  marginTop: '8px',
                  padding: '4px 12px',
                  backgroundColor: tier.color,
                  color: '#000',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                {tier.name} • {tier.maxConfidence}%
              </span>
            </div>
          </div>

          {/* Archetype */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '20px',
              marginBottom: '32px',
              padding: '28px',
              border: '3px solid #fff',
              backgroundColor: '#111',
            }}
          >
            <span style={{ fontSize: '56px' }}>{archetype.icon}</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontSize: '32px',
                  fontWeight: 'bold',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {archetype.name}
              </span>
              <span style={{ fontSize: '18px', color: '#888', marginTop: '4px' }}>
                {archetype.description}
              </span>
            </div>
          </div>

          {/* Top Genres */}
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
            <span
              style={{
                fontSize: '12px',
                color: '#666',
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                marginBottom: '12px',
              }}
            >
              TOP GENRES
            </span>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {user.tasteId.topGenres.slice(0, 5).map((genre, i) => (
                <span
                  key={i}
                  style={{
                    padding: '10px 20px',
                    border: '2px solid #444',
                    fontSize: '16px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: 'auto',
              paddingTop: '24px',
              borderTop: '2px solid #333',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#00ff88' }}>
                {Math.round(user.tasteId.adventurenessScore * 100)}%
              </span>
              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                ADVENTURENESS
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#00bfff' }}>
                {user.tasteId.polarityScore.toFixed(2)}
              </span>
              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                POLARITY
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd700' }}>
                {user.tasteId.averageRating.toFixed(1)}
              </span>
              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                AVG RATING
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {user.tasteId.reviewCount}
              </span>
              <span style={{ fontSize: '12px', color: '#666', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                RATINGS
              </span>
            </div>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('Error generating TasteID OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
