/**
 * TASTEID - Music Taste Fingerprint System
 * POLARITY 1.2 - Cognitive Modeling for Music
 *
 * Core algorithm for computing persistent taste profiles.
 * Connects WaxFeed to Polarity's CCX (Conversational Connectomics) research.
 * Taste graphs ARE knowledge graphs.
 *
 * Polarity 1.2 adds:
 * - Music Networks (like Yeo 7-Networks) - HOW you engage with music
 * - Listening Signature (like BrainID) - Your characteristic patterns
 * - Memory Architecture - Consolidation of taste over time
 * - Future Selves - Where your musical taste is heading
 */

import { prisma } from '@/lib/prisma'

// ============================================
// POLARITY 1.2 - MUSIC NETWORKS
// ============================================

/**
 * Music Networks - Analogous to Yeo 7-Network cognitive model
 * Each network represents a different mode of musical engagement
 */
export const MUSIC_NETWORKS = {
  DISCOVERY: {
    id: 'discovery',
    name: 'Discovery Mode',
    description: 'Active exploration, seeking new music',
    yeoAnalog: 'FP (Frontoparietal)',
    icon: '🔍',
  },
  COMFORT: {
    id: 'comfort',
    name: 'Comfort Mode',
    description: 'Returning to favorites, nostalgia',
    yeoAnalog: 'DMN (Default Mode)',
    icon: '🏠',
  },
  DEEP_DIVE: {
    id: 'deep_dive',
    name: 'Deep Dive Mode',
    description: 'Focused artist/genre exploration',
    yeoAnalog: 'DA (Dorsal Attention)',
    icon: '🎯',
  },
  REACTIVE: {
    id: 'reactive',
    name: 'Reactive Mode',
    description: 'Responding to trends, recommendations',
    yeoAnalog: 'VA (Ventral Attention)',
    icon: '📡',
  },
  EMOTIONAL: {
    id: 'emotional',
    name: 'Emotional Mode',
    description: 'Strong ratings, visceral reactions',
    yeoAnalog: 'LIM (Limbic)',
    icon: '💜',
  },
  SOCIAL: {
    id: 'social',
    name: 'Social Mode',
    description: 'Friend activity, community engagement',
    yeoAnalog: 'SMN (Somatomotor)',
    icon: '👥',
  },
  AESTHETIC: {
    id: 'aesthetic',
    name: 'Aesthetic Mode',
    description: 'Album art attraction, visual discovery',
    yeoAnalog: 'VIS (Visual)',
    icon: '🎨',
  },
} as const

export type MusicNetworkId = keyof typeof MUSIC_NETWORKS

export interface ListeningSignature {
  discovery: number    // 0-1 activation
  comfort: number
  deep_dive: number
  reactive: number
  emotional: number
  social: number
  aesthetic: number
}

export interface SignaturePattern {
  id: string
  name: string
  description: string
  networks: string[]  // Networks involved in the pattern
  strength: number    // 0-1 how strongly detected
}

export interface MemorableMoment {
  type: 'first_10' | 'first_0' | 'genre_discovery' | 'artist_revelation' | 'emotional_review'
  albumId: string
  albumTitle: string
  artistName: string
  rating?: number
  date: Date
  description?: string
}

export interface MusicalFutureSelf {
  id: string
  name: string
  description: string
  progress: number    // 0-1 how far along the path
  nextSteps: string[]
  relatedGenres: string[]
  relatedArtists: string[]
}

// ============================================
// ARCHETYPES - CCX POLARITY Aligned
// ============================================
// Each archetype includes a POLARITY profile based on music psychology research:
// - Russell's Circumplex Model (arousal, valence)
// - Rentfrow's MUSIC Model (authenticity)
// - Groove Theory (temporal)
// - Berlyne's Arousal Theory (novelty)
// See /docs/research/TASTEID-ARCHETYPES.md for full documentation

