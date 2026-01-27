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

interface TrendingGridProps {
  albums: Album[]
  totalPages?: number
  itemsPerPage?: number
}

export function TrendingGrid({
  albums,
  totalPages = 50,
  itemsPerPage = 20
}: TrendingGridProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const actualTotalPages = Math.min(totalPages, Math.ceil(albums.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const displayedAlbums = albums.slice(startIndex, endIndex)

  const goToPage = (page: number) => {
    if (page >= 1 && page <= actualTotalPages) {
      setCurrentPage(page)
    }
  }

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 5

    if (actualTotalPages <= maxVisible + 2) {
      for (let i = 1; i <= actualTotalPages; i++) pages.push(i)
    } else {
      pages.push(1)

      if (currentPage > 3) pages.push('...')

      const start = Math.max(2, currentPage - 1)
      const end = Math.min(actualTotalPages - 1, currentPage + 1)

      for (let i = start; i <= end; i++) pages.push(i)

      if (currentPage < actualTotalPages - 2) pages.push('...')

      pages.push(actualTotalPages)
    }

    return pages
  }

  return (
    <div>
      <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 gap-2 sm:gap-3">
        {displayedAlbums.map((album) => (
          <Link
            key={album.id}
            href={`/album/${album.spotifyId}`}
            className="group"
          >
            <div className="aspect-square w-full bg-[var(--surface)] overflow-hidden relative">
              {album.coverArtUrl && (
                <img
                  src={album.coverArtUrlLarge || album.coverArtUrl}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              )}
              {album.billboardRank && album.billboardRank <= 20 && (
                <div className="absolute top-1 left-1 bg-[#ffd700] text-black px-1 py-0.5 text-[9px] font-bold">
                  #{album.billboardRank}
                </div>
              )}
            </div>
            <p className="text-[10px] font-medium truncate mt-1.5 group-hover:text-[var(--muted)] transition-colors">
              {album.title}
            </p>
            <p className="text-[9px] text-[var(--muted-dim)] truncate">
              {album.artistName}
            </p>
          </Link>
        ))}
      </div>

      {/* Pagination Controls */}
      {actualTotalPages > 1 && (
        <div className="flex items-center justify-center gap-1 mt-6">
          {/* Previous Button */}
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="p-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--surface)] transition-colors"
            aria-label="Previous page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={`ellipsis-${idx}`} className="px-2 text-[var(--muted)]">...</span>
              ) : (
                <button
                  key={page}
                  onClick={() => goToPage(page as number)}
                  className={`min-w-[32px] h-8 text-xs font-medium transition-colors ${
                    currentPage === page
                      ? 'bg-[#ffd700] text-black'
                      : 'hover:bg-[var(--surface)] text-[var(--muted)]'
                  }`}
                >
                  {page}
                </button>
              )
            ))}
          </div>

          {/* Next Button */}
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === actualTotalPages}
            className="p-2 text-xs disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[var(--surface)] transition-colors"
            aria-label="Next page"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* Page Info */}
      <p className="text-center text-[10px] text-[var(--muted-dim)] mt-2">
        Page {currentPage} of {actualTotalPages}
      </p>
    </div>
  )
}
