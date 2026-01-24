"use client"

import Link from "next/link"
import { memo } from "react"

interface AlbumCardProps {
  id: string
  spotifyId: string
  title: string
  artistName: string
  coverArtUrl?: string | null
  averageRating?: number | null
  totalReviews?: number
  size?: "sm" | "md" | "lg"
}

export const AlbumCard = memo(function AlbumCard({
  id,
  spotifyId,
  title,
  artistName,
  coverArtUrl,
  averageRating,
  totalReviews,
  size = "md"
}: AlbumCardProps) {
  const sizeClasses = {
    sm: "w-full",
    md: "w-40",
    lg: "w-56"
  }

  return (
    <Link href={`/album/${spotifyId}`} className="group block">
      <div className={`${sizeClasses[size]}`}>
        <div className="aspect-square bg-[--surface] relative overflow-hidden group-hover:opacity-80 transition-opacity">
          {coverArtUrl ? (
            <img
              src={coverArtUrl}
              alt={`${title} by ${artistName}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[--muted-faint]">
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" fill="none"/>
                <circle cx="12" cy="12" r="3" fill="currentColor"/>
              </svg>
            </div>
          )}
        </div>
        <div className="mt-1.5">
          <p className="text-xs font-medium truncate leading-tight">{title}</p>
          <p className="text-[--muted-dim] text-xs truncate leading-tight">{artistName}</p>
        </div>
      </div>
    </Link>
  )
})
