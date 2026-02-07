"use client"

import { motion } from "framer-motion"
import { ArchetypeBadge } from "./ArchetypeBadge"
import { GenreRadarChart } from "./GenreRadarChart"
import { DefaultAvatar } from "@/components/default-avatar"
import Link from "next/link"

interface TasteIDHeroCardProps {
  username: string
  image: string | null
  archetypeInfo: { id: string; name: string; description: string; icon?: string }
  secondaryInfo?: { id: string; name: string; description: string; icon?: string } | null
  archetypeConfidence: number
  polarityScore: number
  genreVector: Record<string, number>
  isOwnProfile: boolean
}

export function TasteIDHeroCard({
  username,
  image,
  archetypeInfo,
  secondaryInfo,
  archetypeConfidence,
  polarityScore,
  genreVector,
  isOwnProfile,
}: TasteIDHeroCardProps) {
  return (
    <motion.div
      className="relative overflow-hidden glass-strong p-6 md:p-8 mb-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      {/* Background accent glow */}
      <div
        className="absolute -top-24 -right-24 w-64 h-64 rounded-full blur-3xl pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle, var(--polarity-teal), transparent)`,
        }}
      />

      <div className="relative flex flex-col md:flex-row items-start gap-6 md:gap-8">
        {/* User + Archetype */}
        <div className="flex-1">
          {/* User identity */}
          <div className="flex items-center gap-4 mb-6">
            <div className="w-14 h-14 md:w-16 md:h-16 overflow-hidden flex-shrink-0 border border-white/10">
              {image ? (
                <img src={image} alt={username} className="w-full h-full object-cover" />
              ) : (
                <DefaultAvatar size="lg" className="w-full h-full" />
              )}
            </div>
            <div>
              <p className="text-[10px] tracking-[0.4em] uppercase text-[--polarity-teal] font-technical mb-1">
                TasteID
              </p>
              <Link href={`/u/${username}`} className="text-xl md:text-2xl font-display font-bold hover:text-[--accent-primary] transition-colors">
                @{username}
              </Link>
            </div>
          </div>

          {/* Archetype */}
          <div className="mb-4">
            <ArchetypeBadge
              {...archetypeInfo}
              confidence={archetypeConfidence}
              size="lg"
              showDescription
            />
          </div>

          {secondaryInfo && (
            <div className="flex items-center gap-2 mb-4">
              <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted] font-technical">Also:</span>
              <ArchetypeBadge {...secondaryInfo} size="sm" />
            </div>
          )}

          {/* Polarity Score Ring */}
          <div className="flex items-center gap-4 mt-4">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                {/* Background ring */}
                <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                {/* Score ring */}
                <circle
                  cx="32"
                  cy="32"
                  r="28"
                  fill="none"
                  stroke="var(--polarity-teal)"
                  strokeWidth="4"
                  strokeDasharray={`${polarityScore * 100 * 1.76} 176`}
                  strokeLinecap="round"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold font-technical">
                  {polarityScore.toFixed(2)}
                </span>
              </div>
            </div>
            <div>
              <p className="text-xs font-bold">Polarity Score</p>
              <p className="text-[10px] text-[--muted]">Taste distinctiveness</p>
            </div>
          </div>
        </div>

        {/* Radar Chart */}
        <div className="flex-shrink-0">
          <GenreRadarChart genres={genreVector} size={200} />
        </div>
      </div>
    </motion.div>
  )
}
