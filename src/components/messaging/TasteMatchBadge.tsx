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
    if (score >= 80) return 'var(--accent-primary)' // Gold - Taste Twin
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

  const getIcon = () => {
    if (score >= 80) {
      return (
        <svg className="w-2.5 h-2.5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
        </svg>
      )
    }
    return null
  }

  const sizeClasses = {
    sm: 'text-[10px] px-1.5 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }

  const color = getColor()

  return (
    <Tooltip content={`${score}% taste compatibility — ${getLabel()}`}>
      <span
        className={`inline-flex items-center font-semibold tabular-nums ${sizeClasses[size]} transition-all hover:scale-105`}
        style={{
          backgroundColor: `${color}15`,
          color: color,
          border: `1px solid ${color}30`,
        }}
      >
        {getIcon()}
        <span>{score}%</span>
        {showLabel && <span className="opacity-70 font-medium">match</span>}
      </span>
    </Tooltip>
  )
}
