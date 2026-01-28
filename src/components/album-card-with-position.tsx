"use client"

import Link from "next/link"

type AlbumCardProps = {
  album: {
    id: string
    spotifyId: string
    title: string
    artistName: string
    coverArtUrl?: string | null
    coverArtUrlLarge?: string | null
    totalReviews: number
    averageRating?: number | null
    billboardRank?: number | null
  }
  showPosition?: boolean
  size?: "sm" | "md" | "lg"
}

function getPositionBadge(totalReviews: number): { text: string; color: string; urgent: boolean } | null {
  const nextPosition = totalReviews + 1
  
  if (nextPosition <= 10) {
    return { 
      text: `Be #${nextPosition} • Gold eligible`, 
      color: "text-[var(--accent-primary)] border-[var(--accent-primary)]/50",
      urgent: true 
    }
  }
  if (nextPosition <= 50) {
    return { 
      text: `Be #${nextPosition} • Silver eligible`, 
      color: "text-gray-300 border-gray-400/50",
      urgent: nextPosition >= 45
    }
  }
  if (nextPosition <= 100) {
    return { 
      text: `Be #${nextPosition} • Bronze eligible`, 
      color: "text-amber-600 border-amber-700/50",
      urgent: nextPosition >= 90
    }
  }
  return null
}

export function AlbumCardWithPosition({ album, showPosition = true, size = "md" }: AlbumCardProps) {
  const positionBadge = showPosition ? getPositionBadge(album.totalReviews) : null
  const coverUrl = album.coverArtUrlLarge || album.coverArtUrl
  
  const sizeClasses = {
    sm: "w-full",
    md: "w-full",
    lg: "w-full",
  }

  return (
    <Link
      href={`/album/${album.spotifyId}`}
      className={`group block ${sizeClasses[size]}`}
    >
      {/* Album art */}
      <div className="aspect-square w-full bg-[--border] overflow-hidden mb-2 relative">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={album.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[--muted]">
            <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
            </svg>
          </div>
        )}
        
        {/* Billboard rank badge */}
        {album.billboardRank && (
          <div className="absolute top-2 left-2 bg-black/80 px-2 py-1 text-[10px] font-bold tracking-wider">
            #{album.billboardRank}
          </div>
        )}

        {/* Position opportunity badge - the subtle offer */}
        {positionBadge && (
          <div className={`absolute bottom-0 left-0 right-0 bg-black/90 px-2 py-1.5 ${positionBadge.urgent ? 'animate-pulse' : ''}`}>
            <p className={`text-[9px] font-bold tracking-wider ${positionBadge.color.split(' ')[0]}`}>
              {positionBadge.text}
            </p>
          </div>
        )}
      </div>

      {/* Info */}
      <p className="text-[11px] sm:text-[12px] font-medium truncate group-hover:text-[--muted] transition-colors">
        {album.title}
      </p>
      <p className="text-[10px] sm:text-[11px] text-[--muted] truncate">
        {album.artistName}
      </p>
      
      {/* Review count indicator */}
      {album.totalReviews > 0 && (
        <p className="text-[9px] text-[--muted] mt-1">
          {album.totalReviews} review{album.totalReviews !== 1 ? 's' : ''}
          {album.averageRating && ` • ${album.averageRating.toFixed(1)}`}
        </p>
      )}
    </Link>
  )
}

// Compact version for lists
export function AlbumRowWithPosition({ album, showPosition = true }: AlbumCardProps) {
  const positionBadge = showPosition ? getPositionBadge(album.totalReviews) : null
  
  return (
    <Link
      href={`/album/${album.spotifyId}`}
      className="flex items-center gap-3 py-3 px-3 -mx-3 hover:bg-[--border]/10 transition group"
    >
      {/* Cover */}
      <div className="w-12 h-12 flex-shrink-0 bg-[--border] overflow-hidden">
        {album.coverArtUrl ? (
          <img src={album.coverArtUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[--muted] text-xs">?</div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate group-hover:text-[--muted] transition">
          {album.title}
        </p>
        <p className="text-xs text-[--muted] truncate">{album.artistName}</p>
      </div>

      {/* Position opportunity */}
      {positionBadge && (
        <div className={`px-2 py-1 border text-[9px] font-bold ${positionBadge.color} flex-shrink-0`}>
          #{album.totalReviews + 1}
        </div>
      )}
    </Link>
  )
}
