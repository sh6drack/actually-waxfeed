"use client"

import { useState } from "react"
import Link from "next/link"
import { DefaultAvatar } from "@/components/default-avatar"
import { SignatureComparisonMini } from "./SignatureComparison"
import type { EnhancedTasteMatch, ListeningSignature } from "@/lib/tasteid"

interface ConnectionCardProps {
  connection: EnhancedTasteMatch
  userSignature?: ListeningSignature | null
  onConnect?: (userId: string) => void
  onDismiss?: (userId: string) => void
  showActions?: boolean
  variant?: "card" | "compact"
}

const MATCH_TYPE_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  taste_twin: { bg: "bg-emerald-500/10", text: "text-emerald-400", label: "Taste Twin" },
  network_resonance: { bg: "bg-blue-500/10", text: "text-blue-400", label: "Network Resonance" },
  opposite_attracts: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Opposite Attracts" },
  explorer_guide: { bg: "bg-purple-500/10", text: "text-purple-400", label: "Explorer Guide" },
  complementary: { bg: "bg-indigo-500/10", text: "text-indigo-400", label: "Complementary" },
  genre_buddy: { bg: "bg-rose-500/10", text: "text-rose-400", label: "Genre Buddy" },
}

export function ConnectionCard({
  connection,
  userSignature,
  onConnect,
  onDismiss,
  showActions = true,
  variant = "card",
}: ConnectionCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [connected, setConnected] = useState(false)

  const matchStyle = MATCH_TYPE_COLORS[connection.matchType] || MATCH_TYPE_COLORS.complementary

  const handleConnect = async () => {
    if (!onConnect || isLoading) return
    setIsLoading(true)
    try {
      await onConnect(connection.userId)
      setConnected(true)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDismiss = async () => {
    if (!onDismiss || isLoading) return
    setIsLoading(true)
    try {
      await onDismiss(connection.userId)
      setDismissed(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (dismissed) {
    return null
  }

  if (variant === "compact") {
    return (
      <Link
        href={`/u/${connection.username}`}
        className="flex items-center gap-3 p-3 border border-[--border] hover:border-white/30 transition-all group"
      >
        <div className="w-10 h-10 flex-shrink-0 border border-[--border] overflow-hidden group-hover:border-white/30 transition-colors">
          {connection.image ? (
            <img src={connection.image} alt="" className="w-full h-full object-cover" />
          ) : (
            <DefaultAvatar size="sm" className="w-full h-full" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">@{connection.username}</p>
          <p className="text-[10px] text-[--muted] truncate">{connection.connectionReason}</p>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-lg font-bold">{connection.overallScore}%</p>
          <span className={`text-[9px] ${matchStyle.text} font-bold tracking-wide uppercase`}>
            {matchStyle.label}
          </span>
        </div>
      </Link>
    )
  }

  return (
    <div
      className="border border-[--border] hover:border-white/30 transition-all overflow-hidden group"
      style={{
        animation: "fadeSlideIn 0.4s ease-out forwards",
        opacity: 0,
      }}
    >
      {/* Header with match type badge */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-[--border]">
        <span className={`text-[9px] ${matchStyle.text} font-bold tracking-[0.15em] uppercase px-2 py-0.5 ${matchStyle.bg}`}>
          {matchStyle.label}
        </span>
        <span className="text-[10px] text-[--muted]">
          {Math.round(connection.matchStrength * 100)}% confidence
        </span>
      </div>

      {/* User info */}
      <div className="p-4">
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <Link href={`/u/${connection.username}`} className="block flex-shrink-0">
            <div className="w-16 h-16 border border-[--border] overflow-hidden group-hover:border-white/30 transition-colors">
              {connection.image ? (
                <img src={connection.image} alt="" className="w-full h-full object-cover" />
              ) : (
                <DefaultAvatar size="md" className="w-full h-full" />
              )}
            </div>
          </Link>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <Link href={`/u/${connection.username}`} className="hover:underline">
              <p className="text-lg font-bold truncate">@{connection.username}</p>
            </Link>
            <p className="text-xs text-[--muted] flex items-center gap-1.5 mb-2">
              <span>{connection.archetypeIcon}</span>
              <span>{connection.archetype}</span>
            </p>
            <p className="text-xs text-[--muted] line-clamp-2">
              {connection.connectionReason}
            </p>
          </div>

          {/* Score */}
          <div className="text-center flex-shrink-0">
            <div
              className="relative w-16 h-16 flex items-center justify-center"
              style={{
                background: `conic-gradient(from 0deg, ${matchStyle.text.replace('text-', 'rgb(var(--')} / 0.3) ${connection.overallScore}%, transparent ${connection.overallScore}%)`,
              }}
            >
              <div className="absolute inset-1 bg-[--background] flex items-center justify-center">
                <span className="text-2xl font-bold">{connection.overallScore}</span>
              </div>
            </div>
            <p className="text-[9px] text-[--muted] mt-1 uppercase tracking-wider">Match</p>
          </div>
        </div>

        {/* Signature comparison mini visualization */}
        {userSignature && connection.networkResonance && (
          <div className="mt-4 pt-4 border-t border-[--border]">
            <SignatureComparisonMini
              userSignature={userSignature}
              otherResonance={connection.networkResonance}
              contrast={connection.networkContrast}
            />
          </div>
        )}

        {/* Compatibility highlights */}
        {connection.compatibilityHighlights.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {connection.compatibilityHighlights.map((highlight, i) => (
              <span
                key={i}
                className="text-[10px] px-2 py-0.5 border border-[--border] text-[--muted]"
              >
                {highlight}
              </span>
            ))}
          </div>
        )}

        {/* Shared genres and artists */}
        {(connection.sharedGenres.length > 0 || connection.sharedArtists.length > 0) && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs">
            {connection.sharedGenres.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[--muted] mb-1">Shared Genres</p>
                <p className="font-medium truncate">{connection.sharedGenres.slice(0, 3).join(", ")}</p>
              </div>
            )}
            {connection.sharedArtists.length > 0 && (
              <div>
                <p className="text-[9px] uppercase tracking-wider text-[--muted] mb-1">Shared Artists</p>
                <p className="font-medium truncate">{connection.sharedArtists.slice(0, 3).join(", ")}</p>
              </div>
            )}
          </div>
        )}

        {/* Potential introductions */}
        {connection.potentialIntroductions.length > 0 && (
          <div className="mt-4 p-3 border border-dashed border-[--border]">
            <p className="text-[9px] uppercase tracking-wider text-[--muted] mb-1">
              Could introduce you to
            </p>
            <p className="text-xs font-medium">
              {connection.potentialIntroductions.join(", ")}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {showActions && !connected && (
        <div className="flex border-t border-[--border]">
          <button
            onClick={handleDismiss}
            disabled={isLoading}
            className="flex-1 py-3 text-xs font-medium text-[--muted] hover:bg-[--surface] transition-colors disabled:opacity-50"
          >
            Not interested
          </button>
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="flex-1 py-3 text-xs font-bold bg-white text-black hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {isLoading ? "Connecting..." : "Connect"}
          </button>
        </div>
      )}

      {connected && (
        <div className="px-4 py-3 border-t border-[--border] bg-emerald-500/10 text-emerald-400 text-center text-xs font-medium">
          Friend request sent
        </div>
      )}

      <style jsx>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
