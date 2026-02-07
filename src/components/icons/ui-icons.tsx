"use client"

/**
 * Misc UI Icons - Replacements for scattered emojis
 * Used across wax components, notifications, empty states
 */

interface IconProps {
  size?: number
  className?: string
  color?: string
}

export function MusicNoteIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 18V5l12-2v13" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="6" cy="18" r="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
      <circle cx="18" cy="16" r="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function ChartBarIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="12" width="4" height="9" rx="1" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
      <rect x="10" y="6" width="4" height="15" rx="1" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
      <rect x="17" y="3" width="4" height="18" rx="1" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

export function HandshakeIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 14l4-4 3 1 4-4 3 1 6-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 7l-3 3 4 4 5-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.1" />
      <path d="M2 14l4 4 5-3 3 3 4-4 4 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MedalBadgeIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="14" r="7" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="14" r="4" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <path d="M12 10v1.5l1.5 1" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 7L6 2h4l2 3 2-3h4l-2 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
    </svg>
  )
}

export function ClockUrgentIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="13" r="9" stroke={color} strokeWidth="1.5" />
      <path d="M12 7v5l3 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 2v2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M17 4l-1 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M7 4l1 1.5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function SearchEmptyIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.05" />
      <path d="M15.5 15.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M8 8l4 4M12 8L8 12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  )
}

export function CandleWaxIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="8" y="10" width="8" height="11" rx="1" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
      <path d="M12 10V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 3c-1 1-2 2-2 3.5S11 9 12 7c1 2 2 .5 2-1S13 4 12 3z" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1" />
    </svg>
  )
}

export function WarningIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3L2 20h20L12 3z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M12 10v4" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="17" r="1" fill={color} />
    </svg>
  )
}

export function HeadphonesIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 15v-3a8 8 0 1116 0v3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2" y="14" width="4" height="6" rx="1" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
      <rect x="18" y="14" width="4" height="6" rx="1" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}
