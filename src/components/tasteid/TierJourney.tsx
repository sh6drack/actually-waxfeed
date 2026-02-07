"use client"

import { motion } from "framer-motion"

const TIERS = [
  { name: "Listener", min: 0, color: "#666" },
  { name: "Enthusiast", min: 20, color: "#00bfff" },
  { name: "Connoisseur", min: 50, color: "#00ff88" },
  { name: "Sommelier", min: 100, color: "#ffd700" },
  { name: "Curator", min: 200, color: "#FF8A65" },
  { name: "Oracle", min: 500, color: "#BB8FCE" },
]

interface TierJourneyProps {
  ratingCount: number
}

export function TierJourney({ ratingCount }: TierJourneyProps) {
  const currentTierIndex = TIERS.findIndex((t, i) => {
    const next = TIERS[i + 1]
    return !next || ratingCount < next.min
  })

  return (
    <motion.div
      className="glass p-5 md:p-6 mb-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
    >
      <div className="flex items-center gap-3 mb-5">
        <p className="text-[10px] tracking-[0.4em] uppercase text-[--muted] font-technical">
          Tier Journey
        </p>
        <span className="text-[10px] text-[--muted] font-technical">{ratingCount} ratings</span>
      </div>

      {/* Tier path */}
      <div className="relative">
        {/* Connection line */}
        <div className="absolute top-4 left-4 right-4 h-[2px] bg-[--border]" />
        <div
          className="absolute top-4 left-4 h-[2px] transition-all duration-1000 ease-out"
          style={{
            width: `${Math.min(100, (currentTierIndex / (TIERS.length - 1)) * 100)}%`,
            background: `linear-gradient(to right, ${TIERS[0].color}, ${TIERS[currentTierIndex].color})`,
          }}
        />

        <div className="relative flex justify-between">
          {TIERS.map((tier, i) => {
            const isActive = i === currentTierIndex
            const isPast = i < currentTierIndex
            const isFuture = i > currentTierIndex

            return (
              <div key={tier.name} className="flex flex-col items-center" style={{ width: "16.66%" }}>
                {/* Node */}
                <motion.div
                  className="relative w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors duration-500"
                  style={{
                    borderColor: isPast || isActive ? tier.color : "var(--border)",
                    backgroundColor: isActive ? tier.color : isPast ? `${tier.color}20` : "var(--background)",
                  }}
                  animate={isActive ? { scale: [1, 1.15, 1] } : {}}
                  transition={isActive ? { duration: 2, repeat: Infinity, ease: "easeInOut" } : {}}
                >
                  {isPast && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={tier.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6L9 17l-5-5" />
                    </svg>
                  )}
                  {isActive && (
                    <div className="w-2.5 h-2.5 rounded-full bg-black" />
                  )}
                  {isFuture && (
                    <div className="w-1.5 h-1.5 rounded-full bg-[--border]" />
                  )}

                  {/* Active glow */}
                  {isActive && (
                    <div
                      className="absolute inset-0 rounded-full animate-ping opacity-30"
                      style={{ backgroundColor: tier.color }}
                    />
                  )}
                </motion.div>

                {/* Label */}
                <p
                  className={`text-[9px] md:text-[10px] tracking-wider uppercase mt-2 text-center font-technical transition-colors duration-300 ${
                    isActive ? "font-bold" : isFuture ? "text-[--muted]" : ""
                  }`}
                  style={{ color: isActive || isPast ? tier.color : undefined }}
                >
                  {tier.name}
                </p>

                {/* Min count */}
                <p className="text-[8px] text-[--muted] mt-0.5 font-technical">
                  {tier.min === 0 ? "Start" : `${tier.min}+`}
                </p>
              </div>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
