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

  const mobileCount = 18
  const desktopCount = 50
  const displayedAlbums = isExpanded ? albums : albums.slice(0, desktopCount)
  const hasMore = albums.length > desktopCount

  return (
    <div>
      {/* Mobile Grid Layout - 3 columns */}
      <div className="md:hidden">
        <div className="grid grid-cols-3 gap-3">
          {displayedAlbums.slice(0, isExpanded ? albums.length : mobileCount).map((album) => (
            <Link
              key={album.id}
              href={`/album/${album.spotifyId}`}
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden bg-white/5">
                {album.coverArtUrl && (
                  <img
                    src={album.coverArtUrlLarge || album.coverArtUrl}
                    alt=""
                    className="w-full h-full object-cover group-active:scale-[0.98] transition-transform duration-150"
                  />
                )}

                {/* Rank badge - gold for top 10 */}
                <div
                  className={`absolute top-0 left-0 px-1.5 py-0.5 text-[10px] font-bold ${
                    (album.billboardRank || 0) <= 10
                      ? 'bg-[--dyad-connection] text-black'
                      : 'bg-black/80 text-white/80'
                  }`}
                >
                  #{album.billboardRank}
                </div>

                {/* Rating badge */}
                {album.averageRating !== null && (
                  <div className="absolute bottom-0 right-0 px-1.5 py-0.5 bg-black/80 backdrop-blur-sm">
                    <span className="text-[10px] font-mono text-[--dyad-primary]">
                      {album.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2">
                <p className="text-[11px] font-semibold leading-tight truncate group-hover:text-[--dyad-connection] transition-colors">
                  {album.title}
                </p>
                <p className="text-[10px] text-white/40 truncate mt-0.5">
                  {album.artistName}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {albums.length > mobileCount && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-6 py-4 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.1em] uppercase active:opacity-70 transition-all min-h-[52px] bg-[--dyad-connection] text-black"
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

      {/* Desktop Grid Layout - 5 columns */}
      <div className="hidden md:block">
        <div className="grid grid-cols-5 gap-4">
          {displayedAlbums.slice(0, desktopCount).map((album) => (
            <Link
              key={album.id}
              href={`/album/${album.spotifyId}`}
              className="group block"
            >
              <div className="relative aspect-square overflow-hidden bg-white/5">
                {album.coverArtUrl && (
                  <img
                    src={album.coverArtUrlLarge || album.coverArtUrl}
                    alt=""
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                )}

                {/* Rank badge - gold styling for top 10 */}
                <div
                  className={`absolute top-0 left-0 px-2 py-1 text-xs font-bold ${
                    (album.billboardRank || 0) <= 10
                      ? 'bg-[--dyad-connection] text-black'
                      : (album.billboardRank || 0) <= 50
                        ? 'bg-white/90 text-black'
                        : 'bg-black/80 text-white/80'
                  }`}
                >
                  #{album.billboardRank}
                </div>

                {/* Rating badge */}
                {album.averageRating !== null && (
                  <div className="absolute bottom-0 right-0 px-2 py-1 bg-black/80 backdrop-blur-sm">
                    <span className="text-xs font-mono text-[--dyad-primary]">
                      {album.averageRating.toFixed(1)}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-2">
                <p className="text-sm font-semibold leading-tight truncate group-hover:text-[--dyad-connection] transition-colors">
                  {album.title}
                </p>
                <p className="text-xs text-white/40 truncate mt-0.5">
                  {album.artistName}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {hasMore && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full mt-6 py-3 flex items-center justify-center gap-2 text-xs font-bold tracking-[0.1em] uppercase transition-all border border-white/10 hover:border-[--dyad-connection] hover:text-[--dyad-connection] text-white/50"
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
