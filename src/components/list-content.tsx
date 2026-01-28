"use client"

import { useState } from "react"
import Link from "next/link"
import { AlbumCard } from "@/components/album-card"
import { ViewToggle } from "@/components/view-toggle"

interface ListItem {
  id: string
  notes: string | null
  album: {
    id: string
    spotifyId: string
    title: string
    artistName: string
    coverArtUrl: string | null
    coverArtUrlMedium?: string | null
    releaseDate?: Date | string | null
    averageRating: number | null
    totalReviews: number
  }
}

interface ListContentProps {
  items: ListItem[]
  isRanked: boolean
}

export function ListContent({ items, isRanked }: ListContentProps) {
  const [view, setView] = useState<"list" | "grid">("list")

  if (items.length === 0) {
    return (
      <div className="border border-[--border] p-8 text-center">
        <p className="text-[--muted]">This list is empty.</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <ViewToggle view={view} onChange={setView} />
      </div>

      {view === "list" ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={item.id}
              className="flex items-center gap-4 border border-[--border] p-4 hover:border-[--foreground]/30 transition-colors"
            >
              {isRanked && (
                <div className="w-8 text-2xl font-bold text-[--muted]/70">
                  {index + 1}
                </div>
              )}

              <Link href={`/album/${item.album.spotifyId}`} className="shrink-0">
                <div className="w-16 h-16 bg-[--surface]">
                  {item.album.coverArtUrlMedium || item.album.coverArtUrl ? (
                    <img
                      src={item.album.coverArtUrlMedium || item.album.coverArtUrl || ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
              </Link>

              <div className="flex-1 min-w-0">
                <Link
                  href={`/album/${item.album.spotifyId}`}
                  className="font-bold hover:text-[--muted] block truncate transition-colors"
                >
                  {item.album.title}
                </Link>
                <p className="text-[--muted] text-sm truncate">
                  {item.album.artistName}
                  {item.album.releaseDate && ` · ${new Date(item.album.releaseDate).getFullYear()}`}
                </p>
              </div>

              {item.album.averageRating !== null && (
                <div className="text-right">
                  <div className="text-xl font-bold">
                    {item.album.averageRating.toFixed(1)}
                  </div>
                  <div className="text-xs text-[--muted]">
                    {item.album.totalReviews} reviews
                  </div>
                </div>
              )}

              {item.notes && (
                <div className="text-sm text-[--muted] italic max-w-xs truncate">
                  {item.notes}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((item) => (
            <AlbumCard
              key={item.id}
              id={item.album.id}
              spotifyId={item.album.spotifyId}
              title={item.album.title}
              artistName={item.album.artistName}
              coverArtUrl={item.album.coverArtUrl}
              releaseDate={item.album.releaseDate}
              averageRating={item.album.averageRating}
              totalReviews={item.album.totalReviews}
            />
          ))}
        </div>
      )}
    </div>
  )
}
