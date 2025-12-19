"use client"

import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface ReviewCardProps {
  id: string
  rating: number
  text?: string | null
  createdAt: string | Date
  isEdited?: boolean
  likeCount: number
  replyCount?: number
  user: {
    id: string
    username?: string | null
    image?: string | null
    isVerified?: boolean
  }
  album: {
    id: string
    spotifyId: string
    title: string
    artistName: string
    coverArtUrl?: string | null
  }
  showAlbum?: boolean
  compact?: boolean
}

export function ReviewCard({
  id,
  rating,
  text,
  createdAt,
  isEdited,
  likeCount,
  replyCount,
  user,
  album,
  showAlbum = true,
  compact = false
}: ReviewCardProps) {
  const date = new Date(createdAt)

  return (
    <article className="border border-[#222] p-3 sm:p-4 hover:border-[#333] transition-colors">
      <div className="flex gap-3 sm:gap-4">
        {/* Album Cover */}
        {showAlbum && (
          <Link href={`/album/${album.spotifyId}`} className="flex-shrink-0">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-[#181818]">
              {album.coverArtUrl ? (
                <img
                  src={album.coverArtUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#666] text-xs">
                  No Cover
                </div>
              )}
            </div>
          </Link>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <Link
                  href={`/u/${user.username || user.id}`}
                  className="font-bold hover:underline no-underline text-sm sm:text-base"
                >
                  {user.username || "Anonymous"}
                </Link>
                {user.isVerified && (
                  <span className="text-[#888] text-xs">✓</span>
                )}
                <span className="text-[#555] text-xs">
                  {formatDistanceToNow(date, { addSuffix: true })}
                  {isEdited && " (edited)"}
                </span>
              </div>
              {showAlbum && (
                <Link
                  href={`/album/${album.spotifyId}`}
                  className="text-xs sm:text-sm text-[#888] hover:underline no-underline line-clamp-1"
                >
                  {album.title} — {album.artistName}
                </Link>
              )}
            </div>

            {/* Rating */}
            <div className="flex-shrink-0 bg-white text-black px-2 sm:px-3 py-0.5 sm:py-1 font-bold text-base sm:text-lg">
              {rating.toFixed(1)}
            </div>
          </div>

          {/* Review Text */}
          {text && (
            <p className={`text-sm mb-2 sm:mb-3 text-[#ccc] leading-relaxed ${compact ? "line-clamp-2" : "line-clamp-4 sm:line-clamp-none"}`}>
              {text}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3 sm:gap-4 text-xs text-[#666]">
            <button className="hover:text-white transition-colors flex items-center gap-1">
              <span>♡</span>
              <span>{likeCount}</span>
            </button>
            <Link
              href={`/review/${id}`}
              className="hover:text-white transition-colors no-underline flex items-center gap-1"
            >
              <span>💬</span>
              <span>{replyCount || 0}</span>
            </Link>
            <Link
              href={`/review/${id}`}
              className="hover:text-white transition-colors no-underline ml-auto"
            >
              View →
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
