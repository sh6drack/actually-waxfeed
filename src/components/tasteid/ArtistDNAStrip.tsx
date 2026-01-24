"use client"

interface ArtistDNAStripProps {
  artists: string[]
  maxDisplay?: number
  className?: string
}

export function ArtistDNAStrip({
  artists,
  maxDisplay = 10,
  className = "",
}: ArtistDNAStripProps) {
  const displayArtists = artists.slice(0, maxDisplay)
  const remaining = artists.length - maxDisplay

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
        {displayArtists.map((artist, i) => (
          <div
            key={artist}
            className="flex-shrink-0 group"
          >
            <div
              className="px-3 py-2.5 sm:py-2 border-2 border-white bg-black
                         text-sm font-bold uppercase tracking-wider
                         transition-colors hover:bg-white hover:text-black
                         min-h-[44px] flex items-center"
            >
              <span className="text-white/50 mr-2 text-xs">{i + 1}</span>
              {artist}
            </div>
          </div>
        ))}
        {remaining > 0 && (
          <div className="flex-shrink-0 px-3 py-2.5 sm:py-2 text-sm text-muted-foreground min-h-[44px] flex items-center">
            +{remaining} more
          </div>
        )}
      </div>
    </div>
  )
}

export function ArtistDNAStripSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden animate-pulse">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-10 w-32 bg-muted flex-shrink-0" />
      ))}
    </div>
  )
}
