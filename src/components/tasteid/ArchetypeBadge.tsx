"use client"

import { ARCHETYPE_ICONS } from "@/components/icons/archetype-icons"
import { MusicNoteIcon } from "@/components/icons/ui-icons"

interface ArchetypeBadgeProps {
  id: string
  name: string
  icon?: string
  description?: string
  confidence?: number
  size?: "sm" | "md" | "lg"
  showDescription?: boolean
}

export function ArchetypeBadge({
  id,
  name,
  icon,
  description,
  confidence,
  size = "md",
  showDescription = false,
}: ArchetypeBadgeProps) {
  const sizeClasses = {
    sm: "px-2 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  }

  const iconPixelSizes = {
    sm: 14,
    md: 18,
    lg: 22,
  }

  // Look up custom SVG icon by archetype ID
  const IconComponent = ARCHETYPE_ICONS[id] || ARCHETYPE_ICONS[id?.toUpperCase()] || null

  return (
    <div className="inline-flex flex-col">
      <div
        className={`
          inline-flex items-center gap-2
          bg-black text-white
          border-2 border-white
          font-bold uppercase tracking-wider
          ${sizeClasses[size]}
        `}
        title={description}
      >
        {IconComponent ? (
          <IconComponent size={iconPixelSizes[size]} />
        ) : (
          <MusicNoteIcon size={iconPixelSizes[size]} />
        )}
        <span>{name}</span>
        {confidence !== undefined && confidence > 0 && (
          <span className="text-white/60 font-normal text-[0.7em]">
            {Math.round(confidence * 100)}%
          </span>
        )}
      </div>
      {showDescription && description && (
        <span className="text-xs text-muted-foreground mt-1">{description}</span>
      )}
    </div>
  )
}

export function ArchetypeBadgeSkeleton({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-24 h-6",
    md: "w-32 h-8",
    lg: "w-40 h-10",
  }

  return (
    <div
      className={`
        ${sizeClasses[size]}
        bg-muted animate-pulse
        border-2 border-border
      `}
    />
  )
}
