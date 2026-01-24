import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export const runtime = 'edge'

const BADGE_COLORS = {
  GOLD: { primary: '#ffd700', secondary: '#b8860b', glow: 'rgba(255, 215, 0, 0.3)' },
  SILVER: { primary: '#c0c0c0', secondary: '#808080', glow: 'rgba(192, 192, 192, 0.3)' },
  BRONZE: { primary: '#cd7f32', secondary: '#8b4513', glow: 'rgba(205, 127, 50, 0.3)' },
}

const BADGE_TITLES = {
  GOLD: 'Gold Spin',
  SILVER: 'Silver Spin',
  BRONZE: 'Bronze Spin',
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ badgeId: string }> }
) {
  const { badgeId } = await params

  try {
    const badge = await prisma.firstSpinBadge.findUnique({
      where: { id: badgeId },
      include: {
        user: {
          select: {
            username: true,
            image: true,
          }
        },
        album: {
          select: {
            title: true,
            artistName: true,
            coverArtUrl: true,
            coverArtUrlLarge: true,
          }
        }
      }
    })

    if (!badge) {
      return new Response('Badge not found', { status: 404 })
    }

    const colors = BADGE_COLORS[badge.badgeType]
    const title = BADGE_TITLES[badge.badgeType]
    const coverUrl = badge.album.coverArtUrlLarge || badge.album.coverArtUrl

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
          {/* Glow effect */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `radial-gradient(circle at 30% 50%, ${colors.glow} 0%, transparent 50%)`,
            }}
          />

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              gap: 48,
            }}
          >
            {/* Album cover */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 340,
                  height: 340,
                  backgroundColor: '#1a1a1a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  border: `3px solid ${colors.primary}`,
                  boxShadow: `0 0 40px ${colors.glow}`,
                }}
              >
                {coverUrl && (
                  <img
                    src={coverUrl}
                    alt=""
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}
                {/* Position badge overlay */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: -20,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.primary,
                    color: '#000',
                    padding: '8px 24px',
                    fontSize: 28,
                    fontWeight: 'bold',
                  }}
                >
                  #{badge.position}
                </div>
              </div>
            </div>

            {/* Info */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                justifyContent: 'center',
                gap: 12,
              }}
            >
              {/* Badge type */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    textTransform: 'uppercase',
                    letterSpacing: '0.2em',
                    color: colors.primary,
                    fontWeight: 'bold',
                  }}
                >
                  {title}
                </span>
                <span
                  style={{
                    fontSize: 40,
                  }}
                >
                  {badge.badgeType === 'GOLD' ? '🥇' : badge.badgeType === 'SILVER' ? '🥈' : '🥉'}
                </span>
              </div>

              {/* Album title */}
              <div
                style={{
                  fontSize: 42,
                  fontWeight: 'bold',
                  color: '#fff',
                  lineHeight: 1.1,
                  display: 'flex',
                  flexWrap: 'wrap',
                }}
              >
                {badge.album.title.length > 35 
                  ? badge.album.title.slice(0, 35) + '...'
                  : badge.album.title}
              </div>

              {/* Artist */}
              <div
                style={{
                  fontSize: 28,
                  color: '#888',
                }}
              >
                {badge.album.artistName}
              </div>

              {/* Claim */}
              <div
                style={{
                  marginTop: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 16,
                    color: '#666',
                    textTransform: 'uppercase',
                    letterSpacing: '0.15em',
                  }}
                >
                  Believed First
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  {badge.user.image && (
                    <img
                      src={badge.user.image}
                      alt=""
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: '2px solid #333',
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 24,
                      color: '#fff',
                      fontWeight: 'bold',
                    }}
                  >
                    @{badge.user.username}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 24,
              paddingTop: 24,
              borderTop: '1px solid #333',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  color: '#fff',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                }}
              >
                WAXFEED
              </span>
            </div>
            <span
              style={{
                fontSize: 14,
                color: '#666',
              }}
            >
              wax-feed.com
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    )
  } catch (error) {
    console.error('OG Badge error:', error)
    return new Response('Error generating badge image', { status: 500 })
  }
}
