"use client"

import { useState } from "react"
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

  // Mobile: 18 albums, Desktop: 50 albums
  const mobileCount = 18
  const desktopCount = 50
  const displayedAlbums = isExpanded ? albums : albums.slice(0, desktopCount)
  const hasMore = albums.length > desktopCount

  return (
    <div>
      {/* Mobile Grid Layout - 3 columns, hidden on md+ */}
      <div className="md:hidden">
        <div className="album-grid grid grid-cols-3 gap-3">
          {displayedAlbums.slice(0, isExpanded ? albums.length : mobileCount).map((album) => (
            <Link
              key={album.id}
              href={`/album/${album.spotifyId}`}
              className="group block"
            >
              {/* Album artwork with subtle border */}
              <div
                className="album-cover relative aspect-square overflow-hidden"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)'
                }}
              >
                {album.coverArtUrl && (
                  <img
                    src={album.coverArtUrlLarge || album.coverArtUrl}
                    alt=""
                    className="w-full h-full object-cover group-active:scale-[0.98] transition-transform duration-150"
                  />
                )}

                {/* Rating badge - bottom right, always visible */}
                {album.averageRating !== null && (
                  <div
                    className="absolute bottom-0 right-0 px-1.5 py-0.5"
                    style={{
                      background: 'var(--foreground)',
                      color: 'var(--background)'
                    }}
                  >
                    <span className="text-[10px] font-bold tabular-nums tracking-tight">
                      {album.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info section with prominent rank */}
              <div className="mt-2">
                {/* Rank - large, bold, editorial style */}
                <div
                  className="text-[10px] font-bold tracking-[0.15em] uppercase mb-0.5"
                  style={{ color: 'var(--muted)' }}
                >
                  #{album.billboardRank}
                </div>

                {/* Title */}
                <p
                  className="text-[11px] font-semibold leading-tight truncate"
                  style={{ color: 'var(--foreground)' }}
                >
                  {album.title}
                </p>

                {/* Artist */}
                <p
                  className="text-[10px] truncate mt-0.5"
                  style={{ color: 'var(--muted)' }}
                >
                  {album.artistName}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {albums.length > mobileCount && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.1em] uppercase active:opacity-70 transition-opacity min-h-[52px]"
            style={{
              background: 'var(--foreground)',
              color: 'var(--background)'
            }}
          >
            <span>{isExpanded ? "Show Less" : `View All ${albums.length}`}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {/* Desktop Grid Layout - 5 columns, hidden on mobile */}
      <div className="hidden md:block">
        <div className="album-grid grid grid-cols-5 gap-4">
          {displayedAlbums.slice(0, desktopCount).map((album) => (
            <Link
              key={album.id}
              href={`/album/${album.spotifyId}`}
              className="group block"
            >
              {/* Album artwork */}
              <div
                className="album-cover relative aspect-square overflow-hidden"
                style={{
                  border: '1px solid var(--border)',
                  background: 'var(--surface)'
                }}
              >
                {album.coverArtUrl && (
                  <img
                    src={album.coverArtUrlLarge || album.coverArtUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                )}

                {/* Rank badge - top left */}
                <div
                  className="absolute top-0 left-0 px-2 py-1"
                  style={{
                    background: 'var(--foreground)',
                    color: 'var(--background)'
                  }}
                >
                  <span className="text-xs font-bold tabular-nums">
                    #{album.billboardRank}
                  </span>
                </div>

                {/* Rating badge - bottom right */}
                {album.averageRating !== null && (
                  <div
                    className="absolute bottom-0 right-0 px-2 py-1"
                    style={{
                      background: 'var(--foreground)',
                      color: 'var(--background)'
                    }}
                  >
                    <span className="text-xs font-bold tabular-nums">
                      {album.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              {/* Info section */}
              <div className="mt-2">
                <p
                  className="text-sm font-semibold leading-tight truncate group-hover:underline"
                  style={{ color: 'var(--foreground)' }}
                >
                  {album.title}
                </p>
                <p
                  className="text-xs truncate mt-0.5"
                  style={{ color: 'var(--muted)' }}
                >
                  {album.artistName}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.1em] uppercase transition-colors hover:border-[--foreground] hover:text-[--foreground]"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--muted)',
              background: 'transparent'
            }}
          >
            <span>{isExpanded ? "Show Less" : `Show All ${albums.length}`}</span>
            <svg
              className={`w-3.5 h-3.5 transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="square" strokeLinejoin="miter" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
