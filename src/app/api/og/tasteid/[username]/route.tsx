import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { getArchetypeInfo } from '@/lib/tasteid'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params

  try {
    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        tasteId: true,
      },
    })

    if (!user || !user.tasteId) {
      return new Response('TasteID not found', { status: 404 })
    }

    const tasteId = user.tasteId
    const archetype = getArchetypeInfo(tasteId.primaryArchetype)
    const topGenres = tasteId.topGenres.slice(0, 3)

    // Get base URL for logo
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://wax-feed.com'

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0a0a',
            padding: 60,
            fontFamily: 'system-ui, sans-serif',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Iridescent gradient accent - top right */}
          <div
            style={{
              position: 'absolute',
              top: -100,
              right: -100,
              width: 400,
              height: 400,
              background: 'radial-gradient(circle, rgba(147,51,234,0.3) 0%, rgba(59,130,246,0.2) 40%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* Iridescent gradient accent - bottom left */}
          <div
            style={{
              position: 'absolute',
              bottom: -150,
              left: -150,
              width: 500,
              height: 500,
              background: 'radial-gradient(circle, rgba(236,72,153,0.2) 0%, rgba(147,51,234,0.15) 40%, transparent 70%)',
              borderRadius: '50%',
            }}
          />

          {/* Main content */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 50, zIndex: 1 }}>
            {/* Left side - Disc logo with user avatar */}
            <div
              style={{
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'linear-gradient(145deg, #1a1a1a 0%, #0d0d0d 100%)',
                border: '3px solid #333',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 0 60px rgba(147,51,234,0.2), inset 0 0 30px rgba(0,0,0,0.5)',
              }}
            >
              {/* Vinyl grooves effect */}
              <div
                style={{
                  position: 'absolute',
                  width: '90%',
                  height: '90%',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.05)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  width: '70%',
                  height: '70%',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.03)',
                }}
              />
              {/* Center - user avatar or archetype icon */}
              <div
                style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #333 0%, #1a1a1a 100%)',
                  border: '2px solid #444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 40,
                }}
              >
                {archetype?.icon || '🎵'}
              </div>
            </div>

            {/* Right side - User info */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 12 }}>
              {/* Label */}
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#666',
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                }}
              >
                TASTEID
              </div>

              {/* Username */}
              <div
                style={{
                  fontSize: 52,
                  fontWeight: 700,
                  color: '#fff',
                  letterSpacing: -1,
                }}
              >
                @{user.username}
              </div>

              {/* Archetype badge */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    color: '#fff',
                    padding: '8px 20px',
                    border: '2px solid #fff',
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  {archetype?.name || tasteId.primaryArchetype}
                </div>
              </div>

              {/* Stats row */}
              <div
                style={{
                  display: 'flex',
                  gap: 32,
                  marginTop: 16,
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 14, color: '#666', textTransform: 'uppercase', letterSpacing: 2 }}>
                    POLARITY
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
                    {tasteId.polarityScore.toFixed(2)}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 14, color: '#666', textTransform: 'uppercase', letterSpacing: 2 }}>
                    REVIEWS
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
                    {tasteId.reviewCount}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ fontSize: 14, color: '#666', textTransform: 'uppercase', letterSpacing: 2 }}>
                    ADVENTURENESS
                  </div>
                  <div style={{ fontSize: 36, fontWeight: 700, color: '#fff' }}>
                    {Math.round(tasteId.adventurenessScore * 100)}%
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Top genres */}
          <div style={{ display: 'flex', gap: 12, marginTop: 40, zIndex: 1 }}>
            {topGenres.map((genre, i) => (
              <div
                key={genre}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 20px',
                  border: '2px solid #333',
                  background: i === 0 ? 'rgba(255,255,255,0.05)' : 'transparent',
                }}
              >
                <span style={{ fontSize: 16, color: '#666' }}>#{i + 1}</span>
                <span style={{ fontSize: 20, fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>
                  {genre}
                </span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              zIndex: 1,
            }}
          >
            {/* WAXFEED branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              {/* Simplified disc icon */}
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #222 0%, #111 100%)',
                  border: '2px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                  }}
                />
              </div>
              <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: -0.5 }}>
                WAXFEED
              </div>
            </div>

            {/* CTA */}
            <div style={{ fontSize: 18, color: '#666' }}>
              wax-feed.com/u/{user.username}/tasteid
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