export const ARCHETYPES = {
  // ═══════════════════════════════════════════════════════════════
  // GENRE-BASED ARCHETYPES
  // Derived from dominant genre preferences
  // ═══════════════════════════════════════════════════════════════
  
  HIP_HOP_HEAD: {
    id: 'hip-hop-head',
    name: 'Hip-Hop Head',
    description: 'Lives and breathes hip-hop culture',
    genres: ['hip-hop', 'rap', 'trap', 'southern hip hop', 'east coast hip hop', 'west coast hip hop', 'drill', 'conscious rap', 'cloud rap'],
    icon: '🎤',
    // POLARITY dimension profile (0-1 scale, 0.5 = neutral)
    polarityProfile: {
      arousal: 0.75,      // High energy, driving beats
      valence: 0.5,       // Variable - both triumphant and dark
      texture: 0.6,       // Often gritty production
      temporal: 0.7,      // Groovy, pocket-focused
      novelty: 0.6,       // Innovation valued
      scale: 0.5,         // Variable scope
      authenticity: 0.85, // "Keeping it real" central to culture
      narrative: 0.7,     // Storytelling important
    },
  },
  
  JAZZ_EXPLORER: {
    id: 'jazz-explorer',
    name: 'Jazz Explorer',
    description: 'Drawn to improvisation and complexity',
    genres: ['jazz', 'jazz fusion', 'bebop', 'modal jazz', 'free jazz', 'contemporary jazz', 'nu jazz', 'acid jazz'],
    icon: '🎷',
    polarityProfile: {
      arousal: 0.5,       // Variable - cool to fiery
      valence: 0.55,      // Generally positive, contemplative
      texture: 0.7,       // Rich, lush arrangements
      temporal: 0.65,     // Complex rhythms, swing
      novelty: 0.75,      // Values innovation
      scale: 0.55,        // Often intimate
      authenticity: 0.7,  // Genuine expression valued
      narrative: 0.6,     // Abstract storytelling
    },
  },
  
  ROCK_PURIST: {
    id: 'rock-purist',
    name: 'Rock Purist',
    description: 'Guitar-driven music runs through their veins',
    genres: ['rock', 'classic rock', 'hard rock', 'alternative rock', 'indie rock', 'punk rock', 'grunge', 'post-punk', 'garage rock'],
    icon: '🎸',
    polarityProfile: {
      arousal: 0.7,       // Generally high energy
      valence: 0.6,       // Often triumphant
      texture: 0.7,       // Distorted, raw
      temporal: 0.6,      // Driving rhythms
      novelty: 0.45,      // Values tradition
      scale: 0.6,         // Stadium to garage
      authenticity: 0.85, // "Authentic" is paramount
      narrative: 0.5,     // Variable
    },
  },
  
  ELECTRONIC_PIONEER: {
    id: 'electronic-pioneer',
    name: 'Electronic Pioneer',
    description: 'Synths, beats, and futuristic sounds',
    genres: ['electronic', 'house', 'techno', 'ambient', 'edm', 'drum and bass', 'dubstep', 'synthwave', 'idm', 'trance'],
    icon: '🎹',
    polarityProfile: {
      arousal: 0.7,       // High for dance, low for ambient
      valence: 0.6,       // Often euphoric
      texture: 0.55,      // Crystalline production
      temporal: 0.85,     // Rhythm-centric, hypnotic
      novelty: 0.8,       // Innovation central
      scale: 0.65,        // Often epic/immersive
      authenticity: 0.4,  // Less focus on "realness"
      narrative: 0.5,     // Abstract
    },
  },
  
  SOUL_SEARCHER: {
    id: 'soul-searcher',
    name: 'Soul Searcher',
    description: 'Connects with music on an emotional level',
    genres: ['soul', 'r&b', 'neo soul', 'motown', 'funk', 'gospel', 'quiet storm', 'contemporary r&b', 'alternative r&b'],
    icon: '💜',
    polarityProfile: {
      arousal: 0.55,      // Moderate, groovy
      valence: 0.7,       // Generally warm, positive
      texture: 0.75,      // Lush, warm
      temporal: 0.7,      // Groovy, pocket
      novelty: 0.4,       // Classic sounds valued
      scale: 0.5,         // Intimate to church
      authenticity: 0.9,  // Soulfulness = authenticity
      narrative: 0.75,    // Confessional, emotional
    },
  },
  
  METAL_MAVEN: {
    id: 'metal-maven',
    name: 'Metal Maven',
    description: 'Heavy riffs and intense energy',
    genres: ['metal', 'heavy metal', 'death metal', 'black metal', 'thrash metal', 'metalcore', 'progressive metal', 'doom metal', 'power metal'],
    icon: '🤘',
    polarityProfile: {
      arousal: 0.95,      // Maximum intensity
      valence: 0.25,      // Dark, aggressive
      texture: 0.9,       // Heavy, distorted
      temporal: 0.7,      // Complex, often chaotic
      novelty: 0.6,       // Subgenre innovation
      scale: 0.8,         // Epic, visceral
      authenticity: 0.8,  // "Posers" rejected
      narrative: 0.6,     // Themes of darkness, fantasy
    },
  },
  
  INDIE_DEVOTEE: {
    id: 'indie-devotee',
    name: 'Indie Devotee',
    description: 'Champions the underground and obscure',
    genres: ['indie', 'indie pop', 'indie folk', 'lo-fi', 'bedroom pop', 'art pop', 'shoegaze', 'dream pop', 'post-rock'],
    icon: '🎧',
    polarityProfile: {
      arousal: 0.4,       // Often subdued
      valence: 0.5,       // Variable, often melancholic
      texture: 0.5,       // Lo-fi to lush
      temporal: 0.45,     // Often floating
      novelty: 0.75,      // Prizes uniqueness
      scale: 0.3,         // Intimate, personal
      authenticity: 0.8,  // Anti-mainstream stance
      narrative: 0.65,    // Personal stories
    },
  },
  
  POP_CONNOISSEUR: {
    id: 'pop-connoisseur',
    name: 'Pop Connoisseur',
    description: 'Appreciates craft in mainstream music',
    genres: ['pop', 'synth-pop', 'dance pop', 'electropop', 'k-pop', 'j-pop', 'art pop', 'hyperpop', 'bubblegum pop'],
    icon: '⭐',
    polarityProfile: {
      arousal: 0.65,      // Upbeat, energetic
      valence: 0.75,      // Positive, euphoric
      texture: 0.35,      // Polished, clean
      temporal: 0.7,      // Danceable, catchy
      novelty: 0.5,       // Trend-aware
      scale: 0.6,         // Stadium-ready
      authenticity: 0.35, // Production over rawness
      narrative: 0.6,     // Relatable themes
    },
  },
  
  COUNTRY_SOUL: {
    id: 'country-soul',
    name: 'Country Soul',
    description: 'Stories, twang, and heartland vibes',
    genres: ['country', 'americana', 'bluegrass', 'folk', 'country rock', 'outlaw country', 'alt-country', 'western', 'country pop'],
    icon: '🤠',
    polarityProfile: {
      arousal: 0.5,       // Moderate
      valence: 0.5,       // Heartbreak to celebration
      texture: 0.6,       // Organic, acoustic
      temporal: 0.55,     // Swinging rhythms
      novelty: 0.3,       // Traditional values
      scale: 0.5,         // Intimate to arena
      authenticity: 0.85, // "Real" stories central
      narrative: 0.9,     // Storytelling paramount
    },
  },
  
  CLASSICAL_MIND: {
    id: 'classical-mind',
    name: 'Classical Mind',
    description: 'Appreciates composition and orchestration',
    genres: ['classical', 'orchestral', 'chamber music', 'opera', 'contemporary classical', 'baroque', 'romantic era', 'minimalism'],
    icon: '🎻',
    polarityProfile: {
      arousal: 0.5,       // Wide range
      valence: 0.55,      // Often transcendent
      texture: 0.9,       // Lush, complex
      temporal: 0.45,     // Flowing, structured
      novelty: 0.5,       // Tradition and innovation
      scale: 0.85,        // Epic, cinematic
      authenticity: 0.6,  // Interpretation matters
      narrative: 0.8,     // Programmatic, emotional
    },
  },
  
  // ═══════════════════════════════════════════════════════════════
  // BEHAVIOR-BASED ARCHETYPES
  // Derived from listening and rating patterns
  // ═══════════════════════════════════════════════════════════════

  GENRE_FLUID: {
    id: 'genre-fluid',
    name: 'Genre Fluid',
    description: 'Refuses to be boxed in - listens to everything',
    genres: [],
    behavioral: true,
    icon: '🌈',
    detectionCriteria: {
      genreDiversityIndex: 0.8,    // Shannon entropy of genre distribution
      maxSingleGenreShare: 0.25,   // No genre > 25%
      adventurenessThreshold: 0.85,
    },
    polarityProfile: {
      arousal: 0.5,       // Neutral - enjoys all levels
      valence: 0.5,       // Open to all emotions
      texture: 0.5,       // No preference
      temporal: 0.5,      // All rhythms
      novelty: 0.7,       // Exploration-focused
      scale: 0.5,         // No preference
      authenticity: 0.5,  // No preference
      narrative: 0.5,     // No preference
    },
  },
  
  DECADE_DIVER: {
    id: 'decade-diver',
    name: 'Decade Diver',
    description: 'Obsessed with a specific era of music',
    genres: [],
    behavioral: true,
    icon: '⏰',
    detectionCriteria: {
      singleDecadeShare: 0.6,      // 60%+ in one decade
      eraLanguageInReviews: true,
      lowContemporaryEngagement: 0.2,
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.5,
      texture: 0.5,       // Era-dependent
      temporal: 0.5,
      novelty: 0.3,       // Nostalgic
      scale: 0.5,
      authenticity: 0.7,  // "They don't make 'em like they used to"
      narrative: 0.6,
    },
  },
  
  DEEP_CUTTER: {
    id: 'deep-cutter',
    name: 'Deep Cutter',
    description: 'Goes beyond the hits, finds the gems',
    genres: [],
    behavioral: true,
    icon: '💎',
    detectionCriteria: {
      nonSingleTrackShare: 0.7,
      obscureAlbumShare: 0.4,      // Albums with < 1000 reviews
      discoveryNetworkHigh: 0.7,
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.5,
      texture: 0.6,       // Often prefers raw
      temporal: 0.5,
      novelty: 0.8,       // Finds the new
      scale: 0.4,         // Prefers intimate
      authenticity: 0.75, // Values genuine
      narrative: 0.6,
    },
  },
  
  CHART_CHASER: {
    id: 'chart-chaser',
    name: 'Chart Chaser',
    description: 'Always on top of what\'s hot',
    genres: [],
    behavioral: true,
    icon: '📈',
    detectionCriteria: {
      chartingAlbumShare: 0.7,
      newReleaseVelocity: 0.8,
      reactiveNetworkHigh: 0.7,
    },
    polarityProfile: {
      arousal: 0.65,
      valence: 0.65,
      texture: 0.4,       // Polished production
      temporal: 0.65,     // Danceable, current
      novelty: 0.6,       // Current trends
      scale: 0.6,
      authenticity: 0.4,
      narrative: 0.55,
    },
  },
  
  THE_CRITIC: {
    id: 'the-critic',
    name: 'The Critic',
    description: 'High standards, few 10s given',
    genres: [],
    behavioral: true,
    icon: '🧐',
    detectionCriteria: {
      averageRating: 6.0,          // Below average
      perfectScoreShare: 0.05,     // < 5% are 10s
      ratingStdDev: 1.5,           // Consistent standards
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.4,       // More negative reviews
      texture: 0.6,       // Values craft
      temporal: 0.5,
      novelty: 0.6,       // Appreciates innovation
      scale: 0.5,
      authenticity: 0.7,  // Values genuine artistry
      narrative: 0.65,    // Analytical
    },
  },
  
  THE_ENTHUSIAST: {
    id: 'the-enthusiast',
    name: 'The Enthusiast',
    description: 'Finds joy in almost everything',
    genres: [],
    behavioral: true,
    icon: '🎉',
    detectionCriteria: {
      averageRating: 7.5,          // Above average
      highScoreShare: 0.4,         // 40%+ are 8+
      positiveLanguage: 0.7,
    },
    polarityProfile: {
      arousal: 0.6,
      valence: 0.8,       // Positive orientation
      texture: 0.5,
      temporal: 0.6,
      novelty: 0.55,
      scale: 0.55,
      authenticity: 0.5,
      narrative: 0.5,
    },
  },
  
  ESSAY_WRITER: {
    id: 'essay-writer',
    name: 'Essay Writer',
    description: 'Reviews are mini dissertations',
    genres: [],
    behavioral: true,
    icon: '📝',
    detectionCriteria: {
      avgReviewLength: 300,        // Words
      paragraphStructure: true,
      crossReferences: true,
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.5,
      texture: 0.6,       // Notices production
      temporal: 0.55,
      novelty: 0.6,
      scale: 0.55,
      authenticity: 0.65,
      narrative: 0.85,    // Strong narrative focus
    },
  },
  
  ALBUM_ARCHAEOLOGIST: {
    id: 'album-archaeologist',
    name: 'Album Archaeologist',
    description: 'Digs into music history',
    genres: [],
    behavioral: true,
    icon: '🏛️',
    detectionCriteria: {
      oldAlbumShare: 0.5,          // 50%+ > 20 years old
      chronologicalExploration: true,
      historicalContext: true,
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.55,
      texture: 0.6,       // Appreciates analog
      temporal: 0.5,
      novelty: 0.25,      // Highly nostalgic
      scale: 0.55,
      authenticity: 0.75,
      narrative: 0.7,     // Historical context
    },
  },
  
  NEW_RELEASE_HUNTER: {
    id: 'new-release-hunter',
    name: 'New Release Hunter',
    description: 'First to review the latest drops',
    genres: [],
    behavioral: true,
    icon: '🆕',
    detectionCriteria: {
      recentReleaseShare: 0.8,     // 80%+ within 30 days of release
      firstSpinBadges: 5,
      reactiveNetworkDominant: true,
    },
    polarityProfile: {
      arousal: 0.6,
      valence: 0.6,
      texture: 0.5,
      temporal: 0.6,
      novelty: 0.85,      // Maximum novelty seeking
      scale: 0.5,
      authenticity: 0.5,
      narrative: 0.5,
    },
  },
  
  TASTE_TWIN_SEEKER: {
    id: 'taste-twin-seeker',
    name: 'Taste Twin Seeker',
    description: 'Always comparing and connecting with others',
    genres: [],
    behavioral: true,
    icon: '👯',
    detectionCriteria: {
      profileViews: 50,
      tasteComparisons: 20,
      socialFeaturesUsage: 0.8,
    },
    polarityProfile: {
      arousal: 0.55,
      valence: 0.6,
      texture: 0.5,
      temporal: 0.55,
      novelty: 0.5,
      scale: 0.5,
      authenticity: 0.5,
      narrative: 0.55,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // MOOD-BASED ARCHETYPES (Nathan's request)
  // Derived from vocabulary analysis and rating patterns
  // ═══════════════════════════════════════════════════════════════

  MOOD_CURATOR: {
    id: 'mood-curator',
    name: 'Mood Curator',
    description: 'Chooses music based on emotional state and vibe',
    genres: [],
    behavioral: true,
    icon: '🎭',
    detectionCriteria: {
      emotionalIntensity: 0.7,
      moodWordsInReviews: true,
      vibeBasedRatings: true,
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.65,
      texture: 0.5,
      temporal: 0.5,
      novelty: 0.4,
      scale: 0.5,
      authenticity: 0.6,
      narrative: 0.7,
    },
  },

  SONIC_ESCAPIST: {
    id: 'sonic-escapist',
    name: 'Sonic Escapist',
    description: 'Uses music to transport to other worlds',
    genres: ['ambient', 'electronic', 'dream pop', 'shoegaze', 'post-rock'],
    behavioral: true,
    icon: '🌌',
    detectionCriteria: {
      atmosphericGenreShare: 0.5,
      transportiveLanguage: true,
      immersiveListening: true,
    },
    polarityProfile: {
      arousal: 0.35,
      valence: 0.5,
      texture: 0.7,
      temporal: 0.4,
      novelty: 0.6,
      scale: 0.8,
      authenticity: 0.5,
      narrative: 0.45,
    },
  },

  ENERGY_SEEKER: {
    id: 'energy-seeker',
    name: 'Energy Seeker',
    description: 'Gravitates towards high-energy, hype music',
    genres: ['edm', 'trap', 'metal', 'punk', 'hardcore'],
    behavioral: true,
    icon: '⚡',
    detectionCriteria: {
      highEnergyGenreShare: 0.6,
      hypeLanguage: true,
      highTempoPreference: true,
    },
    polarityProfile: {
      arousal: 0.9,
      valence: 0.7,
      texture: 0.6,
      temporal: 0.8,
      novelty: 0.5,
      scale: 0.7,
      authenticity: 0.5,
      narrative: 0.4,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // WRITING-STYLE ARCHETYPES (Nathan's request)
  // Derived from vocabulary profile analysis
  // ═══════════════════════════════════════════════════════════════

  THE_POET: {
    id: 'the-poet',
    name: 'The Poet',
    description: 'Writes beautifully crafted, evocative reviews',
    genres: [],
    behavioral: true,
    icon: '✨',
    detectionCriteria: {
      writingStyle: 'poetic',
      avgReviewLength: 150,
      emotionalIntensity: 0.7,
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.6,
      texture: 0.6,
      temporal: 0.5,
      novelty: 0.55,
      scale: 0.5,
      authenticity: 0.7,
      narrative: 0.85,
    },
  },

  THE_TECHNICIAN: {
    id: 'the-technician',
    name: 'The Technician',
    description: 'Analyzes production, mixing, and sonic details',
    genres: [],
    behavioral: true,
    icon: '🔧',
    detectionCriteria: {
      writingStyle: 'technical',
      musicVocabulary: 0.6,
      productionLanguage: true,
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.5,
      texture: 0.7,
      temporal: 0.5,
      novelty: 0.5,
      scale: 0.5,
      authenticity: 0.6,
      narrative: 0.4,
    },
  },

  THE_STORYTELLER: {
    id: 'the-storyteller',
    name: 'The Storyteller',
    description: 'Connects music to personal experiences and memories',
    genres: [],
    behavioral: true,
    icon: '📖',
    detectionCriteria: {
      personalConnection: 0.7,
      narrativeLanguage: true,
      memoryReferences: true,
    },
    polarityProfile: {
      arousal: 0.5,
      valence: 0.6,
      texture: 0.5,
      temporal: 0.5,
      novelty: 0.4,
      scale: 0.5,
      authenticity: 0.75,
      narrative: 0.9,
    },
  },
} as const

export type ArchetypeId = keyof typeof ARCHETYPES

// ============================================
// TYPES
// ============================================

export interface GenreVector {
  [genre: string]: number // 0-1 affinity score
}

export interface ArtistDNA {
  artistName: string
  weight: number // 0-1 importance
  avgRating: number
  reviewCount: number
}

export interface DecadePreferences {
  [decade: string]: number // 0-1 preference
}

export interface TasteIDComputation {
  genreVector: GenreVector
  artistDNA: ArtistDNA[]
  decadePreferences: DecadePreferences
  primaryArchetype: string
  secondaryArchetype: string | null
  archetypeConfidence: number
  adventurenessScore: number
  ratingSkew: 'harsh' | 'lenient' | 'balanced'
  averageRating: number
  ratingStdDev: number
  reviewDepth: 'rater' | 'writer' | 'essayist'
  reviewCount: number
  avgReviewLength: number
  topGenres: string[]
  topArtists: string[]
  signatureAlbums: string[]
  polarityScore: number

  // Polarity 1.2 fields
  listeningSignature: ListeningSignature
  signaturePatterns: string[]
  memorableMoments: MemorableMoment[]
  futureSelvesMusic: MusicalFutureSelf[]
  polarityScore2: number

  // Track-level data
  trackDepthData: TrackDepthData

  // Vocabulary Analysis (NEW)
  vocabularyProfile: VocabularyProfile
}

// Vocabulary analysis from review text
export interface VocabularyProfile {
  writingStyle: 'technical' | 'emotional' | 'casual' | 'poetic' | 'analytical'
  dominantMood: 'positive' | 'negative' | 'neutral' | 'mixed'
  keyDescriptors: string[]      // Most used descriptive words
  musicVocabulary: number       // 0-1: how much music-specific vocabulary
  emotionalIntensity: number    // 0-1: how emotionally charged reviews are
  criticalDepth: number         // 0-1: how analytical/critical
  personalConnection: number    // 0-1: how personally they relate to music
}

interface TrackDepthData {
  totalTracksRated: number
  albumsWithTracks: number
  averageTrackCompletion: number
  completedAlbums: number
  deepDiveScore: number
  favoriteTracksCount: number
  trackRatingVariance: number
  highlightGenres: string[]
}

interface ReviewWithAlbum {
  id: string
  rating: number
  text: string | null
  createdAt: Date
  album: {
    id: string
    genres: string[]
    artistName: string
    releaseDate: Date
    title: string
    averageRating: number | null
    totalReviews: number
  }
}

// ============================================
// COMPUTATION ENGINE
// ============================================

/**
 * Compute a user's complete TasteID from their reviews
 */
export async function computeTasteID(userId: string): Promise<TasteIDComputation | null> {
  // Fetch all user reviews with album data
  const [reviews, trackReviews] = await Promise.all([
    prisma.review.findMany({
      where: { userId },
      include: {
        album: {
          select: {
            id: true,
            genres: true,
            artistName: true,
            releaseDate: true,
            title: true,
            averageRating: true,
            totalReviews: true,
            _count: { select: { tracks: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    // Fetch track reviews for deeper analysis
    prisma.trackReview.findMany({
      where: { userId },
      include: {
        track: {
          select: {
            id: true,
            name: true,
            albumId: true,
            album: {
              select: {
                id: true,
                genres: true,
                artistName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  if (reviews.length === 0) {
    return null
  }

  // Compute track depth (how thoroughly users explore albums)
  const trackDepthData = computeTrackDepth(reviews, trackReviews)

  // Apply recency weighting - more recent reviews matter more
  const weightedReviews = applyRecencyWeighting(reviews)

  // 1. Compute genre vector
  const genreVector = computeGenreVector(weightedReviews)

  // 2. Compute artist DNA
  const artistDNA = computeArtistDNA(weightedReviews)

  // 3. Compute decade preferences
  const decadePreferences = computeDecadePreferences(weightedReviews)

  // 4. Rating analysis
  const ratings = reviews.map(r => r.rating)
  const averageRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
  const ratingStdDev = Math.sqrt(
    ratings.reduce((sum, r) => sum + Math.pow(r - averageRating, 2), 0) / ratings.length
  )
  const ratingSkew = getRatingSkew(averageRating)

  // 5. Review depth analysis
  const reviewLengths = reviews.map(r => (r.text?.split(/\s+/).length || 0))
  const avgReviewLength = reviewLengths.reduce((a, b) => a + b, 0) / reviewLengths.length
  const reviewDepth = getReviewDepth(avgReviewLength)

  // 5.5. Vocabulary/Word Analysis (NEW - Nathan's request)
  const vocabularyProfile = computeVocabularyProfile(reviews)

  // 6. Adventureness score (genre diversity)
  const adventurenessScore = computeAdventurenessScore(genreVector)

  // 7. Classify archetype
  const { primary, secondary, confidence } = classifyArchetype(
    genreVector,
    adventurenessScore,
    ratingSkew,
    reviewDepth,
    avgReviewLength,
    reviews
  )

  // 8. Extract display data
  const topGenres = Object.entries(genreVector)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([genre]) => genre)

  const topArtists = artistDNA
    .slice(0, 10)
    .map(a => a.artistName)

  // 9. Find signature albums (highly rated, distinctly theirs)
  const signatureAlbums = findSignatureAlbums(reviews)

  // 10. Compute Polarity Score (Bayesian edge strength)
  const polarityScore = computePolarityScore(reviews, genreVector, adventurenessScore)

  // ============================================
  // POLARITY 1.2 COMPUTATIONS
  // ============================================

  // 11. Compute Listening Signature (like BrainID)
  const listeningSignature = computeListeningSignature(reviews)

  // 12. Detect Signature Patterns
  const signaturePatterns = detectSignaturePatterns(reviews, listeningSignature)

  // 13. Extract Memorable Moments (Episodic Memory)
  const memorableMoments = extractMemorableMoments(reviews)

  // 14. Detect Musical Future Selves (Prospective Memory)
  const futureSelvesMusic = detectMusicalFutureSselves(reviews, genreVector)

  // 15. Compute Polarity Score 2.0 (Enhanced with cognitive factors)
  const polarityScore2 = computePolarityScore2(reviews, listeningSignature, signaturePatterns, polarityScore)

  return {
    genreVector,
    artistDNA,
    decadePreferences,
    primaryArchetype: primary,
    secondaryArchetype: secondary,
    archetypeConfidence: confidence,
    adventurenessScore,
    ratingSkew,
    averageRating,
    ratingStdDev,
    reviewDepth,
    reviewCount: reviews.length,
    avgReviewLength: Math.round(avgReviewLength),
    topGenres,
    topArtists,
    signatureAlbums,
    polarityScore,

    // Polarity 1.2
    listeningSignature,
    signaturePatterns,
    memorableMoments,
    futureSelvesMusic,
    polarityScore2,

    // Track-level data
    trackDepthData,

    // Vocabulary Analysis
    vocabularyProfile,
  }
}

/**
 * Apply recency weighting - recent reviews weighted more heavily
 */
function applyRecencyWeighting(reviews: ReviewWithAlbum[]): Array<ReviewWithAlbum & { weight: number }> {
  const now = new Date()
  const maxAge = 365 * 2 // 2 years for decay

  return reviews.map(review => {
    const ageInDays = (now.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    // Exponential decay with half-life of 180 days
    const weight = Math.exp(-ageInDays / 180)
    // Bonus for written reviews (stronger signal)
    const textBonus = review.text && review.text.length > 50 ? 1.3 : 1
    return { ...review, weight: weight * textBonus }
  })
}

/**
 * Analyze vocabulary and writing style from review text
 * This reveals how users think about and describe music
 */
function computeVocabularyProfile(reviews: ReviewWithAlbum[]): VocabularyProfile {
  // Collect all review text
  const allText = reviews
    .filter(r => r.text && r.text.length > 10)
    .map(r => r.text!.toLowerCase())
    .join(' ')

  if (allText.length < 50) {
    return {
      writingStyle: 'casual',
      dominantMood: 'neutral',
      keyDescriptors: [],
      musicVocabulary: 0,
      emotionalIntensity: 0,
      criticalDepth: 0,
      personalConnection: 0,
    }
  }

  const words = allText.split(/\s+/)
  const wordCount = words.length

  // Music vocabulary detection
  const technicalTerms = ['production', 'mixing', 'mastering', 'arrangement', 'composition',
    'instrumentation', 'tempo', 'rhythm', 'harmony', 'melody', 'vocals', 'bass', 'drums',
    'synth', 'sample', 'beat', 'flow', 'cadence', 'crescendo', 'hook', 'bridge', 'verse',
    'chorus', 'layered', 'texture', 'sonic', 'frequencies', 'dynamics']

  const emotionalTerms = ['feel', 'feeling', 'emotion', 'emotional', 'vibe', 'vibes', 'mood',
    'soul', 'heart', 'love', 'hate', 'beautiful', 'amazing', 'incredible', 'powerful',
    'haunting', 'moving', 'touching', 'raw', 'intense', 'passionate', 'deeply']

  const analyticalTerms = ['because', 'however', 'although', 'therefore', 'compared',
    'contrast', 'similar', 'different', 'better', 'worse', 'influence', 'influenced',
    'reminds', 'reference', 'callback', 'evolution', 'progression', 'growth']

  const personalTerms = ['i', 'me', 'my', 'personally', 'reminds me', 'makes me',
    'i feel', 'i think', 'i love', 'i hate', 'for me', 'to me']

  const positiveTerms = ['great', 'good', 'amazing', 'incredible', 'beautiful', 'perfect',
    'masterpiece', 'classic', 'brilliant', 'genius', 'love', 'excellent', 'fantastic', 'fire', 'goat']

  const negativeTerms = ['bad', 'terrible', 'awful', 'boring', 'mid', 'mediocre', 'disappointing',
    'weak', 'forgettable', 'generic', 'trash', 'skip', 'overrated', 'underwhelming']

  // Count occurrences
  const countMatches = (terms: string[]) =>
    terms.reduce((count, term) => count + (allText.match(new RegExp(`\\b${term}\\b`, 'gi'))?.length || 0), 0)

  const technicalCount = countMatches(technicalTerms)
  const emotionalCount = countMatches(emotionalTerms)
  const analyticalCount = countMatches(analyticalTerms)
  const personalCount = countMatches(personalTerms)
  const positiveCount = countMatches(positiveTerms)
  const negativeCount = countMatches(negativeTerms)

  // Calculate metrics (normalized 0-1)
  const musicVocabulary = Math.min(1, technicalCount / (wordCount * 0.02))
  const emotionalIntensity = Math.min(1, emotionalCount / (wordCount * 0.015))
  const criticalDepth = Math.min(1, analyticalCount / (wordCount * 0.01))
  const personalConnection = Math.min(1, personalCount / (wordCount * 0.03))

  // Determine writing style
  let writingStyle: VocabularyProfile['writingStyle'] = 'casual'
  const maxScore = Math.max(technicalCount, emotionalCount, analyticalCount)
  if (maxScore === technicalCount && technicalCount > 5) writingStyle = 'technical'
  else if (maxScore === emotionalCount && emotionalCount > 5) writingStyle = 'emotional'
  else if (maxScore === analyticalCount && analyticalCount > 5) writingStyle = 'analytical'
  else if (emotionalIntensity > 0.5 && musicVocabulary > 0.3) writingStyle = 'poetic'

  // Determine dominant mood
  let dominantMood: VocabularyProfile['dominantMood'] = 'neutral'
  if (positiveCount > negativeCount * 2) dominantMood = 'positive'
  else if (negativeCount > positiveCount * 2) dominantMood = 'negative'
  else if (positiveCount > 3 && negativeCount > 3) dominantMood = 'mixed'

  // Extract key descriptors (most used adjectives/descriptors)
  const descriptorCandidates = [...technicalTerms, ...emotionalTerms, 'fire', 'classic', 'mid', 'solid', 'smooth', 'hard', 'soft', 'dark', 'bright', 'heavy', 'light', 'chill', 'hype']
  const keyDescriptors = descriptorCandidates
    .map(term => ({ term, count: (allText.match(new RegExp(`\\b${term}\\b`, 'gi'))?.length || 0) }))
    .filter(d => d.count >= 2)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
    .map(d => d.term)

  return {
    writingStyle,
    dominantMood,
    keyDescriptors,
    musicVocabulary,
    emotionalIntensity,
    criticalDepth,
    personalConnection,
  }
}

/**
 * Compute track depth - how thoroughly users explore albums they review
 * This reveals engagement style: surface listener vs deep diver
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeTrackDepth(reviews: any[], trackReviews: any[]): TrackDepthData {
  if (trackReviews.length === 0) {
    return {
      totalTracksRated: 0,
      albumsWithTracks: 0,
      averageTrackCompletion: 0,
      completedAlbums: 0,
      deepDiveScore: 0,
      favoriteTracksCount: 0,
      trackRatingVariance: 0,
      highlightGenres: [],
    }
  }

  // Group track reviews by album
  const tracksByAlbum = new Map<string, typeof trackReviews>()
  for (const tr of trackReviews) {
    const albumId = tr.track.albumId
    if (!tracksByAlbum.has(albumId)) {
      tracksByAlbum.set(albumId, [])
    }
    tracksByAlbum.get(albumId)!.push(tr)
  }

  // Calculate completion per album
  const albumCompletions: number[] = []
  let completedAlbums = 0
  const genreTrackCounts = new Map<string, number>()

  for (const review of reviews) {
    const albumId = review.album.id
    const albumTracks = tracksByAlbum.get(albumId) || []
    const totalTracks = review.album._count?.tracks || 0
    
    if (totalTracks > 0) {
      const completion = albumTracks.length / totalTracks
      albumCompletions.push(completion)
      
      if (completion >= 1) {
        completedAlbums++
      }

      // Track which genres get deep dives
      if (completion > 0.5) {
        for (const genre of review.album.genres || []) {
          genreTrackCounts.set(genre, (genreTrackCounts.get(genre) || 0) + albumTracks.length)
        }
      }
    }
  }

  const averageTrackCompletion = albumCompletions.length > 0
    ? albumCompletions.reduce((a, b) => a + b, 0) / albumCompletions.length
    : 0

  // Calculate rating variance within albums (shows discernment)
  let totalVariance = 0
  let varianceCount = 0
  for (const [, tracks] of tracksByAlbum) {
    if (tracks.length >= 3) {
      const ratings = tracks.map(t => t.rating)
      const mean = ratings.reduce((a, b) => a + b, 0) / ratings.length
      const variance = ratings.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / ratings.length
      totalVariance += Math.sqrt(variance)
      varianceCount++
    }
  }
  const trackRatingVariance = varianceCount > 0 ? totalVariance / varianceCount : 0

  // Favorite tracks
  const favoriteTracksCount = trackReviews.filter(tr => tr.isFavorite).length

  // Highlight genres (top 3 genres by track count)
  const highlightGenres = [...genreTrackCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([genre]) => genre)

  // Deep dive score (composite)
  const deepDiveScore = Math.min(1, (
    (averageTrackCompletion * 0.4) +
    (Math.min(completedAlbums / Math.max(reviews.length, 1), 1) * 0.3) +
    (Math.min(trackRatingVariance / 3, 1) * 0.15) + // Higher variance = more discerning
    (Math.min(trackReviews.length / (reviews.length * 8), 1) * 0.15) // Track reviews vs album reviews
  ))

  return {
    totalTracksRated: trackReviews.length,
    albumsWithTracks: tracksByAlbum.size,
    averageTrackCompletion,
    completedAlbums,
    deepDiveScore,
    favoriteTracksCount,
    trackRatingVariance,
    highlightGenres,
  }
}

/**
 * Compute genre affinity vector
 */
function computeGenreVector(reviews: Array<ReviewWithAlbum & { weight: number }>): GenreVector {
  const genreScores: Record<string, { total: number; count: number }> = {}

  for (const review of reviews) {
    for (const genre of review.album.genres) {
      const normalizedGenre = genre.toLowerCase()
      if (!genreScores[normalizedGenre]) {
        genreScores[normalizedGenre] = { total: 0, count: 0 }
      }
      // Weight by both recency and rating
      const ratingFactor = review.rating / 10 // 0-1
      genreScores[normalizedGenre].total += review.weight * ratingFactor
      genreScores[normalizedGenre].count += review.weight
    }
  }

  // Normalize to 0-1 scale
  const maxScore = Math.max(...Object.values(genreScores).map(g => g.total / g.count), 0.001)
  const vector: GenreVector = {}

  for (const [genre, { total, count }] of Object.entries(genreScores)) {
    vector[genre] = (total / count) / maxScore
  }

  return vector
}

/**
 * Compute artist DNA - top defining artists
 */
function computeArtistDNA(reviews: Array<ReviewWithAlbum & { weight: number }>): ArtistDNA[] {
  const artistScores: Record<string, { totalWeight: number; totalRating: number; count: number }> = {}

  for (const review of reviews) {
    const artist = review.album.artistName
    if (!artistScores[artist]) {
      artistScores[artist] = { totalWeight: 0, totalRating: 0, count: 0 }
    }
    artistScores[artist].totalWeight += review.weight
    artistScores[artist].totalRating += review.rating
    artistScores[artist].count += 1
  }

  const artists = Object.entries(artistScores)
    .map(([artistName, data]) => ({
      artistName,
      weight: data.totalWeight,
      avgRating: data.totalRating / data.count,
      reviewCount: data.count,
    }))
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 20)

  // Normalize weights
  const maxWeight = Math.max(...artists.map(a => a.weight), 0.001)
  return artists.map(a => ({
    ...a,
    weight: a.weight / maxWeight,
  }))
}

/**
 * Compute decade preferences
 */
function computeDecadePreferences(reviews: Array<ReviewWithAlbum & { weight: number }>): DecadePreferences {
  const decadeScores: Record<string, { total: number; count: number }> = {}

  for (const review of reviews) {
    const year = new Date(review.album.releaseDate).getFullYear()
    const decade = `${Math.floor(year / 10) * 10}s`
    if (!decadeScores[decade]) {
      decadeScores[decade] = { total: 0, count: 0 }
    }
    decadeScores[decade].total += review.weight * (review.rating / 10)
    decadeScores[decade].count += review.weight
  }

  const maxScore = Math.max(...Object.values(decadeScores).map(d => d.total / d.count), 0.001)
  const preferences: DecadePreferences = {}

  for (const [decade, { total, count }] of Object.entries(decadeScores)) {
    preferences[decade] = (total / count) / maxScore
  }

  return preferences
}

/**
 * Determine rating skew
 */
function getRatingSkew(averageRating: number): 'harsh' | 'lenient' | 'balanced' {
  if (averageRating < 5.5) return 'harsh'
  if (averageRating > 7.5) return 'lenient'
  return 'balanced'
}

/**
 * Determine review depth
 */
function getReviewDepth(avgWordCount: number): 'rater' | 'writer' | 'essayist' {
  if (avgWordCount < 20) return 'rater'
  if (avgWordCount < 100) return 'writer'
  return 'essayist'
}

/**
 * Compute adventureness score (how diverse is their taste)
 */
// ============================================
// GENRE FAMILIES - Musicological Taxonomy
// ============================================
// Based on AllMusic/Discogs genre trees and musicological relationships
// Reference: Pachet & Cazaly (2000), Aucouturier & Pachet (2003)
//
// Key principle: Genres in the same family share musical DNA (instrumentation,
// harmonic language, rhythmic patterns, cultural lineage)

const GENRE_FAMILIES: Record<string, string[]> = {
  // R&B/Soul Family - African American vocal tradition, emphasis on groove and emotion
  // Lineage: Gospel → Soul → R&B → Contemporary variants
  'r&b-soul': [
    // Core
    'r&b', 'soul', 'rhythm and blues',
    // Classic era
    'motown', 'philadelphia soul', 'southern soul', 'memphis soul',
    // Funk crossover
    'funk', 'p-funk', 'boogie',
    // Gospel roots
    'gospel', 'contemporary gospel',
    // Modern R&B (80s-90s)
    'new jack swing', 'quiet storm', 'contemporary r&b',
    // Neo-soul movement (late 90s-2000s)
    'neo soul', 'neo-soul',
    // Current R&B subgenres
    'alternative r&b', 'alt r&b', 'dark r&b', 'trap soul', 'pnb r&b',
    // Regional
    'uk r&b',
  ],
  
  // Hip-Hop Family - Rap, sampling, breakbeats
  // Lineage: Funk/Disco breaks → Old School → Regional styles → Modern
  'hip-hop': [
    // Core
    'hip-hop', 'hip hop', 'rap',
    // Old school
    'old school hip hop', 'electro',
    // Regional (Golden Era)
    'east coast hip hop', 'west coast hip hop', 'southern hip hop',
    'dirty south', 'crunk', 'bounce', 'chopped and screwed',
    // Subgenres
    'gangsta rap', 'g-funk', 'boom bap', 'conscious rap', 'political hip hop',
    // Modern
    'trap', 'drill', 'uk drill', 'chicago drill',
    'cloud rap', 'mumble rap', 'emo rap', 'melodic rap',
    'plugg', 'rage', 'hyperpop rap',
    // Underground
    'underground hip hop', 'abstract hip hop',
  ],
  
  // Rock Family - Guitar-driven, Western popular music tradition
  // Lineage: Blues → Rock & Roll → Classic Rock → Fragmentation
  'rock': [
    // Foundations
    'rock', 'rock and roll', 'rock & roll',
    // Classic era
    'classic rock', 'hard rock', 'blues rock', 'southern rock',
    'psychedelic rock', 'acid rock', 'progressive rock', 'art rock',
    'glam rock', 'arena rock',
    // Punk lineage
    'punk', 'punk rock', 'hardcore punk', 'post-punk', 'new wave',
    'post-punk revival',
    // Alternative era (80s-90s)
    'alternative rock', 'alt rock', 'grunge', 'britpop',
    'noise rock', 'industrial rock',
    // Indie rock
    'indie rock', 'garage rock', 'garage rock revival',
    // Soft/acoustic
    'soft rock', 'power pop', 'jangle pop',
    // Modern
    'post-rock', 'math rock', 'stoner rock', 'desert rock',
  ],
  
  // Electronic/Dance Family - Synthesized, beat-driven, club culture
  // Lineage: Disco → House/Techno → Fragmentation
  'electronic': [
    // Core
    'electronic', 'electronica', 'edm',
    // House family
    'house', 'deep house', 'tech house', 'progressive house',
    'electro house', 'tropical house', 'future house',
    // Techno family
    'techno', 'detroit techno', 'minimal techno', 'acid techno',
    // UK sounds
    'uk garage', 'garage', '2-step', 'grime', 'dubstep', 'brostep',
    'drum and bass', 'jungle', 'breakbeat', 'big beat',
    // Trance
    'trance', 'psytrance', 'progressive trance', 'uplifting trance',
    // Bass music
    'bass', 'future bass', 'trap edm', 'riddim',
    // Ambient/experimental
    'ambient', 'downtempo', 'chillout', 'idm', 'glitch',
    // Synth-based
    'synthwave', 'retrowave', 'darksynth', 'vaporwave',
    // Other
    'hardstyle', 'happy hardcore', 'gabber',
  ],
  
  // Pop Family - Mainstream appeal, hook-driven, commercial
  // Note: Many crossovers, but these are primarily "pop" in intent
  'pop': [
    // Core
    'pop', 'pop music',
    // Synth-pop era
    'synth-pop', 'synthpop', 'new wave', 'electropop',
    // Dance-pop
    'dance pop', 'dance-pop', 'eurodance', 'europop',
    // Art/experimental pop
    'art pop', 'baroque pop', 'chamber pop',
    // Modern
    'indie pop', 'dream pop', 'bedroom pop',
    'hyperpop', 'pc music',
    // Teen/bubblegum
    'bubblegum pop', 'teen pop',
    // Power/adult
    'power pop', 'adult contemporary',
    // Regional pop
    'j-pop', 'c-pop', 'cantopop', 'mandopop',
  ],
  
  // K-Pop - Separate family due to distinct industrial/cultural system
  // Has pop, hip-hop, R&B, EDM elements but unique production style
  'k-pop': [
    'k-pop', 'kpop', 'korean pop',
    'k-hip hop', 'k-r&b', 'k-rock',
    'korean r&b', 'korean hip hop',
  ],
  
  // Metal Family - Heavy, distorted, extreme
  // Lineage: Hard Rock/Blues Rock → Heavy Metal → Extreme subgenres
  'metal': [
    // Core
    'metal', 'heavy metal',
    // Classic subgenres
    'thrash metal', 'speed metal', 'power metal',
    // Extreme metal
    'death metal', 'black metal', 'doom metal', 'sludge metal',
    'grindcore', 'deathcore', 'blackgaze',
    // Progressive/technical
    'progressive metal', 'djent', 'technical death metal',
    // Crossover
    'metalcore', 'mathcore', 'nu metal', 'groove metal',
    'industrial metal', 'gothic metal',
    // Symphonic
    'symphonic metal', 'folk metal', 'viking metal',
  ],
  
  // Jazz Family - Improvisation, swing, harmonic sophistication
  // Lineage: Ragtime → Swing → Bebop → Modal → Free → Fusion
  'jazz': [
    // Core
    'jazz',
    // Historical styles
    'traditional jazz', 'dixieland', 'swing', 'big band',
    // Bebop era
    'bebop', 'hard bop', 'cool jazz', 'west coast jazz',
    // Modal/free
    'modal jazz', 'free jazz', 'avant-garde jazz',
    // Fusion
    'jazz fusion', 'jazz-funk', 'jazz-rock',
    // Contemporary
    'contemporary jazz', 'smooth jazz', 'nu jazz',
    'acid jazz', 'jazz rap',
    // European
    'ecm style', 'nordic jazz',
  ],
  
  // Country/Americana Family - American roots, storytelling
  // Lineage: Folk/Blues → Honky Tonk → Nashville → Modern
  'country-folk': [
    // Country
    'country', 'country music',
    'classic country', 'honky tonk', 'outlaw country',
    'country rock', 'southern rock',
    'alt-country', 'americana', 'roots rock',
    'bro-country', 'country pop', 'country rap',
    // Bluegrass
    'bluegrass', 'newgrass', 'progressive bluegrass',
    // Folk
    'folk', 'folk rock', 'contemporary folk', 'singer-songwriter',
    'indie folk', 'freak folk', 'psych folk',
    // Traditional American
    'appalachian', 'western', 'western swing',
  ],
  
  // Classical/Orchestral Family - Western art music tradition
  'classical': [
    // Historical periods
    'classical', 'classical music',
    'baroque', 'romantic', 'impressionist',
    // Forms
    'orchestral', 'symphony', 'chamber music', 'choral',
    'opera', 'operetta', 'lieder',
    // Modern
    'contemporary classical', 'modern classical',
    'minimalism', 'post-minimalism', 'spectralism',
    'neoclassical', 'neo-romantic',
    // Crossover
    'crossover classical', 'new age', 'ambient classical',
  ],
  
  // Latin Family - Spanish/Portuguese language music traditions
  'latin': [
    // Reggaeton/Urbano
    'reggaeton', 'latin trap', 'urbano',
    // Latin pop
    'latin pop', 'latin rock',
    // Caribbean
    'salsa', 'merengue', 'bachata', 'cumbia',
    // Brazilian
    'bossa nova', 'mpb', 'samba', 'tropicalia', 'baile funk',
    // Regional Mexican
    'regional mexican', 'norteño', 'banda', 'corrido', 'mariachi',
    'corridos tumbados',
    // Other
    'latin jazz', 'latin soul', 'chicano soul',
  ],
  
  // African/Caribbean Family - African diaspora sounds
  'african-caribbean': [
    // African
    'afrobeats', 'afropop', 'afro-fusion',
    'highlife', 'juju', 'fuji', 'amapiano',
    'afrohouse', 'gqom',
    // Caribbean
    'reggae', 'roots reggae', 'dub', 'dancehall',
    'ska', 'rocksteady', 'lovers rock',
    'soca', 'calypso', 'zouk', 'kompa',
  ],
  
  // Blues Family - Separate from Rock to honor its distinct tradition
  'blues': [
    'blues', 'delta blues', 'chicago blues', 'texas blues',
    'electric blues', 'modern blues', 'blues rock',
    'soul blues', 'jump blues',
  ],
}

/**
 * Get the genre family for a given genre (case-insensitive)
 * Uses multi-pass matching: exact → contains → fuzzy
 * Priority order matters for ambiguous genres (e.g., "indie pop" → pop, not indie)
 */
function getGenreFamily(genre: string): string {
  const lowerGenre = genre.toLowerCase().trim()
  
  // Pass 1: Exact match (highest priority)
  for (const [family, genres] of Object.entries(GENRE_FAMILIES)) {
    if (genres.includes(lowerGenre)) {
      return family
    }
  }
  
  // Pass 2: Genre contains a family keyword (e.g., "dark r&b" contains "r&b")
  // Check longer matches first to avoid false positives
  const familyPriority = [
    'k-pop',           // Check before pop
    'r&b-soul',        // Check before hip-hop (trap soul is R&B not hip-hop)
    'hip-hop',
    'metal',           // Check before rock
    'rock',
    'electronic',
    'jazz',
    'classical',
    'country-folk',
    'latin',
    'african-caribbean',
    'blues',
    'pop',             // Pop is catch-all, check last among majors
  ]
  
  for (const family of familyPriority) {
    const genres = GENRE_FAMILIES[family]
    if (!genres) continue
    
    // Sort by length descending to match longer terms first
    const sortedGenres = [...genres].sort((a, b) => b.length - a.length)
    
    for (const g of sortedGenres) {
      // Skip very short generic terms for contains matching
      if (g.length < 3) continue
      
      if (lowerGenre.includes(g) || g.includes(lowerGenre)) {
        return family
      }
    }
  }
  
  return 'other'
}

// ============================================
// ADAPTIVE CONFIDENCE SYSTEM
// ============================================
// Based on psychometric reliability research (Nunnally & Bernstein, 1994)
// More data = higher confidence in classification

interface AccuracyTier {
  name: string
  minRatings: number
  maxConfidence: number
  description: string
}

const ACCURACY_TIERS: AccuracyTier[] = [
  { name: 'Emerging', minRatings: 20, maxConfidence: 0.65, description: 'Basic patterns detected' },
  { name: 'Developing', minRatings: 50, maxConfidence: 0.78, description: 'Clear preferences forming' },
  { name: 'Refined', minRatings: 100, maxConfidence: 0.88, description: 'Robust taste profile' },
  { name: 'Deep', minRatings: 200, maxConfidence: 0.94, description: 'High-fidelity fingerprint' },
  { name: 'Crystallized', minRatings: 500, maxConfidence: 0.98, description: 'Maximum statistical confidence' },
]

/**
 * Get maximum allowable confidence based on review count
 * Implements psychometric reliability scaling
 */
function getMaxConfidence(reviewCount: number): number {
  // Find applicable tier
  const tier = [...ACCURACY_TIERS].reverse().find(t => reviewCount >= t.minRatings)
  if (!tier) return 0.50 // Below minimum threshold
  
  // Interpolate within tier
  const nextTier = ACCURACY_TIERS.find(t => t.minRatings > reviewCount)
  if (!nextTier) return tier.maxConfidence
  
  const progress = (reviewCount - tier.minRatings) / (nextTier.minRatings - tier.minRatings)
  return tier.maxConfidence + progress * (nextTier.maxConfidence - tier.maxConfidence)
}

/**
 * Get current accuracy tier info for display
 */
export function getAccuracyTier(reviewCount: number): {
  tier: string
  accuracy: number
  ratingsToNext: number | null
  description: string
} {
  const tier = [...ACCURACY_TIERS].reverse().find(t => reviewCount >= t.minRatings)
  const nextTier = ACCURACY_TIERS.find(t => t.minRatings > reviewCount)
  
  if (!tier) {
    return {
      tier: 'Locked',
      accuracy: 0,
      ratingsToNext: 20 - reviewCount,
      description: 'Need more ratings to unlock TasteID'
    }
  }
  
  return {
    tier: tier.name,
    accuracy: Math.round(getMaxConfidence(reviewCount) * 100),
    ratingsToNext: nextTier ? nextTier.minRatings - reviewCount : null,
    description: tier.description
  }
}

/**
 * SIMPLE ADVENTURENESS SCORE
 * 
 * Logic: If your top genre family is > 40% of your listening, you're NOT adventurous.
 * Simple and correct.
 */
function computeAdventurenessScore(genreVector: GenreVector): number {
  console.log('\n=== ADVENTURENESS CALCULATION ===')
  
  // Step 1: Map all genres to families
  const familyTotals: Record<string, number> = {}
  
  for (const [genre, weight] of Object.entries(genreVector)) {
    const family = getGenreFamily(genre)
    console.log(`  Genre "${genre}" -> Family "${family}" (weight: ${weight.toFixed(2)})`)
    familyTotals[family] = (familyTotals[family] || 0) + weight
  }
  
  // Remove 'other' family
  delete familyTotals['other']
  
  console.log('\nFamily totals:', familyTotals)
  
  // Step 2: Calculate total and find dominant family
  const total = Object.values(familyTotals).reduce((a, b) => a + b, 0)
  if (total === 0) return 0
  
  const sortedFamilies = Object.entries(familyTotals).sort((a, b) => b[1] - a[1])
  const [topFamily, topWeight] = sortedFamilies[0] || ['none', 0]
  const dominance = topWeight / total
  
  console.log(`\nTop family: "${topFamily}" at ${(dominance * 100).toFixed(1)}%`)
  console.log(`Family count: ${sortedFamilies.length}`)
  
  // Step 3: Simple rule - if one family dominates, LOW adventureness
  // dominance 50% = 0.25 adventureness
  // dominance 30% = 0.55 adventureness  
  // dominance 20% = 0.70 adventureness
  const adventureness = Math.max(0, Math.min(1, 1 - dominance * 1.5))
  
  console.log(`FINAL ADVENTURENESS: ${(adventureness * 100).toFixed(1)}%`)
  console.log('=================================\n')
  
  return adventureness
}

/**
 * SIMPLE ARCHETYPE CLASSIFICATION
 * 
 * Rule: Look at the dominant genre family and assign the matching archetype.
 * R&B dominant = Soul Searcher. Hip-Hop dominant = Hip-Hop Head. Simple.
 */
function classifyArchetype(
  genreVector: GenreVector,
  adventurenessScore: number,
  ratingSkew: string,
  reviewDepth: string,
  avgReviewLength: number,
  reviews: ReviewWithAlbum[]
): { primary: string; secondary: string | null; confidence: number } {
  console.log('\n========================================')
  console.log('ARCHETYPE CLASSIFICATION')
  console.log('========================================\n')
  
  const reviewCount = reviews.length
  
  // Step 1: Get family distribution
  const familyTotals: Record<string, number> = {}
  for (const [genre, weight] of Object.entries(genreVector)) {
    const family = getGenreFamily(genre)
    familyTotals[family] = (familyTotals[family] || 0) + weight
  }
  delete familyTotals['other']
  
  const total = Object.values(familyTotals).reduce((a, b) => a + b, 0)
  const sortedFamilies = Object.entries(familyTotals).sort((a, b) => b[1] - a[1])
  
  console.log('Family distribution:')
  sortedFamilies.forEach(([f, w]) => {
    console.log(`  ${f}: ${((w / total) * 100).toFixed(1)}%`)
  })
  
  const [topFamily, topWeight] = sortedFamilies[0] || ['none', 0]
  const dominance = total > 0 ? topWeight / total : 0
  
  console.log(`\nDominant family: "${topFamily}" at ${(dominance * 100).toFixed(1)}%`)
  console.log(`Adventureness: ${(adventurenessScore * 100).toFixed(1)}%`)
  
  // Step 2: Map family to archetype
  const FAMILY_TO_ARCHETYPE: Record<string, string> = {
    'r&b-soul': 'soul-searcher',
    'hip-hop': 'hip-hop-head',
    'rock': 'rock-purist',
    'electronic': 'electronic-pioneer',
    'pop': 'pop-connoisseur',
    'k-pop': 'pop-connoisseur',
    'metal': 'metal-maven',
    'jazz': 'jazz-explorer',
    'country-folk': 'country-soul',
    'classical': 'classical-mind',
    'latin': 'pop-connoisseur',
    'african-caribbean': 'soul-searcher',
    'blues': 'soul-searcher',
    'indie-alternative': 'indie-devotee',
  }
  
  let primary: string
  let secondary: string | null = null
  let confidence: number
  
  // Step 3: SIMPLE DECISION
  // If any family is > 25%, use that archetype. Period.
  if (dominance > 0.25) {
    primary = FAMILY_TO_ARCHETYPE[topFamily] || 'indie-devotee'
    confidence = 0.65 + (dominance * 0.4)  // Higher dominance = higher confidence
    
    // Secondary from second family if it's substantial
    const [secondFamily] = sortedFamilies[1] || ['none', 0]
    if (secondFamily && sortedFamilies[1][1] / total > 0.15) {
      secondary = FAMILY_TO_ARCHETYPE[secondFamily] || null
    }
    
    console.log(`\n→ GENRE-BASED: ${primary} (${topFamily} dominates at ${(dominance * 100).toFixed(0)}%)`)
  }
  // Only if NO family dominates AND high adventureness, consider Genre Fluid
  else if (dominance < 0.25 && adventurenessScore > 0.5 && sortedFamilies.length >= 4) {
    primary = 'genre-fluid'
    confidence = adventurenessScore
    secondary = FAMILY_TO_ARCHETYPE[topFamily] || null
    
    console.log(`\n→ BEHAVIORAL: genre-fluid (no dominant family, high diversity)`)
  }
  // Default fallback
  else {
    primary = FAMILY_TO_ARCHETYPE[topFamily] || 'indie-devotee'
    confidence = 0.55
    
    console.log(`\n→ DEFAULT: ${primary}`)
  }
  
  // Cap confidence by review count
  const maxConfidence = getMaxConfidence(reviewCount)
  confidence = Math.min(confidence, maxConfidence)
  
  console.log(`\nFINAL: ${primary} @ ${(confidence * 100).toFixed(0)}% confidence`)
  if (secondary) console.log(`SECONDARY: ${secondary}`)
  console.log('========================================\n')
  
  return { primary, secondary, confidence }
}

// Compute secondary behavioral archetype
function computeSecondaryBehavioral(
  ratingSkew: string,
  reviews: ReviewWithAlbum[]
): string | null {
  const totalReviews = reviews.length
  if (totalReviews < 10) return null
  
  // Check for Decade Diver
  const decadeCount: Record<string, number> = {}
  for (const review of reviews) {
    const year = new Date(review.album.releaseDate).getFullYear()
    const decade = `${Math.floor(year / 10) * 10}s`
    decadeCount[decade] = (decadeCount[decade] || 0) + 1
  }
  for (const [, count] of Object.entries(decadeCount)) {
    if (count / totalReviews > 0.60) {
      return 'decade-diver'
    }
  }
  
  // Check for Critic/Enthusiast
  if (ratingSkew === 'harsh') return 'the-critic'
  if (ratingSkew === 'lenient') return 'the-enthusiast'
  
  return null
}

/**
 * Find signature albums that define user's taste
 */
function findSignatureAlbums(reviews: ReviewWithAlbum[]): string[] {
  // High rating + written review + not super mainstream
  return reviews
    .filter(r => r.rating >= 8 && r.text && r.text.length > 50)
    .filter(r => !r.album.averageRating || r.album.totalReviews < 100) // Not super mainstream
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5)
    .map(r => r.album.id)
}

/**
 * Compute Polarity Score - Bayesian edge strength from CCX
 * Measures how distinctive and confident the taste profile is
 */
function computePolarityScore(
  reviews: ReviewWithAlbum[],
  genreVector: GenreVector,
  adventurenessScore: number
): number {
  // Factors that contribute to Polarity Score:
  // 1. Review count (more data = more confident)
  const countFactor = Math.min(reviews.length / 50, 1) // Max out at 50 reviews

  // 2. Rating consistency (consistent raters have clearer preferences)
  const ratings = reviews.map(r => r.rating)
  const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length
  const variance = ratings.reduce((sum, r) => sum + Math.pow(r - avgRating, 2), 0) / ratings.length
  const consistencyFactor = 1 - Math.min(variance / 10, 1) // Lower variance = higher consistency

  // 3. Genre distinctiveness (focused taste = higher polarity)
  const distinctivenessFactor = 1 - adventurenessScore * 0.5 // Being focused gives higher score, but not penalize adventurous too much

  // 4. Engagement depth (written reviews = stronger signal)
  const writtenCount = reviews.filter(r => r.text && r.text.length > 50).length
  const engagementFactor = Math.min(writtenCount / reviews.length + 0.3, 1)

  // Combine with Bayesian-style weighting
  const polarityScore =
    countFactor * 0.3 +
    consistencyFactor * 0.25 +
    distinctivenessFactor * 0.25 +
    engagementFactor * 0.2

  return Math.round(polarityScore * 100) / 100
}

// ============================================
// POLARITY 1.2 - LISTENING SIGNATURE COMPUTATION
// ============================================

/**
 * Compute Listening Signature - Music network activation baseline
 * Analogous to BrainID cognitive fingerprint
 */
function computeListeningSignature(reviews: ReviewWithAlbum[]): ListeningSignature {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const recentReviews = reviews.filter(r => r.createdAt > thirtyDaysAgo)

  // Discovery Mode: New artists, diverse genres
  const uniqueArtists = new Set(reviews.map(r => r.album.artistName))
  const uniqueGenres = new Set(reviews.flatMap(r => r.album.genres))
  const discoveryScore = Math.min(
    (uniqueArtists.size / Math.max(reviews.length, 1)) * 0.5 +
    (uniqueGenres.size / Math.max(reviews.length * 2, 1)) * 0.5,
    1
  )

  // Comfort Mode: Re-ratings, same-artist clusters, older music
  const artistCounts: Record<string, number> = {}
  reviews.forEach(r => {
    artistCounts[r.album.artistName] = (artistCounts[r.album.artistName] || 0) + 1
  })
  const repeatArtistRatio = Object.values(artistCounts).filter(c => c > 1).length / Math.max(uniqueArtists.size, 1)
  const comfortScore = Math.min(repeatArtistRatio * 1.5 + 0.1, 1)

  // Deep Dive Mode: Multiple albums from same artist in sequence
  let deepDiveScore = 0
  const sortedByDate = [...reviews].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
  for (let i = 1; i < sortedByDate.length; i++) {
    if (sortedByDate[i].album.artistName === sortedByDate[i-1].album.artistName) {
      deepDiveScore += 0.1
    }
  }
  deepDiveScore = Math.min(deepDiveScore / Math.max(reviews.length / 10, 1), 1)

  // Reactive Mode: Recent release engagement, quick ratings
  const currentYear = now.getFullYear()
  const recentReleases = reviews.filter(r => {
    const releaseYear = new Date(r.album.releaseDate).getFullYear()
    return releaseYear >= currentYear - 1
  })
  const reactiveScore = Math.min(recentReleases.length / Math.max(reviews.length, 1) * 2, 1)

  // Emotional Mode: Rating extremes (0-2, 8-10), long emotional reviews
  const extremeRatings = reviews.filter(r => r.rating <= 2 || r.rating >= 8)
  const emotionalReviews = reviews.filter(r => r.text && r.text.length > 100 && /[!?]{2,}|love|hate|amazing|terrible/i.test(r.text))
  const emotionalScore = Math.min(
    (extremeRatings.length / Math.max(reviews.length, 1)) * 0.6 +
    (emotionalReviews.length / Math.max(reviews.length, 1)) * 0.4,
    1
  )

  // Social Mode: This would require friend activity data, estimate from recent activity patterns
  // For now, base on engagement frequency
  const socialScore = Math.min(recentReviews.length / 10, 1) * 0.3

  // Aesthetic Mode: Would require vinyl/physical media tracking, estimate from genre diversity
  const aestheticScore = Math.min(uniqueGenres.size / 20, 1) * 0.3

  // Normalize to ensure they sum to ~1 for relative comparison
  const total = discoveryScore + comfortScore + deepDiveScore + reactiveScore + emotionalScore + socialScore + aestheticScore
  const normalizer = total > 0 ? 1 / total : 1

  return {
    discovery: Math.round(discoveryScore * normalizer * 100) / 100,
    comfort: Math.round(comfortScore * normalizer * 100) / 100,
    deep_dive: Math.round(deepDiveScore * normalizer * 100) / 100,
    reactive: Math.round(reactiveScore * normalizer * 100) / 100,
    emotional: Math.round(emotionalScore * normalizer * 100) / 100,
    social: Math.round(socialScore * normalizer * 100) / 100,
    aesthetic: Math.round(aestheticScore * normalizer * 100) / 100,
  }
}

/**
 * Detect signature patterns from listening behavior
 * Enhanced with more nuanced patterns from Polarity 1.2
 */
function detectSignaturePatterns(
  reviews: ReviewWithAlbum[],
  signature: ListeningSignature
): string[] {
  const patterns: string[] = []
  const ratings = reviews.map(r => r.rating)
  const avgRating = ratings.reduce((a, b) => a + b, 0) / Math.max(ratings.length, 1)

  // ===========================================
  // SIGNATURE-BASED PATTERNS
  // ===========================================

  // Discovery↔Comfort Oscillation - Healthy balance between new and familiar
  if (signature.discovery > 0.18 && signature.comfort > 0.15) {
    patterns.push('Discovery↔Comfort Oscillation')
  }

  // Deep Dive Sprints - Goes all-in on artists
  if (signature.deep_dive > 0.15) {
    patterns.push('Deep Dive Sprints')
  }

  // New Release Hunter - Stays on top of current music
  if (signature.reactive > 0.2) {
    patterns.push('New Release Hunter')
  }

  // Emotional Listener - Strong reactions to music
  if (signature.emotional > 0.25) {
    patterns.push('Emotional Listener')
  }

  // ===========================================
  // RATING DISTRIBUTION PATTERNS
  // ===========================================

  // Harsh Critic vs Music Optimist
  if (avgRating < 5.5) {
    patterns.push('Critical Ear')
  } else if (avgRating > 7.5) {
    patterns.push('Music Optimist')
  }

  // Bimodal Rater - Loves it or hates it (high ratings at extremes)
  const extremeCount = ratings.filter(r => r <= 3 || r >= 8).length
  const middleCount = ratings.filter(r => r > 3 && r < 8).length
  if (extremeCount > middleCount * 1.5 && reviews.length > 10) {
    patterns.push('Polarized Taste')
  }

  // Generous Perfectionist - Gives 10s but rarely anything between 6-9
  const perfectScores = ratings.filter(r => r === 10).length
  const nearPerfectScores = ratings.filter(r => r >= 8 && r < 10).length
  if (perfectScores > nearPerfectScores && perfectScores >= 3) {
    patterns.push('Perfection Seeker')
  }

  // ===========================================
  // ARTIST & GENRE PATTERNS
  // ===========================================

  // Track artist engagement
  const artistCounts: Record<string, number> = {}
  const artistRatings: Record<string, number[]> = {}
  reviews.forEach(r => {
    artistCounts[r.album.artistName] = (artistCounts[r.album.artistName] || 0) + 1
    if (!artistRatings[r.album.artistName]) {
      artistRatings[r.album.artistName] = []
    }
    artistRatings[r.album.artistName].push(r.rating)
  })

  const maxArtistAlbums = Math.max(...Object.values(artistCounts), 0)

  // Discography Completionist - Deep dives into artist catalogs
  if (maxArtistAlbums >= 5) {
    patterns.push('Discography Completionist')
  }

  // Loyal Fan - High average rating for repeat artists
  const loyalArtists = Object.entries(artistRatings)
    .filter(([, ratings]) => ratings.length >= 3)
    .filter(([, ratings]) => ratings.reduce((a, b) => a + b, 0) / ratings.length >= 7)
  if (loyalArtists.length >= 3) {
    patterns.push('Artist Loyalist')
  }

  // Genre Explorer - Wide genre coverage
  const uniqueGenres = new Set(reviews.flatMap(r => r.album.genres))
  if (uniqueGenres.size > 15) {
    patterns.push('Genre Explorer')
  }

  // Genre Specialist - 70%+ reviews in top 3 genres
  const genreCounts: Record<string, number> = {}
  reviews.forEach(r => {
    r.album.genres.forEach(g => {
      genreCounts[g.toLowerCase()] = (genreCounts[g.toLowerCase()] || 0) + 1
    })
  })
  const sortedGenres = Object.entries(genreCounts).sort((a, b) => b[1] - a[1])
  const topGenreCount = sortedGenres.slice(0, 3).reduce((sum, [, c]) => sum + c, 0)
  if (topGenreCount / reviews.length > 0.7 && reviews.length > 10) {
    patterns.push('Genre Specialist')
  }

  // ===========================================
  // TEMPORAL PATTERNS
  // ===========================================

  // Archive Diver - Prefers older music (average album age > 15 years)
  const currentYear = new Date().getFullYear()
  const albumAges = reviews.map(r => currentYear - new Date(r.album.releaseDate).getFullYear())
  const avgAlbumAge = albumAges.reduce((a, b) => a + b, 0) / Math.max(albumAges.length, 1)
  if (avgAlbumAge > 15) {
    patterns.push('Archive Diver')
  }

  // Decade Obsessed - 60%+ of reviews from one decade
  const decadeCounts: Record<string, number> = {}
  reviews.forEach(r => {
    const year = new Date(r.album.releaseDate).getFullYear()
    const decade = `${Math.floor(year / 10) * 10}s`
    decadeCounts[decade] = (decadeCounts[decade] || 0) + 1
  })
  const decadeValues = Object.values(decadeCounts)
  const maxDecadePercent = decadeValues.length > 0 ? Math.max(...decadeValues, 0) / reviews.length : 0
  if (maxDecadePercent > 0.6) {
    patterns.push('Era Specialist')
  }

  // ===========================================
  // ENGAGEMENT PATTERNS
  // ===========================================

  // Essay Writer - Long, thoughtful reviews
  const reviewLengths = reviews.map(r => r.text?.split(/\s+/).length || 0)
  const avgReviewLength = reviewLengths.reduce((a, b) => a + b, 0) / Math.max(reviewLengths.length, 1)
  if (avgReviewLength > 100) {
    patterns.push('Essay Writer')
  }

  // Contrarian - Often differs from consensus (rates highly-rated albums lower or vice versa)
  let contrarianCount = 0
  reviews.forEach(r => {
    if (r.album.averageRating) {
      const diff = Math.abs(r.rating - r.album.averageRating)
      if (diff > 3) contrarianCount++
    }
  })
  if (contrarianCount / reviews.length > 0.3 && reviews.length > 10) {
    patterns.push('Contrarian')
  }

  // Consensus Builder - Usually aligns with popular opinion
  let consensusCount = 0
  reviews.forEach(r => {
    if (r.album.averageRating) {
      const diff = Math.abs(r.rating - r.album.averageRating)
      if (diff <= 1) consensusCount++
    }
  })
  if (consensusCount / reviews.length > 0.6 && reviews.length > 10) {
    patterns.push('Consensus Builder')
  }

  // Hidden Gem Hunter - High ratings for low-popularity albums
  const hiddenGems = reviews.filter(r =>
    r.rating >= 8 && r.album.totalReviews < 50
  )
  if (hiddenGems.length / reviews.length > 0.3 && reviews.length > 10) {
    patterns.push('Hidden Gem Hunter')
  }

  return patterns.slice(0, 8) // Limit to most relevant patterns
}

/**
 * Extract memorable moments from review history
 */
function extractMemorableMoments(reviews: ReviewWithAlbum[]): MemorableMoment[] {
  const moments: MemorableMoment[] = []
  const sortedByDate = [...reviews].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())

  // First 10 rating
  const first10 = sortedByDate.find(r => r.rating === 10)
  if (first10) {
    moments.push({
      type: 'first_10',
      albumId: first10.album.id,
      albumTitle: first10.album.title,
      artistName: first10.album.artistName,
      rating: 10,
      date: first10.createdAt,
      description: 'First perfect score',
    })
  }

  // First 0 rating
  const first0 = sortedByDate.find(r => r.rating === 0)
  if (first0) {
    moments.push({
      type: 'first_0',
      albumId: first0.album.id,
      albumTitle: first0.album.title,
      artistName: first0.album.artistName,
      rating: 0,
      date: first0.createdAt,
      description: 'First zero - memorable for a reason',
    })
  }

  // Emotional reviews (long, passionate reviews)
  const emotionalReviews = reviews
    .filter(r => r.text && r.text.length > 200)
    .sort((a, b) => (b.text?.length || 0) - (a.text?.length || 0))
    .slice(0, 3)

  emotionalReviews.forEach(r => {
    moments.push({
      type: 'emotional_review',
      albumId: r.album.id,
      albumTitle: r.album.title,
      artistName: r.album.artistName,
      rating: r.rating,
      date: r.createdAt,
      description: 'Deeply felt review',
    })
  })

  return moments.slice(0, 10) // Limit to 10 memorable moments
}

/**
 * Detect potential musical future selves
 */
function detectMusicalFutureSselves(
  reviews: ReviewWithAlbum[],
  genreVector: GenreVector
): MusicalFutureSelf[] {
  const futures: MusicalFutureSelf[] = []

  // Get genre trends (what genres are they exploring?)
  const genreEntries = Object.entries(genreVector).sort((a, b) => b[1] - a[1])
  const topGenres = genreEntries.slice(0, 5).map(([g]) => g)
  const emergingGenres = genreEntries.slice(5, 10).filter(([, v]) => v > 0.2).map(([g]) => g)

  // Jazz Connoisseur path
  const jazzGenres = ['jazz', 'jazz fusion', 'bebop', 'modal jazz', 'free jazz']
  const jazzScore = jazzGenres.reduce((sum, g) => sum + (genreVector[g] || 0), 0)
  if (jazzScore > 0.3) {
    futures.push({
      id: 'jazz-connoisseur',
      name: 'Jazz Connoisseur',
      description: 'Deep appreciation for improvisation and complexity',
      progress: Math.min(jazzScore / 2, 1),
      nextSteps: ['Explore bebop classics', 'Discover modal jazz', 'Try free jazz'],
      relatedGenres: jazzGenres,
      relatedArtists: ['Miles Davis', 'John Coltrane', 'Thelonious Monk'],
    })
  }

  // Hip-Hop Historian
  const hiphopGenres = ['hip-hop', 'rap', 'southern hip hop', 'east coast hip hop', 'west coast hip hop']
  const hiphopScore = hiphopGenres.reduce((sum, g) => sum + (genreVector[g] || 0), 0)
  if (hiphopScore > 0.3) {
    futures.push({
      id: 'hip-hop-historian',
      name: 'Hip-Hop Historian',
      description: 'Master of hip-hop\'s evolution and subgenres',
      progress: Math.min(hiphopScore / 2, 1),
      nextSteps: ['Trace regional styles', 'Explore underground scenes', 'Study production evolution'],
      relatedGenres: hiphopGenres,
      relatedArtists: ['Kendrick Lamar', 'OutKast', 'Wu-Tang Clan'],
    })
  }

  // Electronic Explorer
  const electronicGenres = ['electronic', 'house', 'techno', 'ambient', 'drum and bass']
  const electronicScore = electronicGenres.reduce((sum, g) => sum + (genreVector[g] || 0), 0)
  if (electronicScore > 0.3) {
    futures.push({
      id: 'electronic-explorer',
      name: 'Electronic Explorer',
      description: 'Navigator of electronic music\'s vast landscape',
      progress: Math.min(electronicScore / 2, 1),
      nextSteps: ['Discover classic house', 'Explore Detroit techno', 'Try ambient'],
      relatedGenres: electronicGenres,
      relatedArtists: ['Aphex Twin', 'Boards of Canada', 'Daft Punk'],
    })
  }

  // Genre Bridge Builder (high adventureness)
  const uniqueGenreCount = Object.keys(genreVector).length
  if (uniqueGenreCount > 10) {
    futures.push({
      id: 'genre-bridge-builder',
      name: 'Genre Bridge Builder',
      description: 'Connecting disparate sounds into a unified taste map',
      progress: Math.min(uniqueGenreCount / 30, 1),
      nextSteps: ['Find cross-genre artists', 'Create genre playlists', 'Map your taste universe'],
      relatedGenres: emergingGenres,
      relatedArtists: [],
    })
  }

  return futures.slice(0, 4) // Limit to 4 future selves
}

/**
 * Compute Polarity Score 2.0 - Enhanced with cognitive factors
 */
function computePolarityScore2(
  reviews: ReviewWithAlbum[],
  signature: ListeningSignature,
  patterns: string[],
  polarityScore1: number
): number {
  // Original factors (from polarityScore1)
  const baseFactor = polarityScore1 * 0.4

  // Signature strength - how clear/distinct is the listening signature?
  const signatureValues = Object.values(signature)
  const maxSignature = signatureValues.length > 0 ? Math.max(...signatureValues, 0) : 0
  const signatureStrength = maxSignature > 0.3 ? 0.8 : maxSignature > 0.2 ? 0.6 : 0.4
  const signatureFactor = signatureStrength * 0.2

  // Pattern consistency - how many detectable patterns?
  const patternFactor = Math.min(patterns.length / 5, 1) * 0.15

  // Engagement consistency - regular activity over time
  const reviewDates = reviews.map(r => r.createdAt.getTime())
  const timeSpan = reviewDates.length > 0 ? Math.max(...reviewDates) - Math.min(...reviewDates) : 0
  const daysCovered = Math.max(timeSpan / (1000 * 60 * 60 * 24), 1) // At least 1 day
  const activityDensity = reviews.length / Math.max(daysCovered / 7, 1) // Reviews per week
  const consistencyFactor = Math.min(activityDensity / 5, 1) * 0.15

  // Future clarity - how clear are musical trajectories?
  const futureFactor = 0.1 // Base value, adjusted by future selves detection

  const score = baseFactor + signatureFactor + patternFactor + consistencyFactor + futureFactor
  return Math.round(score * 100) / 100
}

// ============================================
// MATCHING ENGINE
// ============================================

/**
 * Compute taste compatibility between two users
 */
export async function computeTasteMatch(
  userId1: string,
  userId2: string
): Promise<{
  overallScore: number
  genreOverlap: number
  artistOverlap: number
  ratingAlignment: number
  sharedGenres: string[]
  sharedArtists: string[]
  sharedAlbums: string[]
  matchType: string
} | null> {
  // Get both TasteIDs
  const [taste1, taste2] = await Promise.all([
    prisma.tasteID.findUnique({ where: { userId: userId1 } }),
    prisma.tasteID.findUnique({ where: { userId: userId2 } }),
  ])

  if (!taste1 || !taste2) return null

  const genre1 = taste1.genreVector as GenreVector
  const genre2 = taste2.genreVector as GenreVector

  // 1. Genre overlap (cosine similarity)
  const genreOverlap = computeCosineSimilarity(genre1, genre2)

  // 2. Artist overlap
  const artists1 = new Set(taste1.topArtists)
  const artists2 = new Set(taste2.topArtists)
  const sharedArtists = [...artists1].filter(a => artists2.has(a))
  const artistOverlap = sharedArtists.length / Math.max(artists1.size, artists2.size, 1)

  // 3. Rating alignment
  const ratingDiff = Math.abs(taste1.averageRating - taste2.averageRating)
  const ratingAlignment = Math.max(0, 1 - ratingDiff / 5)

  // 4. Shared genres (top overlap)
  const sharedGenres = taste1.topGenres.filter(g => taste2.topGenres.includes(g))

  // 5. Find shared highly-rated albums (limited to recent for performance)
  const reviews1 = await prisma.review.findMany({
    where: { userId: userId1, rating: { gte: 8 } },
    select: { albumId: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const reviews2 = await prisma.review.findMany({
    where: { userId: userId2, rating: { gte: 8 } },
    select: { albumId: true },
    orderBy: { createdAt: 'desc' },
    take: 100,
  })
  const albums1 = new Set(reviews1.map(r => r.albumId))
  const albums2 = new Set(reviews2.map(r => r.albumId))
  const sharedAlbums = [...albums1].filter(a => albums2.has(a)).slice(0, 10)

  // 6. Compute overall score
  const overallScore = Math.round(
    (genreOverlap * 40 + artistOverlap * 30 + ratingAlignment * 20 + (sharedAlbums.length / 10) * 10)
  )

  // 7. Determine match type
  let matchType = 'genre_buddy'
  if (overallScore > 80) {
    matchType = 'taste_twin'
  } else if (genreOverlap < 0.3 && artistOverlap < 0.2) {
    matchType = 'complementary'
  } else if (
    (taste1.adventurenessScore > 0.7 && taste2.adventurenessScore < 0.4) ||
    (taste2.adventurenessScore > 0.7 && taste1.adventurenessScore < 0.4)
  ) {
    matchType = 'explorer_guide'
  }

  return {
    overallScore,
    genreOverlap: Math.round(genreOverlap * 100),
    artistOverlap: Math.round(artistOverlap * 100),
    ratingAlignment: Math.round(ratingAlignment * 100),
    sharedGenres,
    sharedArtists,
    sharedAlbums,
    matchType,
  }
}

/**
 * Compute cosine similarity between two genre vectors
 */
function computeCosineSimilarity(vec1: GenreVector, vec2: GenreVector): number {
  const allGenres = new Set([...Object.keys(vec1), ...Object.keys(vec2)])

  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (const genre of allGenres) {
    const v1 = vec1[genre] || 0
    const v2 = vec2[genre] || 0
    dotProduct += v1 * v2
    norm1 += v1 * v1
    norm2 += v2 * v2
  }

  if (norm1 === 0 || norm2 === 0) return 0
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

/**
 * Find users with similar taste
 */
export async function findSimilarTasters(
  userId: string,
  limit: number = 10
): Promise<Array<{
  userId: string
  username: string
  image: string | null
  compatibility: number
  sharedGenres: string[]
  archetype: string
}>> {
  const userTaste = await prisma.tasteID.findUnique({
    where: { userId },
    include: { user: { select: { id: true } } },
  })

  if (!userTaste) return []

  // Get all other TasteIDs
  const otherTastes = await prisma.tasteID.findMany({
    where: { userId: { not: userId } },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    take: 100, // Sample for performance
  })

  const userGenres = userTaste.genreVector as GenreVector

  // Score each user
  const scored = otherTastes.map(taste => {
    const theirGenres = taste.genreVector as GenreVector
    const similarity = computeCosineSimilarity(userGenres, theirGenres)
    const sharedGenres = userTaste.topGenres.filter(g => taste.topGenres.includes(g))

    return {
      userId: taste.userId,
      username: taste.user.username || 'Unknown',
      image: taste.user.image,
      compatibility: Math.round(similarity * 100),
      sharedGenres,
      archetype: taste.primaryArchetype,
    }
  })

  return scored
    .sort((a, b) => b.compatibility - a.compatibility)
    .slice(0, limit)
}

// ============================================
// DATABASE OPERATIONS
// ============================================

/**
 * Save or update a user's TasteID
 */
export async function saveTasteID(userId: string, computation: TasteIDComputation) {
  return prisma.tasteID.upsert({
    where: { userId },
    create: {
      userId,
      genreVector: computation.genreVector as object,
      artistDNA: computation.artistDNA as unknown as object,
      decadePreferences: computation.decadePreferences as object,
      primaryArchetype: computation.primaryArchetype,
      secondaryArchetype: computation.secondaryArchetype,
      archetypeConfidence: computation.archetypeConfidence,
      adventurenessScore: computation.adventurenessScore,
      ratingSkew: computation.ratingSkew,
      averageRating: computation.averageRating,
      ratingStdDev: computation.ratingStdDev,
      reviewDepth: computation.reviewDepth,
      reviewCount: computation.reviewCount,
      avgReviewLength: computation.avgReviewLength,
      topGenres: computation.topGenres,
      topArtists: computation.topArtists,
      signatureAlbums: computation.signatureAlbums,
      polarityScore: computation.polarityScore,
      // Polarity 1.2 fields
      listeningSignature: computation.listeningSignature as object,
      signaturePatterns: computation.signaturePatterns,
      memorableMoments: computation.memorableMoments as unknown as object,
      futureSelvesMusic: computation.futureSelvesMusic as unknown as object,
      polarityScore2: computation.polarityScore2,
      // Vocabulary Analysis
      vocabularyProfile: computation.vocabularyProfile as object,
    },
    update: {
      genreVector: computation.genreVector as object,
      artistDNA: computation.artistDNA as unknown as object,
      decadePreferences: computation.decadePreferences as object,
      primaryArchetype: computation.primaryArchetype,
      secondaryArchetype: computation.secondaryArchetype,
      archetypeConfidence: computation.archetypeConfidence,
      adventurenessScore: computation.adventurenessScore,
      ratingSkew: computation.ratingSkew,
      averageRating: computation.averageRating,
      ratingStdDev: computation.ratingStdDev,
      reviewDepth: computation.reviewDepth,
      reviewCount: computation.reviewCount,
      avgReviewLength: computation.avgReviewLength,
      topGenres: computation.topGenres,
      topArtists: computation.topArtists,
      signatureAlbums: computation.signatureAlbums,
      polarityScore: computation.polarityScore,
      // Polarity 1.2 fields
      listeningSignature: computation.listeningSignature as object,
      signaturePatterns: computation.signaturePatterns,
      memorableMoments: computation.memorableMoments as unknown as object,
      futureSelvesMusic: computation.futureSelvesMusic as unknown as object,
      polarityScore2: computation.polarityScore2,
      // Vocabulary Analysis
      vocabularyProfile: computation.vocabularyProfile as object,
      lastComputedAt: new Date(),
    },
  })
}

/**
 * Create a monthly snapshot of TasteID
 */
export async function createTasteIDSnapshot(tasteId: string) {
  const taste = await prisma.tasteID.findUnique({ where: { id: tasteId } })
  if (!taste) return null

  const now = new Date()

  return prisma.tasteIDSnapshot.upsert({
    where: {
      tasteIdId_year_month: {
        tasteIdId: tasteId,
        year: now.getFullYear(),
        month: now.getMonth() + 1,
      },
    },
    create: {
      tasteIdId: tasteId,
      genreVector: taste.genreVector as object,
      artistDNA: taste.artistDNA as object,
      primaryArchetype: taste.primaryArchetype,
      adventurenessScore: taste.adventurenessScore,
      reviewCount: taste.reviewCount,
      // Polarity 1.2
      listeningSignature: taste.listeningSignature ? (taste.listeningSignature as object) : undefined,
      polarityScore2: taste.polarityScore2,
      month: now.getMonth() + 1,
      year: now.getFullYear(),
    },
    update: {
      genreVector: taste.genreVector as object,
      artistDNA: taste.artistDNA as object,
      primaryArchetype: taste.primaryArchetype,
      adventurenessScore: taste.adventurenessScore,
      reviewCount: taste.reviewCount,
      // Polarity 1.2
      listeningSignature: taste.listeningSignature ? (taste.listeningSignature as object) : undefined,
      polarityScore2: taste.polarityScore2,
    },
  })
}

/**
 * Get archetype display info
 */
export function getArchetypeInfo(archetypeId: string) {
  const archetype = Object.values(ARCHETYPES).find(a => a.id === archetypeId)
  return archetype || {
    id: archetypeId,
    name: archetypeId.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
    description: 'Unique taste profile',
    genres: [],
    icon: '🎵',
  }
}

/**
 * Get music network display info
 */
export function getMusicNetworkInfo(networkId: string) {
  const network = Object.values(MUSIC_NETWORKS).find(n => n.id === networkId)
  return network || {
    id: networkId,
    name: networkId.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') + ' Mode',
    description: 'Listening behavior pattern',
    yeoAnalog: 'Unknown',
    icon: '🎵',
  }
}

/**
 * Get dominant music networks from listening signature
 */
export function getDominantNetworks(signature: ListeningSignature, topN: number = 3): Array<{
  id: string
  name: string
  description: string
  icon: string
  activation: number
}> {
  const entries = Object.entries(signature) as [keyof ListeningSignature, number][]
  return entries
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([id, activation]) => {
      const info = getMusicNetworkInfo(id)
      return {
        id: info.id,
        name: info.name,
        description: info.description,
        icon: info.icon,
        activation: Math.round(activation * 100),
      }
    })
}

/**
 * Typical ranges for listening networks (based on Polarity's concept)
 * These represent the "average" user baseline for comparison
 */
export const TYPICAL_NETWORK_RANGES: Record<keyof ListeningSignature, { min: number; max: number; typical: number }> = {
  discovery: { min: 0.15, max: 0.30, typical: 0.22 },
  comfort: { min: 0.18, max: 0.32, typical: 0.25 },
  deep_dive: { min: 0.08, max: 0.20, typical: 0.14 },
  reactive: { min: 0.10, max: 0.22, typical: 0.16 },
  emotional: { min: 0.08, max: 0.20, typical: 0.14 },
  social: { min: 0.03, max: 0.12, typical: 0.06 },
  aesthetic: { min: 0.02, max: 0.10, typical: 0.05 },
}

/**
 * Format listening signature for display
 */
export function formatListeningSignature(signature: ListeningSignature): Array<{
  network: string
  name: string
  icon: string
  percentage: number
  bar: string
  typicalRange: { min: number; max: number }
  deviation: 'above' | 'below' | 'typical'
  deviationAmount: number
}> {
  const entries = Object.entries(signature) as [keyof ListeningSignature, number][]
  if (entries.length === 0) return []
  const maxActivation = Math.max(...entries.map(([, v]) => v), 0.01) // Fallback to 0.01 to avoid division by zero

  return entries
    .sort((a, b) => b[1] - a[1])
    .map(([id, activation]) => {
      const info = getMusicNetworkInfo(id)
      const percentage = Math.round(activation * 100)
      const barLength = Math.round((activation / maxActivation) * 20)
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength)

      const typical = TYPICAL_NETWORK_RANGES[id]
      let deviation: 'above' | 'below' | 'typical' = 'typical'
      let deviationAmount = 0

      if (activation > typical.max) {
        deviation = 'above'
        deviationAmount = Math.round((activation - typical.max) * 100)
      } else if (activation < typical.min) {
        deviation = 'below'
        deviationAmount = Math.round((typical.min - activation) * 100)
      }

      return {
        network: id,
        name: info.name,
        icon: info.icon,
        percentage,
        bar,
        typicalRange: { min: Math.round(typical.min * 100), max: Math.round(typical.max * 100) },
        deviation,
        deviationAmount,
      }
    })
}

/**
 * Compute signature uniqueness score - how different is this signature from typical?
 */
export function computeSignatureUniqueness(signature: ListeningSignature): {
  score: number  // 0-1, higher = more unique
  standoutNetworks: Array<{ network: string; direction: 'high' | 'low'; deviation: number }>
} {
  const entries = Object.entries(signature) as [keyof ListeningSignature, number][]
  let totalDeviation = 0
  const standoutNetworks: Array<{ network: string; direction: 'high' | 'low'; deviation: number }> = []

  for (const [network, value] of entries) {
    const typical = TYPICAL_NETWORK_RANGES[network]
    const typicalMid = (typical.min + typical.max) / 2
    const deviation = Math.abs(value - typicalMid)
    totalDeviation += deviation

    if (value > typical.max) {
      standoutNetworks.push({
        network,
        direction: 'high',
        deviation: Math.round((value - typical.max) * 100),
      })
    } else if (value < typical.min) {
      standoutNetworks.push({
        network,
        direction: 'low',
        deviation: Math.round((typical.min - value) * 100),
      })
    }
  }

  // Normalize: 0 deviation = 0 uniqueness, max possible deviation = 1
  const maxPossibleDeviation = entries.length * 0.5 // Each network can deviate by max 0.5
  const score = Math.min(totalDeviation / maxPossibleDeviation, 1)

  return {
    score: Math.round(score * 100) / 100,
    standoutNetworks: standoutNetworks.sort((a, b) => b.deviation - a.deviation).slice(0, 3),
  }
}

// ============================================
// POLARITY 1.2 - CONSOLIDATION TRACKING
// ============================================

export interface ConsolidatedTaste {
  type: 'genre' | 'artist' | 'decade' | 'pattern'
  name: string
  strength: number  // 0-1 how consolidated
  consistency: number  // How consistent over time
  trend: 'strengthening' | 'stable' | 'fading'
}

/**
 * Compute taste consolidation - what tastes are "sticking"
 * Based on Polarity's memory consolidation concept
 */
export function computeTasteConsolidation(
  reviews: Array<{ rating: number; createdAt: Date; album: { genres: string[]; artistName: string; releaseDate: Date } }>,
  genreVector: Record<string, number>,
  artistDNA: Array<{ artistName: string; weight: number; avgRating: number; reviewCount: number }>
): ConsolidatedTaste[] {
  const consolidated: ConsolidatedTaste[] = []
  const now = new Date()
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)

  const recentReviews = reviews.filter(r => r.createdAt > sixMonthsAgo)
  const olderReviews = reviews.filter(r => r.createdAt <= sixMonthsAgo)

  // ===========================================
  // GENRE CONSOLIDATION
  // ===========================================
  const recentGenreCounts: Record<string, { count: number; totalRating: number }> = {}
  const olderGenreCounts: Record<string, { count: number; totalRating: number }> = {}

  recentReviews.forEach(r => {
    r.album.genres.forEach(g => {
      const genre = g.toLowerCase()
      if (!recentGenreCounts[genre]) recentGenreCounts[genre] = { count: 0, totalRating: 0 }
      recentGenreCounts[genre].count++
      recentGenreCounts[genre].totalRating += r.rating
    })
  })

  olderReviews.forEach(r => {
    r.album.genres.forEach(g => {
      const genre = g.toLowerCase()
      if (!olderGenreCounts[genre]) olderGenreCounts[genre] = { count: 0, totalRating: 0 }
      olderGenreCounts[genre].count++
      olderGenreCounts[genre].totalRating += r.rating
    })
  })

  // Find genres that are consolidated (present in both periods with good ratings)
  const allGenres = new Set([...Object.keys(recentGenreCounts), ...Object.keys(olderGenreCounts)])
  allGenres.forEach(genre => {
    const recent = recentGenreCounts[genre]
    const older = olderGenreCounts[genre]

    if (recent && older && recent.count >= 2 && older.count >= 2) {
      const recentAvg = recent.totalRating / recent.count
      const olderAvg = older.totalRating / older.count
      const vectorStrength = genreVector[genre] || 0

      // High ratings in both periods = consolidated
      if (recentAvg >= 6 && olderAvg >= 6) {
        const trend = recentAvg > olderAvg + 0.5
          ? 'strengthening'
          : recentAvg < olderAvg - 0.5
          ? 'fading'
          : 'stable'

        consolidated.push({
          type: 'genre',
          name: genre,
          strength: vectorStrength,
          consistency: 1 - Math.abs(recentAvg - olderAvg) / 10,
          trend,
        })
      }
    }
  })

  // ===========================================
  // ARTIST CONSOLIDATION
  // ===========================================
  const artistHistory: Record<string, { ratings: number[]; recent: boolean; older: boolean }> = {}

  reviews.forEach(r => {
    const artist = r.album.artistName
    if (!artistHistory[artist]) {
      artistHistory[artist] = { ratings: [], recent: false, older: false }
    }
    artistHistory[artist].ratings.push(r.rating)
    if (r.createdAt > sixMonthsAgo) {
      artistHistory[artist].recent = true
    } else {
      artistHistory[artist].older = true
    }
  })

  // Artists reviewed in both periods
  Object.entries(artistHistory)
    .filter(([, data]) => data.recent && data.older && data.ratings.length >= 3)
    .forEach(([artist, data]) => {
      const avgRating = data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length
      const dnaEntry = artistDNA.find(a => a.artistName === artist)

      if (avgRating >= 7) {
        consolidated.push({
          type: 'artist',
          name: artist,
          strength: dnaEntry?.weight || 0.5,
          consistency: 1 - (Math.max(...data.ratings) - Math.min(...data.ratings)) / 10,
          trend: 'stable', // Artists with consistent engagement are stable
        })
      }
    })

  // Sort by strength and return top entries
  return consolidated
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 10)
}

/**
 * Get a human-readable consolidation summary
 */
export function getConsolidationSummary(consolidated: ConsolidatedTaste[]): {
  headline: string
  details: string
  coreGenres: string[]
  coreArtists: string[]
} {
  const genres = consolidated.filter(c => c.type === 'genre')
  const artists = consolidated.filter(c => c.type === 'artist')
  const strengthening = consolidated.filter(c => c.trend === 'strengthening')
  const fading = consolidated.filter(c => c.trend === 'fading')

  let headline = 'Your taste is evolving.'
  let details = ''

  if (genres.length >= 3 && artists.length >= 2) {
    headline = 'Strong taste foundation.'
    details = `Your love for ${genres.slice(0, 2).map(g => g.name).join(' and ')} is well-established, along with consistent appreciation for ${artists.slice(0, 2).map(a => a.name).join(' and ')}.`
  } else if (genres.length >= 2) {
    headline = 'Core genres emerging.'
    details = `${genres[0].name} and ${genres[1]?.name || 'related sounds'} are becoming your musical home.`
  } else if (strengthening.length > fading.length) {
    headline = 'Taste is crystallizing.'
    details = 'Your preferences are becoming clearer and more defined.'
  } else if (fading.length > strengthening.length) {
    headline = 'Taste in flux.'
    details = "You're in an exploration phase - old favorites are making room for new discoveries."
  }

  return {
    headline,
    details,
    coreGenres: genres.slice(0, 3).map(g => g.name),
    coreArtists: artists.slice(0, 3).map(a => a.name),
  }
}

/**
 * Compare two listening signatures (for taste drift tracking)
 */
export function compareSignatures(
  current: ListeningSignature,
  previous: ListeningSignature
): {
  overallDrift: number  // 0-1, how much has changed
  networkChanges: Array<{
    network: string
    change: number  // positive = increased, negative = decreased
    direction: 'increased' | 'decreased' | 'stable'
  }>
  interpretation: string
} {
  const entries = Object.entries(current) as [keyof ListeningSignature, number][]
  let totalChange = 0
  const networkChanges: Array<{
    network: string
    change: number
    direction: 'increased' | 'decreased' | 'stable'
  }> = []

  for (const [network, currentValue] of entries) {
    const previousValue = previous[network] || 0
    const change = currentValue - previousValue
    totalChange += Math.abs(change)

    let direction: 'increased' | 'decreased' | 'stable' = 'stable'
    if (change > 0.05) direction = 'increased'
    else if (change < -0.05) direction = 'decreased'

    networkChanges.push({
      network,
      change: Math.round(change * 100),
      direction,
    })
  }

  const overallDrift = Math.min(totalChange / 2, 1) // Normalize

  // Generate interpretation
  const significantChanges = networkChanges.filter(c => Math.abs(c.change) > 5)
  let interpretation = 'Your listening signature has remained stable.'

  if (significantChanges.length > 0) {
    const increased = significantChanges.filter(c => c.direction === 'increased').map(c => c.network)
    const decreased = significantChanges.filter(c => c.direction === 'decreased').map(c => c.network)

    const parts: string[] = []
    if (increased.length > 0) {
      parts.push(`More ${increased.join(', ')} mode`)
    }
    if (decreased.length > 0) {
      parts.push(`less ${decreased.join(', ')} mode`)
    }
    interpretation = `Your taste is evolving: ${parts.join(', ')}.`
  }

  return {
    overallDrift: Math.round(overallDrift * 100) / 100,
    networkChanges: networkChanges.sort((a, b) => Math.abs(b.change) - Math.abs(a.change)),
    interpretation,
  }
}

// ============================================
// POLARITY 1.2 - ENHANCED TASTE MATCHING
// Dating-app style connection discovery
// ============================================

export type ConnectionMatchType =
  | 'taste_twin'        // Very similar overall taste (>80% match)
  | 'opposite_attracts' // Complementary different tastes
  | 'network_resonance' // Strong alignment in specific networks
  | 'explorer_guide'    // One can introduce the other to new music
  | 'complementary'     // Different but complementary tastes
  | 'genre_buddy'       // Shared genre preferences

export interface EnhancedTasteMatch {
  userId: string
  username: string
  image: string | null
  overallScore: number           // 0-100 compatibility
  matchType: ConnectionMatchType
  matchStrength: number          // 0-1 algorithm confidence

  // Signature comparison
  signatureSimilarity: number    // 0-1 cosine similarity
  networkResonance: Record<string, number>   // Which networks align
  networkContrast: Record<string, number>    // Complementary differences

  // Traditional metrics
  genreOverlap: number
  artistOverlap: number
  ratingAlignment: number

  // Shared elements
  sharedGenres: string[]
  sharedArtists: string[]
  sharedAlbums: string[]

  // Discovery potential
  potentialIntroductions: string[]  // Genres/artists they could introduce you to

  // Archetype info
  archetype: string
  archetypeIcon: string

  // Connection context
  connectionReason: string       // Human-readable explanation
  compatibilityHighlights: string[]
}

/**
 * Network keys used for signature operations
 */
const SIGNATURE_NETWORKS = [
  'discovery',
  'comfort',
  'deep_dive',
  'reactive',
  'emotional',
  'social',
  'aesthetic',
] as const satisfies readonly (keyof ListeningSignature)[]

/**
 * Compute cosine similarity between two listening signatures
 */
export function computeSignatureSimilarity(sig1: ListeningSignature, sig2: ListeningSignature): number {
  let dotProduct = 0
  let norm1 = 0
  let norm2 = 0

  for (const network of SIGNATURE_NETWORKS) {
    const v1 = sig1[network] || 0
    const v2 = sig2[network] || 0
    dotProduct += v1 * v2
    norm1 += v1 * v1
    norm2 += v2 * v2
  }

  if (norm1 === 0 || norm2 === 0) return 0
  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2))
}

/**
 * Compute network resonance - how much each network aligns between two users
 */
export function computeNetworkResonance(
  sig1: ListeningSignature,
  sig2: ListeningSignature
): Record<string, number> {
  const resonance: Record<string, number> = {}

  for (const network of SIGNATURE_NETWORKS) {
    const v1 = sig1[network] || 0
    const v2 = sig2[network] || 0
    // Resonance is high when both are high, low when either is low
    resonance[network] = Math.min(v1, v2) * (1 - Math.abs(v1 - v2))
  }

  return resonance
}

/**
 * Compute network contrast - where two users differ most
 */
export function computeNetworkContrast(
  sig1: ListeningSignature,
  sig2: ListeningSignature
): Record<string, number> {
  const contrast: Record<string, number> = {}

  for (const network of SIGNATURE_NETWORKS) {
    const v1 = sig1[network] || 0
    const v2 = sig2[network] || 0
    contrast[network] = v2 - v1  // Positive means user2 is higher
  }

  return contrast
}

/**
 * Determine match type based on comprehensive analysis
 */
export function determineMatchType(
  overallScore: number,
  signatureSimilarity: number,
  genreOverlap: number,
  networkResonance: Record<string, number>,
  networkContrast: Record<string, number>,
  adventureness1: number,
  adventureness2: number
): ConnectionMatchType {
  // Taste Twin: Very similar overall (>80%)
  if (overallScore > 80 && signatureSimilarity > 0.8) {
    return 'taste_twin'
  }

  // Check for strong network resonance in specific networks
  const resonanceValues = Object.values(networkResonance)
  const maxResonance = Math.max(...resonanceValues)
  if (maxResonance > 0.15 && signatureSimilarity > 0.5) {
    return 'network_resonance'
  }

  // Explorer Guide: One is adventurous, other is not
  const adventurenessDiff = Math.abs(adventureness1 - adventureness2)
  if (adventurenessDiff > 0.3) {
    return 'explorer_guide'
  }

  // Opposite Attracts: Low similarity but potential for expansion
  if (signatureSimilarity < 0.4 && genreOverlap < 0.3) {
    const contrastValues = Object.values(networkContrast).map(Math.abs)
    const maxContrast = Math.max(...contrastValues)
    if (maxContrast > 0.2) {
      return 'opposite_attracts'
    }
  }

  // Complementary: Moderate differences that balance each other
  if (signatureSimilarity >= 0.4 && signatureSimilarity < 0.7) {
    return 'complementary'
  }

  // Genre Buddy: Shared genre preferences
  if (genreOverlap > 0.5) {
    return 'genre_buddy'
  }

  return 'complementary'
}

/**
 * Generate connection reason based on match analysis
 */
export function generateConnectionReason(
  matchType: ConnectionMatchType,
  sharedGenres: string[],
  networkResonance: Record<string, number>,
  networkContrast: Record<string, number>
): string {
  const topResonanceNetwork = Object.entries(networkResonance)
    .sort((a, b) => b[1] - a[1])[0]?.[0]

  const contrastEntries = Object.entries(networkContrast).sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
  const topContrastEntry = contrastEntries[0]

  switch (matchType) {
    case 'taste_twin':
      return `You're musical twins! ${sharedGenres.length > 0 ? `Both deeply into ${sharedGenres.slice(0, 2).join(' and ')}.` : 'Remarkably similar listening patterns.'}`

    case 'network_resonance':
      return `Strong ${topResonanceNetwork?.replace('_', ' ') || 'listening'} energy alignment. You both engage with music in similar ways.`

    case 'explorer_guide':
      return 'One of you is a musical explorer who could introduce the other to new sounds.'

    case 'opposite_attracts':
      if (topContrastEntry) {
        const [networkName, value] = topContrastEntry
        const direction = value > 0 ? 'more' : 'less'
        return `Different but fascinating. They're ${direction} ${networkName.replace('_', ' ')}-driven than you.`
      }
      return 'Different tastes that could expand your horizons.'

    case 'complementary':
      return `Your tastes complement each other well${sharedGenres.length > 0 ? `, especially in ${sharedGenres[0]}` : ''}.`

    case 'genre_buddy':
      return `Fellow ${sharedGenres[0] || 'music'} enthusiast! Great for deep conversations about the genre.`

    default:
      return 'Interesting musical connection potential.'
  }
}

/**
 * Generate compatibility highlights
 */
export function generateCompatibilityHighlights(
  matchType: ConnectionMatchType,
  sharedGenres: string[],
  sharedArtists: string[],
  networkResonance: Record<string, number>,
  signatureSimilarity: number
): string[] {
  const highlights: string[] = []

  // Add shared genre highlight
  if (sharedGenres.length > 0) {
    highlights.push(`Both love ${sharedGenres[0]}`)
  }

  // Add shared artist highlight
  if (sharedArtists.length > 0) {
    highlights.push(`Shared appreciation for ${sharedArtists[0]}`)
  }

  // Add signature similarity highlight
  if (signatureSimilarity > 0.7) {
    highlights.push('Very similar listening patterns')
  } else if (signatureSimilarity < 0.3) {
    highlights.push('Fresh perspectives to share')
  }

  // Add top resonance network
  const topResonance = Object.entries(networkResonance)
    .sort((a, b) => b[1] - a[1])[0]
  if (topResonance && topResonance[1] > 0.1) {
    const networkName = topResonance[0].replace('_', ' ')
    highlights.push(`Strong ${networkName} connection`)
  }

  // Match type specific
  switch (matchType) {
    case 'taste_twin':
      highlights.push('Potential best music friend')
      break
    case 'opposite_attracts':
      highlights.push('Great for discovering new music')
      break
    case 'explorer_guide':
      highlights.push('Musical mentor/mentee potential')
      break
    case 'network_resonance':
      highlights.push('Deep musical understanding')
      break
  }

  return highlights.slice(0, 4)
}

/**
 * Find potential genre/artist introductions one user could make to another
 */
export function findPotentialIntroductions(
  taste1TopGenres: string[],
  taste2TopGenres: string[],
  taste1TopArtists: string[],
  taste2TopArtists: string[]
): string[] {
  const introductions: string[] = []

  // Genres taste2 has that taste1 doesn't
  const newGenres = taste2TopGenres.filter(g => !taste1TopGenres.includes(g))
  introductions.push(...newGenres.slice(0, 2).map(g => `${g} music`))

  // Artists taste2 has that taste1 doesn't
  const newArtists = taste2TopArtists.filter(a => !taste1TopArtists.includes(a))
  introductions.push(...newArtists.slice(0, 2))

  return introductions.slice(0, 4)
}

/**
 * Enhanced taste match discovery - Polarity 1.2 powered
 * Find potential connections with rich comparison data
 */
export async function discoverTasteConnections(
  userId: string,
  options: {
    limit?: number
    matchTypes?: ConnectionMatchType[]
    minReviews?: number
  } = {}
): Promise<EnhancedTasteMatch[]> {
  const { limit = 20, matchTypes, minReviews = 20 } = options

  // Get user's TasteID
  const userTaste = await prisma.tasteID.findUnique({
    where: { userId },
    include: { user: { select: { id: true } } },
  })

  if (!userTaste) return []

  const userSignature = userTaste.listeningSignature as ListeningSignature | null
  const userGenres = userTaste.genreVector as GenreVector

  // Get potential matches (users with enough reviews and TasteIDs)
  const candidates = await prisma.tasteID.findMany({
    where: {
      userId: { not: userId },
      reviewCount: { gte: minReviews },
    },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
        },
      },
    },
    take: 100, // Sample for performance
  })

  // Score and analyze each candidate
  const matches: EnhancedTasteMatch[] = []

  for (const candidate of candidates) {
    if (!candidate.user.username) continue

    const candSignature = candidate.listeningSignature as ListeningSignature | null
    const candGenres = candidate.genreVector as GenreVector

    // 1. Compute genre overlap
    const genreOverlap = computeCosineSimilarity(userGenres, candGenres)

    // 2. Compute artist overlap
    const userArtists = new Set(userTaste.topArtists)
    const candArtists = new Set(candidate.topArtists)
    const sharedArtists = [...userArtists].filter(a => candArtists.has(a))
    const artistOverlap = sharedArtists.length / Math.max(userArtists.size, candArtists.size, 1)

    // 3. Rating alignment
    const ratingDiff = Math.abs(userTaste.averageRating - candidate.averageRating)
    const ratingAlignment = Math.max(0, 1 - ratingDiff / 5)

    // 4. Signature-based analysis (Polarity 1.2)
    let signatureSimilarity = 0.5  // Default if no signatures
    let networkResonance: Record<string, number> = {}
    let networkContrast: Record<string, number> = {}

    if (userSignature && candSignature) {
      signatureSimilarity = computeSignatureSimilarity(userSignature, candSignature)
      networkResonance = computeNetworkResonance(userSignature, candSignature)
      networkContrast = computeNetworkContrast(userSignature, candSignature)
    }

    // 5. Determine match type
    const matchType = determineMatchType(
      genreOverlap * 40 + artistOverlap * 30 + ratingAlignment * 20 + signatureSimilarity * 10,
      signatureSimilarity,
      genreOverlap,
      networkResonance,
      networkContrast,
      userTaste.adventurenessScore,
      candidate.adventurenessScore
    )

    // Filter by requested match types if specified
    if (matchTypes && !matchTypes.includes(matchType)) continue

    // 6. Compute overall score
    const overallScore = Math.round(
      genreOverlap * 35 +
      artistOverlap * 25 +
      ratingAlignment * 15 +
      signatureSimilarity * 25
    )

    // 7. Match strength (algorithm confidence)
    const matchStrength = userSignature && candSignature
      ? 0.8 + Math.min(userTaste.reviewCount, candidate.reviewCount) / 500 * 0.2
      : 0.5

    // 8. Shared genres
    const sharedGenres = userTaste.topGenres.filter(g => candidate.topGenres.includes(g))

    // 9. Connection reason and highlights
    const connectionReason = generateConnectionReason(matchType, sharedGenres, networkResonance, networkContrast)
    const compatibilityHighlights = generateCompatibilityHighlights(
      matchType, sharedGenres, sharedArtists, networkResonance, signatureSimilarity
    )

    // 10. Potential introductions
    const potentialIntroductions = findPotentialIntroductions(
      userTaste.topGenres, candidate.topGenres,
      userTaste.topArtists, candidate.topArtists
    )

    // Get archetype info
    const archetypeInfo = getArchetypeInfo(candidate.primaryArchetype)

    matches.push({
      userId: candidate.userId,
      username: candidate.user.username,
      image: candidate.user.image,
      overallScore,
      matchType,
      matchStrength,
      signatureSimilarity: Math.round(signatureSimilarity * 100) / 100,
      networkResonance,
      networkContrast,
      genreOverlap: Math.round(genreOverlap * 100),
      artistOverlap: Math.round(artistOverlap * 100),
      ratingAlignment: Math.round(ratingAlignment * 100),
      sharedGenres,
      sharedArtists,
      sharedAlbums: [], // Populated separately if needed
      potentialIntroductions,
      archetype: archetypeInfo.name,
      archetypeIcon: archetypeInfo.icon,
      connectionReason,
      compatibilityHighlights,
    })
  }

  // Sort by overall score and return top matches
  return matches
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit)
}

/**
 * Find "Opposite Attracts" connections - people with complementary different tastes
 */
export async function findOppositeAttracts(
  userId: string,
  limit: number = 10
): Promise<EnhancedTasteMatch[]> {
  return discoverTasteConnections(userId, {
    limit,
    matchTypes: ['opposite_attracts', 'complementary', 'explorer_guide'],
  })
}

/**
 * Find "Taste Twins" - people with very similar taste
 */
export async function findTasteTwins(
  userId: string,
  limit: number = 10
): Promise<EnhancedTasteMatch[]> {
  return discoverTasteConnections(userId, {
    limit,
    matchTypes: ['taste_twin', 'network_resonance', 'genre_buddy'],
  })
}

/**
 * Find "Explorer Guides" - people who can introduce you to new music
 */
export async function findExplorerGuides(
  userId: string,
  limit: number = 10
): Promise<EnhancedTasteMatch[]> {
  return discoverTasteConnections(userId, {
    limit,
    matchTypes: ['explorer_guide', 'opposite_attracts'],
  })
}

/**
 * Save taste match to database
 */
export async function saveTasteMatch(
  user1Id: string,
  user2Id: string,
  match: EnhancedTasteMatch
): Promise<void> {
  // Sort IDs to maintain consistency (lower ID first)
  const [sortedUser1, sortedUser2] = [user1Id, user2Id].sort()

  await prisma.tasteMatch.upsert({
    where: {
      user1Id_user2Id: {
        user1Id: sortedUser1,
        user2Id: sortedUser2,
      },
    },
    update: {
      overallScore: match.overallScore,
      genreOverlap: match.genreOverlap,
      artistOverlap: match.artistOverlap,
      ratingAlignment: match.ratingAlignment,
      signatureSimilarity: match.signatureSimilarity,
      networkResonance: Object.values(match.networkResonance).reduce((a, b) => a + b, 0) / Math.max(Object.keys(match.networkResonance).length, 1),
      networkContrast: Object.values(match.networkContrast).reduce((a, b) => a + b, 0) / Math.max(Object.keys(match.networkContrast).length, 1),
      matchStrength: match.matchStrength,
      sharedGenres: match.sharedGenres,
      sharedArtists: match.sharedArtists,
      sharedAlbums: match.sharedAlbums,
      matchType: match.matchType,
      updatedAt: new Date(),
    },
    create: {
      user1Id: sortedUser1,
      user2Id: sortedUser2,
      overallScore: match.overallScore,
      genreOverlap: match.genreOverlap,
      artistOverlap: match.artistOverlap,
      ratingAlignment: match.ratingAlignment,
      signatureSimilarity: match.signatureSimilarity,
      networkResonance: Object.values(match.networkResonance).reduce((a, b) => a + b, 0) / Math.max(Object.keys(match.networkResonance).length, 1),
      networkContrast: Object.values(match.networkContrast).reduce((a, b) => a + b, 0) / Math.max(Object.keys(match.networkContrast).length, 1),
      matchStrength: match.matchStrength,
      sharedGenres: match.sharedGenres,
      sharedArtists: match.sharedArtists,
      sharedAlbums: match.sharedAlbums,
      matchType: match.matchType,
    },
  })
}
