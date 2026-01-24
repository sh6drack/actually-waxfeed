"use client"

import { useState, useEffect } from "react"
import Link from "next/link"

interface Album {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl: string | null
  coverArtUrlLarge?: string | null
  averageRating: number | null
  totalReviews: number
  billboardRank: number | null
}

interface BillboardListProps {
  albums: Album[]
}

export function BillboardList({ albums }: BillboardListProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Mobile: 18 albums (6 rows × 3 cols, under 20 for cleaner UX), Desktop: show all 50
  const initialCount = isMobile ? 18 : 50
  const displayedAlbums = isExpanded ? albums : albums.slice(0, initialCount)
  const hasMore = albums.length > initialCount

  // Mobile: Grid layout for better density
  if (isMobile) {
    return (
      <div>
        <div className="grid grid-cols-3 gap-2">
          {displayedAlbums.map((album) => (
            <Link
              key={album.id}
              href={`/album/${album.spotifyId}`}
              className="group relative block"
            >
              {/* Album cover with rank badge */}
              <div className="relative aspect-square bg-muted overflow-hidden">
                {album.coverArtUrl && (
                  <img
                    src={album.coverArtUrlLarge || album.coverArtUrl}
                    alt=""
                    className="w-full h-full object-cover group-active:scale-[0.98] transition-transform"
                  />
                )}

                {/* Rank badge - high contrast, top-left */}
                <div className="absolute top-0 left-0 bg-black/90 backdrop-blur-sm px-1.5 py-0.5 min-w-[24px]">
                  <span className="text-white text-[11px] font-bold tabular-nums">
                    {album.billboardRank}
                  </span>
                </div>

                {/* Rating badge - bottom-right if exists */}
                {album.averageRating !== null && (
                  <div className="absolute bottom-0 right-0 bg-white text-black px-1.5 py-0.5">
                    <span className="text-[10px] font-bold tabular-nums">
                      {album.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Album info below */}
              <div className="mt-1.5 px-0.5">
                <p className="text-[11px] font-semibold leading-tight truncate text-foreground">
                  {album.title}
                </p>
                <p className="text-[10px] text-muted-foreground truncate">
                  {album.artistName}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-5 py-3.5 flex items-center justify-center gap-2 text-sm font-medium bg-foreground text-background active:opacity-80 transition-colors min-h-[48px]"
          >
            <span>{isExpanded ? "Show Less" : `View All ${albums.length}`}</span>
            <svg
              className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    )
  }

  // Desktop: List layout (existing design, improved contrast)
  return (
    <div>
      <div className="space-y-1">
        {displayedAlbums.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.spotifyId}`}
            className="flex items-center gap-4 p-3 hover:bg-muted/50 transition-colors rounded-sm no-underline group"
          >
            {/* Rank - high contrast */}
            <span className="text-xl font-bold text-foreground w-8 flex-shrink-0 tabular-nums">
              {album.billboardRank}
            </span>

            {/* Cover */}
            <div className="w-14 h-14 flex-shrink-0 bg-muted overflow-hidden">
              {album.coverArtUrl && (
                <img
                  src={album.coverArtUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Album info */}
            <div className="flex-1 min-w-0">
              <p className="font-bold truncate group-hover:underline text-foreground">
                {album.title}
              </p>
              <p className="text-muted-foreground text-sm truncate">
                {album.artistName}
              </p>
            </div>

            {/* Rating & reviews */}
            <div className="text-right flex-shrink-0">
              {album.averageRating !== null && (
                <p className="font-bold text-base text-foreground">{album.averageRating.toFixed(1)}</p>
              )}
              <p className="text-muted-foreground text-xs">
                {album.totalReviews} {album.totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full mt-4 py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border hover:border-muted-foreground"
        >
          <span>{isExpanded ? "Show Less" : `Show All ${albums.length}`}</span>
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      )}
    </div>
  )
}
