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
    <article className="border border-[#222] p-4 hover:border-[#444] transition-colors">
      <div className="flex gap-4">
        {/* Album Cover */}
        {showAlbum && (
          <Link href={`/album/${album.spotifyId}`} className="flex-shrink-0">
            <div className="w-20 h-20 bg-[#222] border border-[#333]">
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
          <div className="flex items-start justify-between gap-4 mb-2">
            <div>
              <div className="flex items-center gap-2">
                <Link
                  href={`/u/${user.username || user.id}`}
                  className="font-bold hover:underline no-underline"
                >
                  {user.username || "Anonymous"}
                </Link>
                {user.isVerified && (
                  <span className="text-[#888] text-xs">✓</span>
                )}
                <span className="text-[#666] text-xs">
                  {formatDistanceToNow(date, { addSuffix: true })}
                  {isEdited && " (edited)"}
                </span>
              </div>
              {showAlbum && (
                <Link
                  href={`/album/${album.spotifyId}`}
                  className="text-sm text-[#888] hover:underline no-underline"
                >
                  {album.title} — {album.artistName}
                </Link>
              )}
            </div>

            {/* Rating */}
            <div className="flex-shrink-0 bg-white text-black px-3 py-1 font-bold text-lg">
              {rating.toFixed(1)}
            </div>
          </div>

          {/* Review Text */}
          {text && (
            <p className={`text-sm mb-3 ${compact ? "line-clamp-2" : ""}`}>
              {text}
            </p>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 text-xs text-[#888]">
            <button className="hover:text-white transition-colors">
              ♡ {likeCount}
            </button>
            <Link
              href={`/review/${id}`}
              className="hover:text-white transition-colors no-underline"
            >
              💬 {replyCount || 0} replies
            </Link>
            <Link
              href={`/review/${id}`}
              className="hover:text-white transition-colors no-underline"
            >
              View →
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
