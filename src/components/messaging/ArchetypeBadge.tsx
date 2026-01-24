'use client'

import { Tooltip } from '@/components/ui/tooltip'
import { ARCHETYPES } from '@/lib/tasteid'

interface ArchetypeBadgeProps {
  archetype: string
  isPrimary?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export function ArchetypeBadge({ archetype, isPrimary = false, size = 'md' }: ArchetypeBadgeProps) {
  // Find archetype info
  const archetypeInfo = Object.values(ARCHETYPES).find(a => a.id === archetype)
  
  const displayName = archetypeInfo?.name || archetype.split('-').map(
    w => w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ')
  
  const icon = archetypeInfo?.icon || '🎵'
  const description = archetypeInfo?.description || ''

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <Tooltip content={description || displayName}>
      <span
        className={`inline-flex items-center gap-1 font-medium ${sizeClasses[size]} ${
          isPrimary 
            ? 'bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/40' 
            : 'bg-[--muted]/20 text-[--foreground] border border-[--border]'
        }`}
      >
        <span>{icon}</span>
        <span>{displayName}</span>
      </span>
    </Tooltip>
  )
}
