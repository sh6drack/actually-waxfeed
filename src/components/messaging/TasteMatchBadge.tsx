'use client'

import { Tooltip } from '@/components/ui/tooltip'

interface TasteMatchBadgeProps {
  score: number
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
}

export function TasteMatchBadge({ score, size = 'md', showLabel = true }: TasteMatchBadgeProps) {
  // Determine color based on score
  const getColor = () => {
    if (score >= 80) return '#ffd700' // Gold - Taste Twin
    if (score >= 70) return '#22c55e' // Green - Strong match
    if (score >= 60) return '#3b82f6' // Blue - Good match
    return '#6b7280' // Gray - Below threshold
  }

  const getLabel = () => {
    if (score >= 80) return 'Taste Twin'
    if (score >= 70) return 'Strong Match'
    if (score >= 60) return 'Compatible'
    return 'Low Match'
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5',
    md: 'text-xs px-2 py-1',
    lg: 'text-sm px-3 py-1.5',
  }

  return (
    <Tooltip content={`${score}% taste compatibility - ${getLabel()}`}>
      <span
        className={`inline-flex items-center gap-1 font-medium tabular-nums ${sizeClasses[size]}`}
        style={{
          backgroundColor: `${getColor()}20`,
          color: getColor(),
          border: `1px solid ${getColor()}40`,
        }}
      >
        <span>{score}%</span>
        {showLabel && <span className="opacity-75">match</span>}
      </span>
    </Tooltip>
  )
}
