"use client"

/**
 * Custom Vibe/Descriptor Icons - No emojis, pure SVG
 * Used in quick-rate mode and onboarding for mood tagging
 */

interface IconProps {
  size?: number
  className?: string
  color?: string
}

export function EnergeticIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function ChillIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 12c2-3 5-5 8-3s4 3 6 3 4-1 6-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M2 17c2-3 5-5 8-3s4 3 6 3 4-1 6-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M2 7c2-3 5-5 8-3s4 3 6 3 4-1 6-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
    </svg>
  )
}

export function EmotionalIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M12 13v-2M8 10v2" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function HypeIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 22c-1-3-6-5-6-10a6 6 0 1112 0c0 5-5 7-6 10z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
      <path d="M12 22c-.5-2-3-3-3-6a3 3 0 016 0c0 3-2.5 4-3 6z" fill={color} fillOpacity="0.3" />
    </svg>
  )
}

export function NostalgicIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <rect x="3" y="5" width="18" height="12" rx="1.5" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <circle cx="8" cy="11" r="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <circle cx="8" cy="11" r="1" fill={color} />
      <circle cx="16" cy="11" r="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <circle cx="16" cy="11" r="1" fill={color} />
      <path d="M11 11h2" stroke={color} strokeWidth="1" />
      <path d="M8 19h8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  )
}

export function ExperimentalIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 3h6v5l4 10a2 2 0 01-2 2H7a2 2 0 01-2-2l4-10V3z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <path d="M9 3h6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 15h8" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      <circle cx="10" cy="17" r="1" fill={color} fillOpacity="0.4" />
      <circle cx="14" cy="16" r="1.5" fill={color} fillOpacity="0.3" />
      <circle cx="12" cy="18" r="0.75" fill={color} fillOpacity="0.5" />
    </svg>
  )
}

export function TimelessIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l2 5h5l-4 3.5 1.5 5-4.5-3-4.5 3 1.5-5L5 7h5l2-5z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 14l-3 7M14 14l3 7" stroke={color} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
    </svg>
  )
}

export function DarkVibeIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
      <circle cx="14" cy="9" r="0.75" fill={color} fillOpacity="0.3" />
      <circle cx="17" cy="13" r="0.5" fill={color} fillOpacity="0.2" />
    </svg>
  )
}

export const VIBE_ICONS: Record<string, React.ComponentType<IconProps>> = {
  energetic: EnergeticIcon,
  chill: ChillIcon,
  emotional: EmotionalIcon,
  hype: HypeIcon,
  nostalgic: NostalgicIcon,
  experimental: ExperimentalIcon,
  timeless: TimelessIcon,
  dark: DarkVibeIcon,
}
