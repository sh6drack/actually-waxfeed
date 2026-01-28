import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'
import { getArchetypeInfo } from '@/lib/tasteid'

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
        name: true,
        image: true,
        bio: true,
        isVerified: true,
        isPremium: true,
        waxScore: true,
        tasteId: {
          select: {
            primaryArchetype: true,
            topGenres: true,
            reviewCount: true,
            averageRating: true,
          },
        },
        _count: {
          select: {
            reviews: true,
            lists: true,
          },
        },
      },
    })

    if (!user) {
      return new Response('User not found', { status: 404 })
    }

    const archetype = user.tasteId
      ? getArchetypeInfo(user.tasteId.primaryArchetype)
      : null

    const response = new ImageResponse(
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
          {/* Header with user info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              marginBottom: '40px',
            }}
          >
            {/* Avatar */}
            {user.image ? (
              <img
                src={user.image}
                width={140}
                height={140}
                style={{
                  borderRadius: '8px',
                  objectFit: 'cover',
                  border: '4px solid #333',
                }}
              />
            ) : (
              <div
                style={{
                  width: 140,
                  height: 140,
                  borderRadius: '8px',
                  backgroundColor: '#222',
                  border: '4px solid #333',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '48px',
                  fontWeight: 'bold',
                  color: '#666',
                }}
              >
                {username.charAt(0).toUpperCase()}
              </div>
            )}

            {/* User details */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '42px', fontWeight: 'bold' }}>
                  @{user.username}
                </span>
                {user.isVerified && (
                  <span
                    style={{
                      fontSize: '14px',
                      padding: '4px 10px',
                      backgroundColor: '#3b82f6',
                      color: '#fff',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    VERIFIED
                  </span>
                )}
                {user.isPremium && (
                  <span
                    style={{
                      fontSize: '14px',
                      padding: '4px 10px',
                      backgroundColor: '#ffd700',
                      color: '#000',
                      fontWeight: 'bold',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    PREMIUM
                  </span>
                )}
              </div>
              {user.name && (
                <span style={{ fontSize: '24px', color: '#888', marginTop: '8px' }}>
                  {user.name}
                </span>
              )}
              {user.bio && (
                <span
                  style={{
                    fontSize: '20px',
                    color: '#666',
                    marginTop: '12px',
                    maxWidth: '600px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {user.bio.slice(0, 100)}
                  {user.bio.length > 100 ? '...' : ''}
                </span>
              )}
            </div>

            {/* WAXFEED branding */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-end',
              }}
            >
              <span
                style={{
                  fontSize: '24px',
                  fontWeight: 'bold',
                  letterSpacing: '0.1em',
                }}
              >
                WAXFEED
              </span>
            </div>
          </div>

          {/* Archetype badge if has TasteID */}
          {archetype && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                marginBottom: '32px',
                padding: '24px',
                border: '3px solid #fff',
                backgroundColor: '#111',
              }}
            >
              <span style={{ fontSize: '48px' }}>{archetype.icon}</span>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span
                  style={{
                    fontSize: '28px',
                    fontWeight: 'bold',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {archetype.name}
                </span>
                <span style={{ fontSize: '16px', color: '#888', marginTop: '4px' }}>
                  {archetype.description}
                </span>
              </div>
            </div>
          )}

          {/* Top Genres */}
          {user.tasteId?.topGenres && user.tasteId.topGenres.length > 0 && (
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
                {user.tasteId.topGenres.slice(0, 4).map((genre, i) => (
                  <span
                    key={i}
                    style={{
                      padding: '10px 18px',
                      border: '2px solid #444',
                      fontSize: '15px',
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
          )}

          {/* Stats footer */}
          <div
            style={{
              display: 'flex',
              gap: '48px',
              marginTop: 'auto',
              paddingTop: '24px',
              borderTop: '2px solid #333',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#ffd700' }}>
                {user._count.reviews}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                REVIEWS
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#00bfff' }}>
                {user._count.lists}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                LISTS
              </span>
            </div>
            {user.tasteId && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '36px', fontWeight: 'bold', color: '#00ff88' }}>
                    {user.tasteId.averageRating.toFixed(1)}
                  </span>
                  <span
                    style={{
                      fontSize: '12px',
                      color: '#666',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    AVG RATING
                  </span>
                </div>
              </>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '36px', fontWeight: 'bold' }}>
                {user.waxScore}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  color: '#666',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}
              >
                WAX SCORE
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

    // Add cache headers to prevent stale social previews
    response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400')

    return response
  } catch (error) {
    console.error('Error generating user OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
