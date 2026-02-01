/**
 * TasteID Components - Powered by Polarity 1.9 "Dyad"
 * How WaxFeed understands your music taste
 */

// Shared types and constants
export {
  NETWORK_COLORS,
  PATTERN_CATEGORY_COLORS,
  TREND_COLORS,
  SCORE_LEVEL_COLORS,
  SCORE_LEVELS,
  VISUALIZATION_SIZES,
  TREND_LABELS,
  getScoreLevel,
  getNetworkColor,
  getTrendDisplay,
  type NetworkKey,
  type ListeningSignature,
  type MusicNetworkId,
  type ConsolidatedTaste,
} from "./types"

// Core TasteID components (original)
export { ArchetypeBadge, ArchetypeBadgeSkeleton } from "./ArchetypeBadge"
export { GenreRadarChart, GenreRadarChartSkeleton } from "./GenreRadarChart"
export { CompatibilityMeter, CompatibilityMeterSkeleton } from "./CompatibilityMeter"
export { TasteIDCard, TasteIDCardSkeleton } from "./TasteIDCard"
export { TasteComparison, TasteComparisonSkeleton } from "./TasteComparison"
export { ArtistDNAStrip, ArtistDNAStripSkeleton } from "./ArtistDNAStrip"
export { TasteCardShare } from "./TasteCardShare"
export { TierProgress, TierProgressRing } from "./TierProgress"

// Polarity 1.9 Music Networks
export {
  MusicNetworksVisualization,
  MusicNetworksMini,
  MusicNetworksLegend,
  MusicNetworksSkeleton,
  MUSIC_NETWORKS,
  type MusicNetworkKey,
} from "./MusicNetworks"

// Listening Mode
export {
  ListeningModeIndicator,
  ListeningModeBadge,
} from "./ListeningModeIndicator"

// Pattern Detection
export {
  PatternBadge,
  PatternGrid,
  PatternList,
  TASTEID_PATTERNS,
  type PatternKey,
  type PatternCategory,
} from "./PatternBadges"

// Taste Consolidation
export {
  TasteConsolidation,
  ConsolidationSummary,
  type ConsolidationTrend,
} from "./TasteConsolidation"

// Polarity Score
export {
  PolarityScore,
  PolarityScoreBadge,
  calculatePolarityScore,
} from "./PolarityScore"
