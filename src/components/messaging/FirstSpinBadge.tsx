'use client'

import { Tooltip } from '@/components/ui/tooltip'

interface FirstSpinBadgeProps {
  badge: 'gold' | 'silver' | 'bronze' | null
  position?: number | null
  size?: 'sm' | 'md' | 'lg'
}

export function FirstSpinBadge({ badge, position, size = 'md' }: FirstSpinBadgeProps) {
  if (!badge) return null

  const colors = {
    gold: { bg: '#ffd700', text: '#000' },
    silver: { bg: '#c0c0c0', text: '#000' },
    bronze: { bg: '#cd7f32', text: '#fff' },
  }

  const labels = {
    gold: 'Gold Spin',
    silver: 'Silver Spin',
    bronze: 'Bronze Spin',
  }

  const icons = {
    gold: '🥇',
    silver: '🥈',
    bronze: '🥉',
  }

  const sizeClasses = {
    sm: 'text-[9px] px-1 py-0.5',
    md: 'text-[10px] px-1.5 py-0.5',
    lg: 'text-xs px-2 py-1',
  }

  const color = colors[badge]
  const tooltipText = position 
    ? `${labels[badge]} - Reviewer #${position}`
    : labels[badge]

  return (
    <Tooltip content={tooltipText}>
      <span
        className={`inline-flex items-center gap-0.5 font-bold uppercase tracking-wider ${sizeClasses[size]}`}
        style={{
          backgroundColor: color.bg,
          color: color.text,
        }}
      >
        <span>{icons[badge]}</span>
        {size !== 'sm' && <span>#{position || '?'}</span>}
      </span>
    </Tooltip>
  )
}
