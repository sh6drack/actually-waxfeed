"use client"

/**
 * Custom Archetype Icons - No emojis, pure SVG
 * Each icon represents a unique music taste archetype
 * Designed to be distinctive at 20px and 48px
 */

interface IconProps {
  size?: number
  className?: string
  color?: string
}

// Genre-Based Archetypes

export function HipHopHeadIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3v12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="17" r="4" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" />
      <path d="M12 3l4 2v4l-4 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.3" />
      <circle cx="12" cy="17" r="1.5" fill={color} />
    </svg>
  )
}

export function JazzExplorerIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 3c0 0 1 1 1 3s-1 3-1 3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <ellipse cx="8" cy="12" rx="3" ry="4" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <path d="M11 12h4c1.5 0 3 .5 3 2s-1 2-2 2h-1" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="14" cy="18" r="3" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.2" />
      <circle cx="14" cy="18" r="1" fill={color} />
    </svg>
  )
}

export function RockPuristIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 21l4-18 4 18" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 15h12" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="8" r="2" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
      <path d="M10 12l4-4M14 12l-4-4" stroke={color} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  )
}

export function ElectronicPioneerIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M2 12h2l2-4 3 8 3-8 3 8 2-4h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="17" width="18" height="4" rx="1" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <circle cx="7" cy="19" r="1" fill={color} />
      <circle cx="12" cy="19" r="1" fill={color} />
      <circle cx="17" cy="19" r="1" fill={color} />
    </svg>
  )
}

export function SoulSearcherIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={color}
        fillOpacity="0.15"
        stroke={color}
        strokeWidth="1.5"
      />
      <path d="M8 10h2l1-2 2 4 1-2h2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function MetalMavenIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M8 21V10a4 4 0 018 0v11" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 14l3-4M19 14l-3-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 14v5l3-2v-7" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
      <path d="M19 14v5l-3-2v-7" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
      <circle cx="12" cy="7" r="2" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
    </svg>
  )
}

export function IndieDevoteeIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 15v-3a8 8 0 1116 0v3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="2" y="14" width="4" height="6" rx="1" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
      <rect x="18" y="14" width="4" height="6" rx="1" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
      <path d="M9 8c0-1 1-2 3-2s3 1 3 2" stroke={color} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M8 11l2 1m6-1l-2 1" stroke={color} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.4" />
    </svg>
  )
}

export function PopConnoisseurIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M12 2l2.4 4.8 5.3.8-3.8 3.7.9 5.3L12 14.1l-4.8 2.5.9-5.3L4.3 7.6l5.3-.8L12 2z"
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="9" r="2" fill={color} fillOpacity="0.3" />
      <path d="M12 17v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 21h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function CountrySoulIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 16h16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M6 16c0-2 2-8 6-8s6 6 6 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill={color} fillOpacity="0.15" />
      <path d="M9 8c0-2 1.5-5 3-5s3 3 3 5" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill={color} fillOpacity="0.25" />
      <path d="M2 16c0 2 2 5 10 5s10-3 10-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function ClassicalMindIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3v14" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 3c3 0 6 2 6 5s-3 5-6 5" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.2" />
      <ellipse cx="8" cy="18" rx="4" ry="3" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
    </svg>
  )
}

// Behavioral Archetypes

export function GenreFluidIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 12c3-6 6-6 9 0s6 6 9 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M3 8c3-6 6-6 9 0s6 6 9 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M3 16c3-6 6-6 9 0s6 6 9 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.3" />
      <circle cx="6" cy="12" r="1.5" fill={color} fillOpacity="0.5" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <circle cx="18" cy="12" r="1.5" fill={color} fillOpacity="0.5" />
    </svg>
  )
}

export function DecadeDiverIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <path d="M12 5v3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M12 12l4 3" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M12 12l-1-5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1" strokeOpacity="0.3" strokeDasharray="2 2" />
    </svg>
  )
}

export function DeepCutterIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l3 7h7l-5.5 4.5 2 7L12 16l-6.5 4.5 2-7L2 9h7l3-7z" fill={color} fillOpacity="0.1" />
      <path d="M12 4l2.5 6h6l-5 4 2 6-5.5-4-5.5 4 2-6-5-4h6L12 4z" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.2" />
      <path d="M12 8v4l3 2" stroke={color} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  )
}

export function ChartChaserIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 20l5-5 4 2 9-12" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 5h4v4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="3" y="16" width="3" height="5" rx="0.5" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1" />
      <rect x="8" y="14" width="3" height="7" rx="0.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
      <rect x="13" y="11" width="3" height="10" rx="0.5" fill={color} fillOpacity="0.4" stroke={color} strokeWidth="1" />
    </svg>
  )
}

export function TheCriticIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5" />
      <circle cx="10" cy="10" r="4" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <circle cx="10" cy="10" r="2" fill={color} fillOpacity="0.3" />
      <path d="M15.5 15.5L21 21" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function TheEnthusiastIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 3l1.5 3 1.5-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 5l2 2.5-1 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 5l-2 2.5 1 2" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="12" cy="15" r="6" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" />
      <path d="M9 14l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function EssayWriterIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M17 3l4 4-12 12H5v-4L17 3z" fill={color} fillOpacity="0.15" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M13 7l4 4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 19h14" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
    </svg>
  )
}

export function AlbumArchaeologistIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 20h16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5" y="10" width="3" height="10" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <rect x="10.5" y="10" width="3" height="10" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <rect x="16" y="10" width="3" height="10" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <path d="M4 10h16" stroke={color} strokeWidth="1.5" />
      <path d="M6 10V7l6-4 6 4v3" stroke={color} strokeWidth="1.5" strokeLinejoin="round" fill={color} fillOpacity="0.15" />
      <circle cx="12" cy="6" r="1.5" fill={color} fillOpacity="0.3" />
    </svg>
  )
}

