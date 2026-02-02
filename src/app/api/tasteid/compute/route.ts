import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { successResponse, errorResponse } from '@/lib/api-utils'
import { computeTasteID, saveTasteID, createTasteIDSnapshot } from '@/lib/tasteid'
import {
  PatternLearningEngine,
  DriftDetector,
  ConsolidationEngine,
  type ReviewData,
  type EpisodeReview,
  type ListeningSignature,
  type RatingStyle,
} from '@/lib/polarity'

/**
 * POST /api/tasteid/compute
 * Compute or recompute the current user's TasteID
 */
export async function POST(request: NextRequest) {
  console.log('\n========================================')
  console.log('[TasteID API] Starting computation...')
  console.log('========================================\n')
  
  try {
    const session = await auth()
    if (!session?.user?.id) {
      console.log('[TasteID API] ERROR: No authenticated user')
      return errorResponse('Authentication required', 401)
    }

    const userId = session.user.id
    console.log('[TasteID API] User ID:', userId)

    // Check if user has enough reviews
    const reviewCount = await prisma.review.count({ where: { userId } })
    console.log('[TasteID API] Review count:', reviewCount)
    
    if (reviewCount < 3) {
      return errorResponse('Review at least 3 albums to generate your TasteID', 400)
    }

    // Compute TasteID
    console.log('[TasteID API] Computing TasteID...')
    const computation = await computeTasteID(userId)
    if (!computation) {
      console.log('[TasteID API] ERROR: computeTasteID returned null')
      return errorResponse('Could not compute TasteID', 500)
    }

    console.log('\n========================================')
    console.log('[TasteID API] COMPUTATION RESULT:')
    console.log('  Primary Archetype:', computation.primaryArchetype)
    console.log('  Secondary Archetype:', computation.secondaryArchetype)
    console.log('  Confidence:', (computation.archetypeConfidence * 100).toFixed(1) + '%')
    console.log('  Adventureness:', (computation.adventurenessScore * 100).toFixed(1) + '%')
    console.log('  Top Genres:', computation.topGenres.slice(0, 5).join(', '))
    console.log('========================================\n')

    // Save to database
    console.log('[TasteID API] Saving to database...')
    const tasteId = await saveTasteID(userId, computation)
    console.log('[TasteID API] Saved! TasteID:', tasteId.id)

    // Create monthly snapshot if this is a new computation
    await createTasteIDSnapshot(tasteId.id)

    // ============================================
    // POLARITY OS - Advanced Cognitive Modeling
    // ============================================
    console.log('\n[Polarity OS] Running cognitive modeling...')

    // Fetch full review data for pattern analysis
    const reviews = await prisma.review.findMany({
      where: { userId },
      include: { album: true },
      orderBy: { createdAt: 'asc' },
    })

    // Transform to Polarity OS format
    const reviewDataForPatterns: ReviewData[] = reviews.map(r => ({
      id: r.id,
      userId: r.userId,
      albumId: r.albumId,
      rating: r.rating,
      vibes: (r.vibes as string[]) || [],
      createdAt: r.createdAt,
      albumGenres: (r.album.genres as string[]) || [],
      artistName: r.album.artistName,
      releaseYear: r.album.releaseDate?.getFullYear() || new Date().getFullYear(),
    }))

    const episodeReviews: EpisodeReview[] = reviews.map(r => ({
      id: r.id,
      albumId: r.albumId,
      artistName: r.album.artistName,
      rating: r.rating,
      vibes: (r.vibes as string[]) || [],
      genres: (r.album.genres as string[]) || [],
      createdAt: r.createdAt,
    }))

    // Initialize engines
    const patternEngine = new PatternLearningEngine()
    const consolidationEngine = new ConsolidationEngine()
    const driftDetector = new DriftDetector()

    // Load previous state if exists
    if (tasteId.patternStates) {
      try {
        patternEngine.loadFromJSON(tasteId.patternStates as unknown as import('@/lib/polarity').PatternState[])
      } catch {
        console.log('[Polarity OS] Could not load previous pattern states')
      }
    }
    if (tasteId.episodeHistory) {
      try {
        consolidationEngine.loadFromJSON(tasteId.episodeHistory as unknown as {
          episodes: import('@/lib/polarity').Episode[]
          graph: { nodes: import('@/lib/polarity').CognitiveNode[]; edges: import('@/lib/polarity').CognitiveEdge[] }
        })
      } catch {
        console.log('[Polarity OS] Could not load previous episode history')
      }
    }
    if (tasteId.driftAlerts) {
      try {
        driftDetector.loadFromJSON(tasteId.driftAlerts as unknown as {
          alerts: import('@/lib/polarity').DriftAlert[]
          previousSignature: ListeningSignature | null
          previousRatingStyle: RatingStyle | null
          previousPatterns: string[]
        })
      } catch {
        console.log('[Polarity OS] Could not load previous drift state')
      }
    }

    // Run pattern detection
    console.log('[Polarity OS] Detecting patterns...')
    const patterns = patternEngine.detectPatternsFromReviews(reviewDataForPatterns)
    console.log(`[Polarity OS] Detected ${patterns.length} patterns:`, patterns.map(p => p.name).join(', '))

    // Extract episodes
    console.log('[Polarity OS] Extracting episodes...')
    const episodes = consolidationEngine.extractEpisodes(episodeReviews)
    console.log(`[Polarity OS] Extracted ${episodes.length} listening episodes`)

    // Compute consolidated tastes
    const consolidatedTastes = consolidationEngine.computeConsolidatedTastes(episodeReviews)
    console.log(`[Polarity OS] Consolidated ${consolidatedTastes.length} taste preferences`)

    // Learn edge weights between patterns and episodes
    consolidationEngine.learnEdgeWeights(patterns)

    // Run drift detection
    console.log('[Polarity OS] Checking for drift...')
    const patternDrifts = driftDetector.detectPatternDisappearance(patterns, reviewCount)
    const contradictions = driftDetector.detectContradictions(patterns)

    // Compute listening signature for drift detection
    const listeningSignature: ListeningSignature = {
      discovery: computation.listeningSignature?.discovery || 0,
      comfort: computation.listeningSignature?.comfort || 0,
      deepDive: computation.listeningSignature?.deep_dive || 0,
      reactive: computation.listeningSignature?.reactive || 0,
      emotional: computation.listeningSignature?.emotional || 0,
      social: computation.listeningSignature?.social || 0,
      aesthetic: computation.listeningSignature?.aesthetic || 0,
    }
    const signatureDrifts = driftDetector.detectSignatureDrift(listeningSignature)

    // Rating style drift
    const ratingStyle: RatingStyle = {
      average: computation.averageRating,
      stdDev: computation.ratingStdDev,
      skew: computation.ratingSkew as 'harsh' | 'lenient' | 'balanced',
    }
    const ratingDrifts = driftDetector.detectRatingStyleShift(ratingStyle)

    const allDrifts = [...patternDrifts, ...contradictions, ...signatureDrifts, ...ratingDrifts]
    console.log(`[Polarity OS] Detected ${allDrifts.length} drift alerts`)

    // Compute graph statistics
    const sortedPatterns = patternEngine.getPatternsSortedByImportance()
    const confirmedPatterns = patternEngine.getPatternsByStatus('confirmed')
    const emergingPatterns = patternEngine.getPatternsByStatus('emerging')

    // Calculate metrics
    const episodeStats = consolidationEngine.getEpisodeStats()
    const patternStability = confirmedPatterns.length / Math.max(1, patterns.length)
    const explorationRate = consolidatedTastes.filter(t => t.trend === 'strengthening').length /
      Math.max(1, consolidatedTastes.length)

    console.log('\n========================================')
    console.log('[Polarity OS] COGNITIVE ANALYSIS COMPLETE:')
    console.log('  Patterns:', patterns.length, `(${confirmedPatterns.length} confirmed, ${emergingPatterns.length} emerging)`)
    console.log('  Episodes:', episodes.length)
    console.log('  Drift Alerts:', allDrifts.length)
    console.log('  Pattern Stability:', (patternStability * 100).toFixed(1) + '%')
    console.log('  Exploration Rate:', (explorationRate * 100).toFixed(1) + '%')
    console.log('========================================\n')

    // Save Polarity OS results to database (serialize for Prisma JSON fields)
    await prisma.tasteID.update({
      where: { id: tasteId.id },
      data: {
        cognitiveGraph: JSON.parse(JSON.stringify(consolidationEngine.toJSON().graph)),
        patternStates: JSON.parse(JSON.stringify(patternEngine.toJSON())),
        driftAlerts: JSON.parse(JSON.stringify(driftDetector.toJSON())),
        episodeHistory: JSON.parse(JSON.stringify(consolidationEngine.toJSON())),
        patternStability,
        explorationRate,
        graphDensity: episodeStats.totalEpisodes > 0 ? Math.min(1, episodeStats.avgEpisodeLength / 10) : 0,
      },
    })
    console.log('[Polarity OS] Saved cognitive data to database')

    return successResponse({
      tasteId: {
        id: tasteId.id,
        primaryArchetype: tasteId.primaryArchetype,
        secondaryArchetype: tasteId.secondaryArchetype,
        archetypeConfidence: tasteId.archetypeConfidence,
        adventurenessScore: tasteId.adventurenessScore,
        polarityScore: tasteId.polarityScore,
        topGenres: tasteId.topGenres,
        topArtists: tasteId.topArtists,
        ratingSkew: tasteId.ratingSkew,
        reviewDepth: tasteId.reviewDepth,
        reviewCount: tasteId.reviewCount,
        averageRating: tasteId.averageRating,
      },
      polarityOS: {
        patterns: sortedPatterns.map(p => ({
          id: p.id,
          name: p.name,
          description: p.description,
          status: p.status,
          confidence: p.confidence,
          category: p.category,
        })),
        episodeCount: episodes.length,
        episodeStats,
        driftAlerts: driftDetector.getSignificantDrifts().slice(0, 5),
        consolidatedTastes: consolidatedTastes.slice(0, 10),
        metrics: {
          patternStability,
          explorationRate,
          graphDensity: episodeStats.totalEpisodes > 0 ? Math.min(1, episodeStats.avgEpisodeLength / 10) : 0,
        },
      },
      message: 'TasteID computed successfully with Polarity OS cognitive modeling',
    })
  } catch (error) {
    console.error('[TasteID API] ERROR:', error)
    return errorResponse('Failed to compute TasteID', 500)
  }
}
