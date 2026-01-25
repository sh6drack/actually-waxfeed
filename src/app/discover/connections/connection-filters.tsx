"use client"

import Link from "next/link"

const FILTER_OPTIONS = [
  { id: "all", label: "All", icon: null },
  { id: "taste_twin", label: "Taste Twins", icon: "👯" },
  { id: "complementary", label: "Opposite Attracts", icon: "🌀" },
  { id: "explorer_guide", label: "Explorer Guides", icon: "🧭" },
  { id: "genre_buddy", label: "Genre Buddies", icon: "🎵" },
] as const

interface ConnectionFiltersProps {
  currentFilter: string
  counts: Record<string, number>
}

export function ConnectionFilters({ currentFilter, counts }: ConnectionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {FILTER_OPTIONS.map((option) => {
        const isActive = currentFilter === option.id
        const count = counts[option.id] || 0

        return (
          <Link
            key={option.id}
            href={option.id === "all" ? "/discover/connections" : `/discover/connections?filter=${option.id}`}
            className={`
              flex items-center gap-2 px-4 py-2 border text-[11px] tracking-[0.1em] uppercase font-medium transition-colors
              ${isActive
                ? "border-white bg-white text-black"
                : "border-[--border] text-[--muted] hover:border-white hover:text-white"
              }
            `}
          >
            {option.icon && <span className="text-sm">{option.icon}</span>}
            <span>{option.label}</span>
            <span className={`tabular-nums ${isActive ? "text-black/60" : "text-[--muted]"}`}>
              {count}
            </span>
          </Link>
        )
      })}
    </div>
  )
}
