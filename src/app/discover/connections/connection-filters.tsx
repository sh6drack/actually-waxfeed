"use client"

import Link from "next/link"
import { TasteTwinIcon, OppositeAttractsIcon, ExplorerGuideIcon, GenreBuddyIcon } from "@/components/icons/network-icons"

const FILTER_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; color?: string }>> = {
  taste_twin: TasteTwinIcon,
  complementary: OppositeAttractsIcon,
  explorer_guide: ExplorerGuideIcon,
  genre_buddy: GenreBuddyIcon,
}

const FILTER_OPTIONS = [
  { id: "all", label: "All" },
  { id: "taste_twin", label: "Taste Twins" },
  { id: "complementary", label: "Opposite Attracts" },
  { id: "explorer_guide", label: "Explorer Guides" },
  { id: "genre_buddy", label: "Genre Buddies" },
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
        const FilterIcon = FILTER_ICON_MAP[option.id]

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
            {FilterIcon && <FilterIcon size={14} />}
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
