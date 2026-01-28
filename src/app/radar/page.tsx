"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"

type RadarAlbum = {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  totalReviews: number
  averageRating: number | null
  reviewsToTrend: number
  progress: number
  userReviewed: boolean
  userPosition: number | null
  nextPosition: number
  potentialBadge: 'GOLD' | 'SILVER' | 'BRONZE' | null
  urgency: 'critical' | 'high' | 'medium' | 'low'
}

type TrendedAlbum = {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  totalReviews: number
  trendedAt: string
}

export default function RadarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [radar, setRadar] = useState<RadarAlbum[]>([])
  const [recentlyTrended, setRecentlyTrended] = useState<TrendedAlbum[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?redirect=/radar")
      return
    }
  }, [status, router])

  useEffect(() => {
    const fetchRadar = async () => {
      if (!session) return

      try {
        const res = await fetch("/api/trending-radar")
        const data = await res.json()

        if (data.success) {
          setRadar(data.data.radar)
          setRecentlyTrended(data.data.recentlyTrended)
        } else {
          setError(data.error)
        }
      } catch (err) {
        setError("Failed to load radar")
      } finally {
        setLoading(false)
      }
    }

    fetchRadar()
  }, [session])

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12">
          <p className="text-[--muted]">Loading radar...</p>
        </div>
      </div>
    )
  }

  // Paywall for non subscribers
  if (error === 'Trending Radar requires Wax+ or Pro subscription') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <section className="border-b border-[--border]">
          <div className="max-w-4xl mx-auto px-6 py-16 text-center">
            <div className="w-16 h-16 border-2 border-[var(--accent-primary)] flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold mb-4">
              Trending Radar
            </h1>
            <p className="text-lg text-[--muted] mb-8 max-w-xl mx-auto">
              See albums approaching 100 reviews. Review them now 
              and you still qualify for badges when they trend.
            </p>
            
            <div className="border border-[--border] p-6 max-w-md mx-auto mb-8">
              <p className="text-sm text-[--muted] mb-4">
                Right now albums are sitting at 70, 80, 90 reviews. One push away from trending.
                Subscribers see exactly which ones.
              </p>
              <div className="flex items-center justify-center gap-4 text-sm">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[var(--accent-primary)]">3x</p>
                  <p className="text-xs text-[--muted]">More badges</p>
                </div>
                <div className="h-8 w-px bg-[--border]" />
                <div className="text-center">
                  <p className="text-2xl font-bold">$5</p>
                  <p className="text-xs text-[--muted]">/month</p>
                </div>
              </div>
            </div>

            <Link
              href="/pricing"
              className="inline-block px-8 py-4 bg-white text-black text-[11px] tracking-[0.15em] uppercase font-bold hover:bg-[#e5e5e5] transition"
            >
              Unlock Radar
            </Link>
          </div>
        </section>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12">
          <p className="text-[--muted]">{error}</p>
        </div>
      </div>
    )
  }

  const criticalAlbums = radar.filter(a => a.urgency === 'critical')
  const highAlbums = radar.filter(a => a.urgency === 'high')
  const otherAlbums = radar.filter(a => a.urgency === 'medium' || a.urgency === 'low')

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      {/* Header */}
      <section style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="w-full px-6 lg:px-12 xl:px-20 py-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 border border-[var(--accent-primary)] flex items-center justify-center">
              <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">
                Subscriber Feature
              </p>
              <h1 className="text-2xl font-bold">Trending Radar</h1>
            </div>
          </div>
          <p className="text-[--muted] max-w-xl">
            Albums approaching 100 reviews. Review now to qualify for badges when they trend.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row">
        {/* Main Radar */}
        <section className="flex-1 lg:border-r border-[--border]">
          {/* Critical */}
          {criticalAlbums.length > 0 && (
            <div className="px-6 py-8 border-b border-[--border]">
              <div className="flex items-center gap-2 mb-6">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <p className="text-[10px] tracking-[0.3em] uppercase text-red-500 font-bold">
                  About to Trend
                </p>
              </div>
              <div className="space-y-4">
                {criticalAlbums.map(album => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </div>
          )}

          {/* High Priority */}
          {highAlbums.length > 0 && (
            <div className="px-6 py-8 border-b border-[--border]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[var(--accent-primary)] mb-6">
                Hot
              </p>
              <div className="space-y-4">
                {highAlbums.map(album => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </div>
          )}

          {/* Rising */}
          {otherAlbums.length > 0 && (
            <div className="px-6 py-8 border-b border-[--border]">
              <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
                Rising
              </p>
              <div className="space-y-4">
                {otherAlbums.map(album => (
                  <AlbumCard key={album.id} album={album} />
                ))}
              </div>
            </div>
          )}

          {radar.length === 0 && (
            <div className="px-6 py-16 text-center">
              <p className="text-[--muted] mb-2">No albums on the radar right now.</p>
              <p className="text-sm text-[--muted]">
                Check back later or explore new releases.
              </p>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="lg:w-80 border-t lg:border-t-0 border-[--border]">
          {/* Recently Trended */}
          <div className="px-6 py-8 border-b border-[--border]">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-6">
              Recently Trended
            </p>
            {recentlyTrended.length === 0 ? (
              <p className="text-sm text-[--muted]">No albums have trended yet.</p>
            ) : (
              <div className="space-y-4">
                {recentlyTrended.map(album => (
                  <Link
                    key={album.id}
                    href={`/album/${album.spotifyId}`}
                    className="flex gap-3 group"
                  >
                    <div className="w-10 h-10 flex-shrink-0 bg-[#181818]">
                      {album.coverArtUrl ? (
                        <img src={album.coverArtUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[--muted]">?</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-[--muted] transition">
                        {album.title}
                      </p>
                      <p className="text-xs text-[--muted]">
                        Trended {formatDistanceToNow(new Date(album.trendedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* How It Works */}
          <div className="px-6 py-8">
            <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">
              How It Works
            </p>
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium mb-1">Albums appear at 50+ reviews</p>
                <p className="text-xs text-[--muted]">
                  Building momentum toward trending.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Review before 100</p>
                <p className="text-xs text-[--muted]">
                  Your position is locked. When it trends you earn your badge.
                </p>
              </div>
              <div>
                <p className="font-medium mb-1">Watch the progress</p>
                <p className="text-xs text-[--muted]">
                  Albums at 90+ could trend any moment.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}

function AlbumCard({ album }: { album: RadarAlbum }) {
  const badgeColor = album.potentialBadge === 'GOLD' ? 'text-[var(--accent-primary)] border-[var(--accent-primary)]'
    : album.potentialBadge === 'SILVER' ? 'text-gray-400 border-gray-400'
    : 'text-amber-700 border-amber-700'

  return (
    <Link
      href={`/album/${album.spotifyId}`}
      className="flex gap-4 p-4 border border-[--border] hover:border-white/30 transition group"
    >
      {/* Cover */}
      <div className="w-16 h-16 flex-shrink-0 bg-[#181818]">
        {album.coverArtUrl ? (
          <img src={album.coverArtUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[--muted]">?</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="font-medium truncate group-hover:text-[--muted] transition">
              {album.title}
            </p>
            <p className="text-xs text-[--muted] truncate">{album.artistName}</p>
          </div>
          
          {/* Potential Badge */}
          {!album.userReviewed && album.potentialBadge && (
            <div className={`px-2 py-0.5 text-[10px] font-bold border ${badgeColor} flex-shrink-0`}>
              {album.potentialBadge}
            </div>
          )}
          
          {/* Already Reviewed */}
          {album.userReviewed && (
            <div className="px-2 py-0.5 text-[10px] font-bold border border-green-500 text-green-500 flex-shrink-0">
              #{album.userPosition}
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-2">
          <div className="h-1.5 bg-[--border] w-full">
            <div 
              className={`h-full transition-all ${
                album.urgency === 'critical' ? 'bg-red-500' :
                album.urgency === 'high' ? 'bg-[var(--accent-primary)]' :
                'bg-white/50'
              }`}
              style={{ width: `${album.progress}%` }}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[--muted]">
            <span className="font-bold text-white tabular-nums">{album.totalReviews}</span>
            /100 reviews
          </span>
          {!album.userReviewed && (
            <span className={album.urgency === 'critical' ? 'text-red-500' : 'text-[--muted]'}>
              {album.reviewsToTrend} to trend
            </span>
          )}
          {album.averageRating && (
            <span className="text-[--muted]">
              {album.averageRating.toFixed(1)} avg
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}
