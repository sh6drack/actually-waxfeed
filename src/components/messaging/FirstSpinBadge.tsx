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
    gold: { bg: 'var(--accent-primary)', text: '#000', border: 'var(--accent-primary)' },
    silver: { bg: '#e5e5e5', text: '#000', border: '#c0c0c0' },
    bronze: { bg: '#cd7f32', text: '#fff', border: '#cd7f32' },
  }

  const labels = {
    gold: 'Gold Spin',
    silver: 'Silver Spin',
    bronze: 'Bronze Spin',
  }

  const descriptions = {
    gold: 'First 10 reviewers',
    silver: 'Reviewers 11-50',
    bronze: 'Reviewers 51-100',
  }

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[10px] px-2 py-1 gap-1.5',
    lg: 'text-xs px-2.5 py-1.5 gap-2',
  }

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-3.5 h-3.5',
  }

  const color = colors[badge]
  const tooltipText = position
    ? `${labels[badge]} · Reviewer #${position} · ${descriptions[badge]}`
    : `${labels[badge]} · ${descriptions[badge]}`

  const getIcon = () => {
    if (badge === 'gold') {
      return (
        <svg className={iconSizes[size]} viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
        </svg>
      )
    }
    return (
      <svg className={iconSizes[size]} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
      </svg>
    )
  }

  return (
    <Tooltip content={tooltipText}>
      <span
        className={`inline-flex items-center font-bold uppercase tracking-wider ${sizeClasses[size]} transition-all hover:scale-105`}
        style={{
          backgroundColor: color.bg,
          color: color.text,
          boxShadow: `0 0 0 1px ${color.border}`,
        }}
      >
        {getIcon()}
        {size !== 'sm' && position && (
          <span className="tabular-nums">#{position}</span>
        )}
      </span>
    </Tooltip>
  )
}
