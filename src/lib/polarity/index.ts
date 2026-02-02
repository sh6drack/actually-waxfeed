/**
 * Polarity OS - Main Export
 *
 * Cognitive modeling system for music taste analysis.
 * Ported from Polarity OS (https://github.com/taiscoding/polarity-os)
 */

// Cognitive Graph
export {
  CognitiveGraph,
  NODE_TYPES,
  EDGE_TYPES,
  type NodeType,
  type EdgeType,
  type CognitiveNode,
  type CognitiveEdge,
  type ImportanceScores,
  type PatternStatus,
} from './cognitive-graph'

// Pattern Learning
export {
  PatternLearningEngine,
  PATTERN_THRESHOLDS,
  type PatternState,
  type Observation,
  type ReviewData,
} from './pattern-learning'

// Drift Detection
export {
  DriftDetector,
  DRIFT_CONFIG,
  type DriftType,
  type DriftAlert,
  type ListeningSignature,
  type RatingStyle,
} from './drift-detection'

// Consolidation
export {
  ConsolidationEngine,
  CONSOLIDATION_CONFIG,
  type Episode,
  type EpisodeReview,
  type ConsolidatedTaste,
} from './consolidation'
