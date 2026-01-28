'use client'

import { Tooltip } from '@/components/ui/tooltip'
import { ARCHETYPES } from '@/lib/tasteid'

interface ArchetypeBadgeProps {
  archetype: string
  isPrimary?: boolean
  size?: 'sm' | 'md' | 'lg'
  showIcon?: boolean
}

export function ArchetypeBadge({
  archetype,
  isPrimary = false,
  size = 'md',
  showIcon = true
}: ArchetypeBadgeProps) {
  // Find archetype info
  const archetypeInfo = Object.values(ARCHETYPES).find(a => a.id === archetype)

  const displayName = archetypeInfo?.name || archetype.split('-').map(
    w => w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ')

  const icon = archetypeInfo?.icon || '🎵'
  const description = archetypeInfo?.description || ''

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  }

  return (
    <Tooltip content={description || displayName}>
      <span
        className={`inline-flex items-center font-medium tracking-tight transition-colors ${sizeClasses[size]} ${
          isPrimary
            ? 'bg-gradient-to-r from-[var(--accent-primary)]/20 to-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/40 hover:border-[var(--accent-primary)]/60'
            : 'bg-[--muted]/10 text-[--foreground] border border-[--border] hover:border-[--muted]'
        }`}
      >
        {showIcon && <span className="flex-shrink-0">{icon}</span>}
        <span className="truncate">{displayName}</span>
      </span>
    </Tooltip>
  )
}
