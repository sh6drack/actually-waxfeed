import { ARCHETYPE_ICONS } from "@/components/icons/archetype-icons"
import { NETWORK_ICONS, MATCH_TYPE_ICONS, CHALLENGE_TYPE_ICONS } from "@/components/icons/network-icons"
import { VIBE_ICONS } from "@/components/icons/vibe-icons"

/**
 * Central icon registry - maps string IDs to React SVG icon components
 * Use this instead of emoji strings for consistent rendering
 */

type IconComponent = React.ComponentType<{
  size?: number
  className?: string
  color?: string
}>

export function getArchetypeIcon(archetypeId: string): IconComponent | null {
  // Try exact match first, then uppercase
  return ARCHETYPE_ICONS[archetypeId] || ARCHETYPE_ICONS[archetypeId.toUpperCase()] || null
}

export function getNetworkIcon(networkId: string): IconComponent | null {
  const key = networkId.toLowerCase()
  return (NETWORK_ICONS as Record<string, IconComponent>)[key] || null
}

export function getMatchTypeIcon(matchType: string): IconComponent | null {
  const key = matchType.toLowerCase().replace(/\s+/g, '_')
  return (MATCH_TYPE_ICONS as Record<string, IconComponent>)[key] || null
}

export function getChallengeTypeIcon(challengeType: string): IconComponent | null {
  const key = challengeType.toLowerCase().replace(/\s+/g, '_')
  return (CHALLENGE_TYPE_ICONS as Record<string, IconComponent>)[key] || null
}

export function getVibeIcon(vibeId: string): IconComponent | null {
  const key = vibeId.toLowerCase()
  return VIBE_ICONS[key] || null
}

// Re-export for convenience
export { ARCHETYPE_ICONS } from "@/components/icons/archetype-icons"
export { NETWORK_ICONS, MATCH_TYPE_ICONS, CHALLENGE_TYPE_ICONS } from "@/components/icons/network-icons"
export { VIBE_ICONS } from "@/components/icons/vibe-icons"