export function NewReleaseHunterIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" strokeOpacity="0.5" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="16" y="2" width="6" height="4" rx="1" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
      <text x="19" y="5" textAnchor="middle" fontSize="3.5" fill={color} fontWeight="bold" fontFamily="sans-serif">N</text>
    </svg>
  )
}

export function TasteTwinSeekerIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="8" cy="10" r="4" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <circle cx="16" cy="10" r="4" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <path d="M12 6v12" stroke={color} strokeWidth="1" strokeDasharray="2 2" strokeOpacity="0.5" />
      <circle cx="8" cy="10" r="1.5" fill={color} fillOpacity="0.5" />
      <circle cx="16" cy="10" r="1.5" fill={color} fillOpacity="0.5" />
      <path d="M6 17c1 2 3 3 6 3s5-1 6-3" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

// Mood-Based Archetypes

export function MoodCuratorIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M9 3c-2 0-6 3-6 7s2 5 4 5 3-2 3-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill={color} fillOpacity="0.15" />
      <path d="M15 3c2 0 6 3 6 7s-2 5-4 5-3-2-3-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill={color} fillOpacity="0.15" />
      <path d="M9 15c1 3 2 6 3 6s2-3 3-6" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="8" cy="8" r="1" fill={color} />
      <circle cx="16" cy="8" r="1" fill={color} />
    </svg>
  )
}

export function SonicEscapistIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="1.5" />
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.5" strokeOpacity="0.6" />
      <circle cx="12" cy="12" r="2" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1" />
      <path d="M12 3c0 3-2 5-2 9s2 6 2 9" stroke={color} strokeWidth="1" strokeOpacity="0.4" />
      <path d="M5 7c2 1 4 3 7 5s5 2 7 3" stroke={color} strokeWidth="1" strokeOpacity="0.3" />
      <circle cx="9" cy="8" r="0.75" fill={color} fillOpacity="0.5" />
      <circle cx="15" cy="16" r="0.75" fill={color} fillOpacity="0.5" />
      <circle cx="7" cy="14" r="0.75" fill={color} fillOpacity="0.4" />
    </svg>
  )
}

export function EnergySeekerIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M10 2L4 13h6l-2 9 10-13h-6l2-7z" fill={color} fillOpacity="0.2" stroke={color} strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M16 2l-2 5h4l-6 8" stroke={color} strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.4" />
    </svg>
  )
}

// Writing-Style Archetypes

export function ThePoetIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M12 2l1 3-1 1-1-1 1-3z" fill={color} fillOpacity="0.3" />
      <path d="M9 4l.5 2-.5 1-.5-1L9 4z" fill={color} fillOpacity="0.2" />
      <path d="M15 4l-.5 2 .5 1 .5-1-.5-2z" fill={color} fillOpacity="0.2" />
      <path d="M20 4l-8 8-4 8" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 8l2-2" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 16c0 2 1.5 4 4 4s4-2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" fill={color} fillOpacity="0.1" />
    </svg>
  )
}

export function TheTechnicianIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <circle cx="12" cy="12" r="1.5" fill={color} />
      <path d="M12 2v4M12 18v4M2 12h4M18 12h4" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function TheStorytellerIcon({ size = 20, className = "", color = "currentColor" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M4 4h7c1 0 1 1 1 1v14s0-1-1-1H4V4z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.1" />
      <path d="M20 4h-7c-1 0-1 1-1 1v14s0-1 1-1h7V4z" stroke={color} strokeWidth="1.5" fill={color} fillOpacity="0.15" />
      <path d="M7 8h2M7 11h3M7 14h2" stroke={color} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
      <path d="M15 8h2M15 11h3M15 14h2" stroke={color} strokeWidth="1" strokeLinecap="round" strokeOpacity="0.5" />
    </svg>
  )
}

// Export all archetype icons as a lookup map
export const ARCHETYPE_ICONS: Record<string, React.ComponentType<IconProps>> = {
  HIP_HOP_HEAD: HipHopHeadIcon,
  JAZZ_EXPLORER: JazzExplorerIcon,
  ROCK_PURIST: RockPuristIcon,
  ELECTRONIC_PIONEER: ElectronicPioneerIcon,
  SOUL_SEARCHER: SoulSearcherIcon,
  METAL_MAVEN: MetalMavenIcon,
  INDIE_DEVOTEE: IndieDevoteeIcon,
  POP_CONNOISSEUR: PopConnoisseurIcon,
  COUNTRY_SOUL: CountrySoulIcon,
  CLASSICAL_MIND: ClassicalMindIcon,
  GENRE_FLUID: GenreFluidIcon,
  DECADE_DIVER: DecadeDiverIcon,
  DEEP_CUTTER: DeepCutterIcon,
  CHART_CHASER: ChartChaserIcon,
  THE_CRITIC: TheCriticIcon,
  THE_ENTHUSIAST: TheEnthusiastIcon,
  ESSAY_WRITER: EssayWriterIcon,
  ALBUM_ARCHAEOLOGIST: AlbumArchaeologistIcon,
  NEW_RELEASE_HUNTER: NewReleaseHunterIcon,
  TASTE_TWIN_SEEKER: TasteTwinSeekerIcon,
  MOOD_CURATOR: MoodCuratorIcon,
  SONIC_ESCAPIST: SonicEscapistIcon,
  ENERGY_SEEKER: EnergySeekerIcon,
  THE_POET: ThePoetIcon,
  THE_TECHNICIAN: TheTechnicianIcon,
  THE_STORYTELLER: TheStorytellerIcon,
}
