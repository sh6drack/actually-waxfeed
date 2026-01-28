import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & {
  size?: number | string
  title?: string
}

const defaultProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

// Heart icon - for likes
export function HeartIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

export function HeartFilledIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}

// Vinyl/Disc icon - for wax awards
export function VinylIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeDasharray="2 2" />
    </svg>
  )
}

export function VinylFilledIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
    </svg>
  )
}

// Fire/Flame icon - for streaks and hot reactions
export function FlameIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M12 22c4.97 0 9-4.03 9-9 0-4.42-3.13-8.09-7.29-8.94.57 1.42.71 3.01.4 4.54-.63 3.08-3.11 5.4-3.11 5.4s-2.48-2.32-3.11-5.4c-.31-1.53-.17-3.12.4-4.54C4.13 4.91 1 8.58 1 13c0 4.97 4.03 9 9 9h2z" />
    </svg>
  )
}

export function FlameFilledIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M12 22c4.97 0 9-4.03 9-9 0-4.42-3.13-8.09-7.29-8.94.57 1.42.71 3.01.4 4.54-.63 3.08-3.11 5.4-3.11 5.4s-2.48-2.32-3.11-5.4c-.31-1.53-.17-3.12.4-4.54C4.13 4.91 1 8.58 1 13c0 4.97 4.03 9 9 9h2z" />
    </svg>
  )
}

// Verified checkmark badge
export function VerifiedIcon({ size = 16, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path fillRule="evenodd" clipRule="evenodd" d="M12 1l3.09 2.26L19 3.27l.01 3.91 2.26 3.09L19 13.36l-.01 3.91-3.91.01L12 19.54l-3.09-2.26-3.91-.01-.01-3.91L2.73 10.27 5 7.18l.01-3.91 3.91-.01L12 1zm-1.5 12.59L16.59 7.5 18 8.91l-7.5 7.5-4.5-4.5 1.41-1.41 3.09 3.09z" />
    </svg>
  )
}

// Sparkle/Star icon - for premium features
export function SparkleIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  )
}

export function SparkleFilledIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z" />
    </svg>
  )
}

// Lightbulb icon - for insightful reactions
export function LightbulbIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-7 7c0 2.38 1.19 4.47 3 5.74V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.26c1.81-1.27 3-3.36 3-5.74a7 7 0 0 0-7-7z" />
    </svg>
  )
}

// Smile/Laugh icon - for funny reactions
export function SmileIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
    </svg>
  )
}

// Zap/Bolt icon - for controversial/hot takes
export function BoltIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
    </svg>
  )
}

// Message/Comment icon
export function MessageIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

// Chart/Stats icon
export function ChartIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M18 20V10M12 20V4M6 20v-6" />
    </svg>
  )
}

// Candle/Wax icon - for wax score
export function CandleIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <rect x="8" y="10" width="8" height="12" rx="1" />
      <path d="M12 10V6" />
      <path d="M12 6c-1.5-1.5-1.5-3 0-4 1.5 1 1.5 2.5 0 4z" />
    </svg>
  )
}

// Arrow right icon
export function ArrowRightIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  )
}

// Share icon
export function ShareIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13" />
    </svg>
  )
}

// Copy/Clipboard icon
export function CopyIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <rect x="9" y="9" width="13" height="13" rx="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  )
}

// Check icon
export function CheckIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M20 6L9 17l-5-5" />
    </svg>
  )
}

// X/Twitter icon
export function XIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}

// Plus icon
export function PlusIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

// Reactions summary icon
export function ReactionsIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 9.05v.1M16 9.05v.1" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M16 14c-.5 1.5-1.79 3-4 3s-3.5-1.5-4-3" />
    </svg>
  )
}

// Disc icon (simpler vinyl)
export function DiscIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

// Bookmark icon - for saving albums
export function BookmarkIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      {...defaultProps}
      {...props}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

export function BookmarkFilledIcon({ size = 20, className, ...props }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={className}
      fill="currentColor"
      stroke="none"
      {...props}
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}
