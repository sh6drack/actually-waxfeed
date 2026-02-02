"use client"

import Image from "next/image"
import Link from "next/link"
import { CompatibilityMeter } from "./CompatibilityMeter"
import { ArchetypeBadge } from "./ArchetypeBadge"
import { DefaultAvatar } from "@/components/default-avatar"

interface UserTaste {
  id: string
  username: string | null
  name: string | null
  image: string | null
  archetype: {
    id: string
    name: string
    icon: string
    description: string
  }
  topGenres: string[]
  adventurenessScore: number
}

interface TasteComparisonProps {
  you: UserTaste
  them: UserTaste
  overallScore: number
  matchType: string
  matchDescription: string
  breakdown: {
    genreOverlap: number
    artistOverlap: number
    ratingAlignment: number
  }
  sharedGenres: string[]
  sharedArtists: string[]
  sharedAlbums: Array<{
    id: string
    title: string
    artistName: string
    coverArtUrlMedium: string | null
  }>
}

export function TasteComparison({
  you,
  them,
  overallScore,
  matchType,
  matchDescription,
  breakdown,
  sharedGenres,
  sharedArtists,
  sharedAlbums,
}: TasteComparisonProps) {
  return (
    <div className="space-y-8">
      {/* Main comparison header */}
      <div className="flex items-center justify-between gap-4">
        {/* You */}
        <UserColumn user={you} label="YOU" />

        {/* Compatibility meter */}
        <div className="flex flex-col items-center">
          <CompatibilityMeter
            score={overallScore}
            size="lg"
            matchType={matchType}
            animate
          />
          <p className="mt-2 text-xs text-neutral-400 text-center max-w-[200px]">
            {matchDescription}
          </p>
        </div>

        {/* Them */}
        <UserColumn user={them} label="THEM" />
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-2 border-white p-4">
        <BreakdownBar label="GENRE OVERLAP" value={breakdown.genreOverlap} />
        <BreakdownBar label="ARTIST OVERLAP" value={breakdown.artistOverlap} />
        <BreakdownBar label="RATING STYLE" value={breakdown.ratingAlignment} />
      </div>

      {/* Shared elements */}
      {sharedGenres.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold">
            SHARED GENRES
          </h3>
          <div className="flex flex-wrap gap-2">
            {sharedGenres.map((genre) => (
              <span
                key={genre}
                className="px-3 py-1 border-2 border-white text-sm uppercase font-bold"
              >
                {genre}
              </span>
            ))}
          </div>
        </div>
      )}

      {sharedArtists.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold">
            ARTISTS YOU BOTH LOVE
          </h3>
          <div className="text-sm text-neutral-300">
            {sharedArtists.join(" · ")}
          </div>
        </div>
      )}

      {sharedAlbums.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs uppercase tracking-widest text-neutral-500 font-bold">
            ALBUMS YOU BOTH RATED HIGHLY
          </h3>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {sharedAlbums.map((album) => (
              <Link
                key={album.id}
                href={`/album/${album.id}`}
                className="flex-shrink-0 group"
              >
                <div className="w-16 h-16 border-2 border-neutral-700 group-hover:border-white transition-colors">
                  {album.coverArtUrlMedium ? (
                    <Image
                      src={album.coverArtUrlMedium}
                      alt={album.title}
                      width={64}
                      height={64}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-neutral-800" />
                  )}
                </div>
                <div className="mt-1 w-16">
                  <div className="text-[10px] text-white truncate">{album.title}</div>
                  <div className="text-[9px] text-neutral-500 truncate">{album.artistName}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function UserColumn({ user, label }: { user: UserTaste; label: string }) {
  return (
    <div className="flex flex-col items-center text-center space-y-3 w-24 sm:w-32">
      <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
        {label}
      </span>
      <Link href={`/u/${user.username}`} className="group">
        <div className="w-16 h-16 border-2 border-white group-hover:border-neutral-400 transition-colors overflow-hidden">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.username || "User"}
              width={64}
              height={64}
              className="w-full h-full object-cover"
            />
          ) : (
            <DefaultAvatar size="md" className="w-full h-full" />
          )}
        </div>
      </Link>
      <Link
        href={`/u/${user.username}`}
        className="font-bold text-sm hover:underline"
      >
        @{user.username}
      </Link>
      <ArchetypeBadge {...user.archetype} size="sm" />
      <div className="text-[10px] text-neutral-500 uppercase">
        {Math.round(user.adventurenessScore * 100)}% ADVENTUROUS
      </div>
    </div>
  )
}

function BreakdownBar({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-baseline">
        <span className="text-[10px] uppercase tracking-widest text-neutral-500 font-bold">
          {label}
        </span>
        <span className="text-sm font-bold">{value}%</span>
      </div>
      <div className="h-2 bg-neutral-800">
        <div
          className="h-full bg-white transition-all duration-500"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

export function TasteComparisonSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex items-center justify-between gap-4">
        <div className="w-32 h-40 bg-neutral-800" />
        <div className="w-32 h-32 rounded-full bg-neutral-800" />
        <div className="w-32 h-40 bg-neutral-800" />
      </div>
      <div className="h-24 bg-neutral-800" />
    </div>
  )
}
