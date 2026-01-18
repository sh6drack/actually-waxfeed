import { ImageResponse } from 'next/og'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params

  try {
    const review = await prisma.review.findUnique({
      where: { id },
      include: {
        user: { select: { username: true, image: true } },
        album: { select: { title: true, artistName: true, coverArtUrl: true } }
      }
    })

    if (!review) {
      return new Response('Review not found', { status: 404 })
    }

    // Truncate review text for the image
    const reviewText = review.text
      ? review.text.slice(0, 180) + (review.text.length > 180 ? '...' : '')
      : null

    // Rating color based on score
    const getRatingColor = (rating: number) => {
      if (rating >= 8) return '#22c55e' // green
      if (rating >= 6) return '#eab308' // yellow
      if (rating >= 4) return '#f97316' // orange
      return '#ef4444' // red
    }

    const ratingColor = getRatingColor(review.rating)

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#000',
            padding: 60,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          {/* Top section with album info */}
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 40 }}>
            {/* Album cover */}
            {review.album.coverArtUrl && (
              <img
                src={review.album.coverArtUrl}
                width={280}
                height={280}
                style={{
                  objectFit: 'cover',
                  borderRadius: 8,
                  boxShadow: '0 20px 60px rgba(255,255,255,0.1)',
                }}
              />
            )}

            {/* Album + Review info */}
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, gap: 16 }}>
              {/* Album title */}
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  color: '#fff',
                  lineHeight: 1.1,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {review.album.title}
              </div>

              {/* Artist */}
              <div style={{ fontSize: 28, color: '#888' }}>
                {review.album.artistName}
              </div>

              {/* Rating */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    fontSize: 72,
                    fontWeight: 'bold',
                    color: ratingColor,
                    lineHeight: 1,
                  }}
                >
                  {review.rating.toFixed(1)}
                </div>
                <div style={{ fontSize: 24, color: '#666' }}>/10</div>
              </div>

              {/* User info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <div
                  style={{
                    fontSize: 24,
                    color: '#fff',
                    fontWeight: 600,
                  }}
                >
                  @{review.user.username}
                </div>
              </div>
            </div>
          </div>

          {/* Review text */}
          {reviewText && (
            <div
              style={{
                marginTop: 40,
                fontSize: 26,
                color: '#ccc',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              "{reviewText}"
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* WAXFEED branding */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #333 0%, #111 100%)',
                  border: '2px solid #444',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
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
              <div style={{ fontSize: 32, fontWeight: 'bold', color: '#fff', letterSpacing: -1 }}>
                WAXFEED
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'flex', gap: 24, color: '#666', fontSize: 20 }}>
              <span>♥ {review.likeCount}</span>
              <span>💿 {review.waxCount}</span>
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
    console.error('Error generating OG image:', error)
    return new Response('Failed to generate image', { status: 500 })
  }
}
