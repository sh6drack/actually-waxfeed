import { prisma } from './prisma'

const SPOTIFY_API_BASE = 'https://api.spotify.com/v1'
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token'

// Cache durations in milliseconds
const CACHE_DURATION = {
  ALBUM: 24 * 60 * 60 * 1000, // 24 hours
  SEARCH: 60 * 60 * 1000, // 1 hour
  ARTIST: 7 * 24 * 60 * 60 * 1000, // 7 days
}

interface SpotifyToken {
  access_token: string
  token_type: string
  expires_in: number
}

interface SpotifyImage {
  url: string
  height: number
  width: number
}

interface SpotifyArtist {
  id: string
  name: string
  genres?: string[]
  images?: SpotifyImage[]
  popularity?: number
  external_urls: { spotify: string }
}

interface SpotifyTrack {
  id: string
  name: string
  track_number: number
  disc_number: number
  duration_ms: number
  preview_url: string | null
  external_urls: { spotify: string }
}

interface SpotifyAlbum {
  id: string
  name: string
  album_type: string
  release_date: string
  release_date_precision: string
  total_tracks: number
  images: SpotifyImage[]
  artists: SpotifyArtist[]
  genres: string[]
  tracks?: { items: SpotifyTrack[] }
  external_urls: { spotify: string }
}

interface SpotifySearchResult {
  albums: {
    items: SpotifyAlbum[]
    total: number
    offset: number
    limit: number
  }
}

// Token management
let cachedToken: { token: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  // Return cached token if still valid
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60000) {
    return cachedToken.token
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('Spotify credentials not configured')
  }

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    throw new Error('Failed to get Spotify access token')
  }

  const data: SpotifyToken = await response.json()

  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.token
}

// Cache helpers
async function getFromCache<T>(key: string): Promise<T | null> {
  const cached = await prisma.spotifyCache.findUnique({
    where: { key },
  })

  if (!cached || new Date() > cached.expiresAt) {
    if (cached) {
      // Clean up expired cache
      await prisma.spotifyCache.delete({ where: { key } }).catch(() => {})
    }
    return null
  }

  return cached.data as T
}

async function setCache(key: string, data: unknown, duration: number): Promise<void> {
  await prisma.spotifyCache.upsert({
    where: { key },
    update: {
      data: data as object,
      expiresAt: new Date(Date.now() + duration),
    },
    create: {
      key,
      data: data as object,
      expiresAt: new Date(Date.now() + duration),
    },
  })
}

// API methods
export async function searchAlbums(
  query: string,
  limit = 20,
  offset = 0,
  type: 'album' | 'compilation' | 'all' = 'all'  // Removed 'single' option - not allowed
): Promise<{ albums: SpotifyAlbum[]; total: number }> {
  const cacheKey = `search:${query}:${limit}:${offset}:${type}`
  const cached = await getFromCache<SpotifySearchResult>(cacheKey)

  if (cached) {
    // Filter out singles from cached results
    const filteredAlbums = cached.albums.items.filter(a => a.album_type !== 'single')
    return { albums: filteredAlbums, total: filteredAlbums.length }
  }

  const token = await getAccessToken()

  let searchQuery = query
  if (type !== 'all') {
    searchQuery = `${query} type:${type}`
  }

  const response = await fetch(
    `${SPOTIFY_API_BASE}/search?q=${encodeURIComponent(searchQuery)}&type=album&limit=${limit}&offset=${offset}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!response.ok) {
    throw new Error(`Spotify search failed: ${response.statusText}`)
  }

  const data: SpotifySearchResult = await response.json()

  // CRITICAL: Filter out ALL singles before caching and returning
  data.albums.items = data.albums.items.filter(album => album.album_type !== 'single')

  await setCache(cacheKey, data, CACHE_DURATION.SEARCH)

  return { albums: data.albums.items, total: data.albums.items.length }
}

export async function getAlbum(spotifyId: string, fetchTracks = true): Promise<SpotifyAlbum> {
  const cacheKey = `album:${spotifyId}:${fetchTracks}`
  const cached = await getFromCache<SpotifyAlbum>(cacheKey)

  if (cached) {
    return cached
  }

  const token = await getAccessToken()

  const response = await fetch(
    `${SPOTIFY_API_BASE}/albums/${spotifyId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get album: ${response.statusText}`)
  }

  const data: SpotifyAlbum = await response.json()
  await setCache(cacheKey, data, CACHE_DURATION.ALBUM)

  return data
}

export async function getArtist(spotifyId: string): Promise<SpotifyArtist> {
  const cacheKey = `artist:${spotifyId}`
  const cached = await getFromCache<SpotifyArtist>(cacheKey)

  if (cached) {
    return cached
  }

  const token = await getAccessToken()

  const response = await fetch(
    `${SPOTIFY_API_BASE}/artists/${spotifyId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to get artist: ${response.statusText}`)
  }

  const data: SpotifyArtist = await response.json()
  await setCache(cacheKey, data, CACHE_DURATION.ARTIST)

  return data
}

// Bulk operations for mass import
export async function getMultipleAlbums(spotifyIds: string[]): Promise<SpotifyAlbum[]> {
  // Spotify API allows max 20 albums per request
  const chunks: string[][] = []
  for (let i = 0; i < spotifyIds.length; i += 20) {
    chunks.push(spotifyIds.slice(i, i + 20))
  }

  const token = await getAccessToken()
  const results: SpotifyAlbum[] = []

  for (const chunk of chunks) {
    // Check cache first
    const uncachedIds: string[] = []
    for (const id of chunk) {
      const cached = await getFromCache<SpotifyAlbum>(`album:${id}:true`)
      if (cached) {
        results.push(cached)
      } else {
        uncachedIds.push(id)
      }
    }

    if (uncachedIds.length === 0) continue

    const response = await fetch(
      `${SPOTIFY_API_BASE}/albums?ids=${uncachedIds.join(',')}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )

    if (!response.ok) {
      console.error(`Failed to get albums batch: ${response.statusText}`)
      continue
    }

    const data: { albums: SpotifyAlbum[] } = await response.json()

    for (const album of data.albums) {
      if (album) {
        results.push(album)
        await setCache(`album:${album.id}:true`, album, CACHE_DURATION.ALBUM)
      }
    }

    // Rate limiting: wait 100ms between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return results
}

// Import album to database
export async function importAlbumToDatabase(spotifyAlbum: SpotifyAlbum) {
  // CRITICAL: NEVER import singles - only albums and compilations
  // This is a site-wide policy to maintain quality content
  if (spotifyAlbum.album_type === 'single') {
    throw new Error('Singles are not supported - albums and EPs only')
  }

  const primaryArtist = spotifyAlbum.artists[0]

  // Get artist details for genres
  let genres = spotifyAlbum.genres
  if (genres.length === 0 && primaryArtist) {
    try {
      const artist = await getArtist(primaryArtist.id)
      genres = artist.genres || []
    } catch {
      genres = []
    }
  }

  // Parse release date
  let releaseDate: Date
  const precision = spotifyAlbum.release_date_precision
  const parts = spotifyAlbum.release_date.split('-')

  if (precision === 'day') {
    releaseDate = new Date(spotifyAlbum.release_date)
  } else if (precision === 'month') {
    releaseDate = new Date(`${parts[0]}-${parts[1]}-01`)
  } else {
    releaseDate = new Date(`${parts[0]}-01-01`)
  }

  // Get image URLs at different sizes
  const images = spotifyAlbum.images.sort((a, b) => (b.width || 0) - (a.width || 0))
  const coverArtUrlLarge = images[0]?.url || null
  const coverArtUrlMedium = images.find(i => (i.width || 0) <= 300)?.url || coverArtUrlLarge
  const coverArtUrlSmall = images.find(i => (i.width || 0) <= 64)?.url || coverArtUrlMedium

  // Upsert album
  const album = await prisma.album.upsert({
    where: { spotifyId: spotifyAlbum.id },
    update: {
      title: spotifyAlbum.name,
      artistName: primaryArtist?.name || 'Unknown Artist',
      artistSpotifyId: primaryArtist?.id,
      releaseDate,
      releaseDatePrecision: precision,
      coverArtUrl: coverArtUrlLarge,
      coverArtUrlSmall,
      coverArtUrlMedium,
      coverArtUrlLarge,
      genres,
      albumType: spotifyAlbum.album_type,
      totalTracks: spotifyAlbum.total_tracks,
      spotifyUrl: spotifyAlbum.external_urls.spotify,
      lastSyncedAt: new Date(),
    },
    create: {
      spotifyId: spotifyAlbum.id,
      title: spotifyAlbum.name,
      artistName: primaryArtist?.name || 'Unknown Artist',
      artistSpotifyId: primaryArtist?.id,
      releaseDate,
      releaseDatePrecision: precision,
      coverArtUrl: coverArtUrlLarge,
      coverArtUrlSmall,
      coverArtUrlMedium,
      coverArtUrlLarge,
      genres,
      albumType: spotifyAlbum.album_type,
      totalTracks: spotifyAlbum.total_tracks,
      spotifyUrl: spotifyAlbum.external_urls.spotify,
    },
  })

  // Upsert tracks if available
  if (spotifyAlbum.tracks?.items) {
    for (const track of spotifyAlbum.tracks.items) {
      await prisma.track.upsert({
        where: { spotifyId: track.id },
        update: {
          name: track.name,
          trackNumber: track.track_number,
          discNumber: track.disc_number,
          durationMs: track.duration_ms,
          previewUrl: track.preview_url,
          spotifyUrl: track.external_urls.spotify,
        },
        create: {
          spotifyId: track.id,
          albumId: album.id,
          name: track.name,
          trackNumber: track.track_number,
          discNumber: track.disc_number,
          durationMs: track.duration_ms,
          previewUrl: track.preview_url,
          spotifyUrl: track.external_urls.spotify,
        },
      })
    }
  }

  return album
}

// Bulk import function for mass album import
export async function bulkImportAlbums(spotifyIds: string[]): Promise<{
  imported: number
  failed: number
  errors: string[]
}> {
  const results = { imported: 0, failed: 0, errors: [] as string[] }

  const albums = await getMultipleAlbums(spotifyIds)

  for (const album of albums) {
    try {
      await importAlbumToDatabase(album)
      results.imported++
    } catch (error) {
      results.failed++
      results.errors.push(`${album.id}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  return results
}

// Search and import - combines search with database import
export async function searchAndImportAlbums(
  query: string,
  limit = 20
): Promise<{ albums: Awaited<ReturnType<typeof prisma.album.findUnique>>[] }> {
  const { albums: spotifyAlbums } = await searchAlbums(query, limit)

  const importedAlbums = []
  for (const spotifyAlbum of spotifyAlbums) {
    const album = await importAlbumToDatabase(spotifyAlbum)
    importedAlbums.push(album)
  }

  return { albums: importedAlbums }
}

// Clean up expired cache entries
export async function cleanupExpiredCache(): Promise<number> {
  const result = await prisma.spotifyCache.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  })
  return result.count
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO ANALYSIS - Real waveform data from Spotify
// ═══════════════════════════════════════════════════════════════════════════════

interface SpotifyAudioAnalysis {
  segments: Array<{
    start: number
    duration: number
    loudness_start: number
    loudness_max: number
    loudness_max_time: number
  }>
  track: {
    duration: number
    tempo: number
    time_signature: number
  }
}

interface TrackSearchResult {
  tracks: {
    items: Array<{
      id: string
      name: string
      artists: Array<{ name: string }>
      duration_ms: number
    }>
  }
}

// Search for a track on Spotify to get its ID
export async function searchTrack(
  trackName: string,
  artistName: string
): Promise<string | null> {
  const cacheKey = `track:search:${trackName}:${artistName}`
  const cached = await getFromCache<{ trackId: string }>(cacheKey)

  if (cached) {
    return cached.trackId
  }

  const token = await getAccessToken()
  const query = encodeURIComponent(`track:${trackName} artist:${artistName}`)

  const response = await fetch(
    `${SPOTIFY_API_BASE}/search?q=${query}&type=track&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) {
    console.error('Spotify track search failed:', response.statusText)
    return null
  }

  const data: TrackSearchResult = await response.json()
  const track = data.tracks?.items?.[0]

  if (!track) {
    return null
  }

  await setCache(cacheKey, { trackId: track.id }, CACHE_DURATION.ALBUM)
  return track.id
}

// Get audio analysis for a track - returns waveform data
export async function getAudioAnalysis(
  spotifyTrackId: string
): Promise<number[] | null> {
  const cacheKey = `audio:analysis:${spotifyTrackId}`
  const cached = await getFromCache<{ waveform: number[] }>(cacheKey)

  if (cached) {
    return cached.waveform
  }

  const token = await getAccessToken()

  const response = await fetch(
    `${SPOTIFY_API_BASE}/audio-analysis/${spotifyTrackId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) {
    console.error('Audio analysis failed:', response.statusText)
    return null
  }

  const data: SpotifyAudioAnalysis = await response.json()

  // Convert segments to 40-bar waveform
  // Normalize loudness values (typically -60 to 0 dB) to 0-1 range
  const waveform = segmentsToWaveform(data.segments, 40)

  await setCache(cacheKey, { waveform }, CACHE_DURATION.ALBUM)
  return waveform
}

// Convert audio segments to a fixed-length waveform array
function segmentsToWaveform(
  segments: SpotifyAudioAnalysis['segments'],
  barCount: number
): number[] {
  if (!segments || segments.length === 0) {
    return Array(barCount).fill(0.3)
  }

  const totalDuration = segments[segments.length - 1].start + segments[segments.length - 1].duration
  const segmentDuration = totalDuration / barCount
  const waveform: number[] = []

  for (let i = 0; i < barCount; i++) {
    const startTime = i * segmentDuration
    const endTime = (i + 1) * segmentDuration

    // Find segments in this time range
    const relevantSegments = segments.filter(
      s => s.start < endTime && s.start + s.duration > startTime
    )

    if (relevantSegments.length === 0) {
      waveform.push(0.2)
      continue
    }

    // Average the loudness_max values
    const avgLoudness = relevantSegments.reduce((sum, s) => sum + s.loudness_max, 0) / relevantSegments.length

    // Normalize: loudness typically ranges from -60 to 0 dB
    // Map to 0.15 - 1.0 range for visual appeal
    const normalized = Math.max(0.15, Math.min(1, (avgLoudness + 60) / 60))
    waveform.push(normalized)
  }

  return waveform
}

// Get waveform for a track by searching Spotify
export async function getTrackWaveform(
  trackName: string,
  artistName: string
): Promise<number[] | null> {
  try {
    const trackId = await searchTrack(trackName, artistName)
    if (!trackId) return null

    return await getAudioAnalysis(trackId)
  } catch (error) {
    console.error('Failed to get track waveform:', error)
    return null
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AUDIO FEATURES - For TasteID/Audio DNA prediction system
// ═══════════════════════════════════════════════════════════════════════════════

export interface SpotifyAudioFeatures {
  id: string                 // Spotify track ID
  danceability: number       // 0-1: How suitable for dancing
  energy: number             // 0-1: Perceptual intensity (fast, loud, noisy)
  key: number                // 0-11: Pitch class (C, C#, D, etc.)
  loudness: number           // dB: Overall loudness (-60 to 0)
  mode: number               // 0 = minor, 1 = major
  speechiness: number        // 0-1: Presence of spoken words
  acousticness: number       // 0-1: Confidence it's acoustic
  instrumentalness: number   // 0-1: Predicts no vocals (>0.5 = instrumental)
  liveness: number           // 0-1: Presence of audience (live recording)
  valence: number            // 0-1: Musical positiveness/happiness
  tempo: number              // BPM
  duration_ms: number        // Track duration
  time_signature: number     // Beats per measure
}

// Cache duration for audio features (30 days - they don't change)
const AUDIO_FEATURES_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000

/**
 * Get audio features for a single track
 */
export async function getAudioFeatures(
  spotifyTrackId: string
): Promise<SpotifyAudioFeatures | null> {
  const cacheKey = `audio:features:${spotifyTrackId}`
  const cached = await getFromCache<SpotifyAudioFeatures>(cacheKey)

  if (cached) {
    return cached
  }

  const token = await getAccessToken()

  const response = await fetch(
    `${SPOTIFY_API_BASE}/audio-features/${spotifyTrackId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!response.ok) {
    console.error(`Audio features failed for ${spotifyTrackId}:`, response.statusText)
    return null
  }

  const data: SpotifyAudioFeatures = await response.json()
  await setCache(cacheKey, data, AUDIO_FEATURES_CACHE_DURATION)

  return data
}

/**
 * Get audio features for multiple tracks (batch - up to 100)
 */
export async function getBatchAudioFeatures(
  spotifyTrackIds: string[]
): Promise<Map<string, SpotifyAudioFeatures>> {
  const results = new Map<string, SpotifyAudioFeatures>()
  const uncachedIds: string[] = []

  // Check cache first
  for (const id of spotifyTrackIds) {
    const cacheKey = `audio:features:${id}`
    const cached = await getFromCache<SpotifyAudioFeatures>(cacheKey)
    if (cached) {
      results.set(id, cached)
    } else {
      uncachedIds.push(id)
    }
  }

  if (uncachedIds.length === 0) {
    return results
  }

  // Batch fetch uncached (Spotify allows up to 100 per request)
  const token = await getAccessToken()
  const chunks: string[][] = []
  for (let i = 0; i < uncachedIds.length; i += 100) {
    chunks.push(uncachedIds.slice(i, i + 100))
  }

  for (const chunk of chunks) {
    try {
      const response = await fetch(
        `${SPOTIFY_API_BASE}/audio-features?ids=${chunk.join(',')}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!response.ok) {
        console.error('Batch audio features failed:', response.statusText)
        continue
      }

      const data: { audio_features: (SpotifyAudioFeatures | null)[] } = await response.json()

      for (const features of data.audio_features) {
        if (features) {
          results.set(features.id, features)
          await setCache(`audio:features:${features.id}`, features, AUDIO_FEATURES_CACHE_DURATION)
        }
      }

      // Rate limiting
      if (chunks.length > 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    } catch (error) {
      console.error('Batch audio features error:', error)
    }
  }

  return results
}

/**
 * Get audio features for a track by searching Spotify first
 */
export async function getTrackAudioFeatures(
  trackName: string,
  artistName: string
): Promise<SpotifyAudioFeatures | null> {
  try {
    const trackId = await searchTrack(trackName, artistName)
    if (!trackId) return null

    return await getAudioFeatures(trackId)
  } catch (error) {
    console.error('Failed to get track audio features:', error)
    return null
  }
}

/**
 * Compute aggregate audio profile for an album
 * Returns averaged features across all tracks with variance metrics
 */
export interface AlbumAudioProfileData {
  avgDanceability: number
  avgEnergy: number
  avgValence: number
  avgAcousticness: number
  avgInstrumentalness: number
  avgSpeechiness: number
  avgLiveness: number
  avgTempo: number
  avgLoudness: number
  energyVariance: number
  valenceVariance: number
  tempoVariance: number
  featureSignature: number[] // 8-dimensional vector for quick similarity
  trackCount: number
}

export async function computeAlbumAudioProfile(
  spotifyAlbumId: string
): Promise<AlbumAudioProfileData | null> {
  try {
    // Get the album with tracks
    const album = await getAlbum(spotifyAlbumId, true)
    if (!album.tracks?.items || album.tracks.items.length === 0) {
      return null
    }

    // Get audio features for all tracks
    const trackIds = album.tracks.items.map(t => t.id)
    const featuresMap = await getBatchAudioFeatures(trackIds)

    if (featuresMap.size === 0) {
      return null
    }

    const features = Array.from(featuresMap.values())
    const n = features.length

    // Compute averages
    const sum = (arr: number[]) => arr.reduce((a, b) => a + b, 0)
    const avg = (arr: number[]) => sum(arr) / arr.length
    const variance = (arr: number[]) => {
      const mean = avg(arr)
      return sum(arr.map(x => (x - mean) ** 2)) / arr.length
    }

    const danceabilities = features.map(f => f.danceability)
    const energies = features.map(f => f.energy)
    const valences = features.map(f => f.valence)
    const acousticnesses = features.map(f => f.acousticness)
    const instrumentalnesses = features.map(f => f.instrumentalness)
    const speechinesses = features.map(f => f.speechiness)
    const livenesses = features.map(f => f.liveness)
    const tempos = features.map(f => f.tempo)
    const loudnesses = features.map(f => f.loudness)

    // 8-dimensional feature signature for quick similarity matching
    // Normalized values between 0-1
    const featureSignature = [
      avg(energies),
      avg(valences),
      avg(danceabilities),
      avg(acousticnesses),
      avg(instrumentalnesses),
      avg(speechinesses),
      Math.min(1, avg(tempos) / 200), // Normalize tempo to 0-1
      Math.min(1, (avg(loudnesses) + 60) / 60), // Normalize loudness to 0-1
    ]

    return {
      avgDanceability: avg(danceabilities),
      avgEnergy: avg(energies),
      avgValence: avg(valences),
      avgAcousticness: avg(acousticnesses),
      avgInstrumentalness: avg(instrumentalnesses),
      avgSpeechiness: avg(speechinesses),
      avgLiveness: avg(livenesses),
      avgTempo: avg(tempos),
      avgLoudness: avg(loudnesses),
      energyVariance: variance(energies),
      valenceVariance: variance(valences),
      tempoVariance: variance(tempos),
      featureSignature,
      trackCount: n,
    }
  } catch (error) {
    console.error('Failed to compute album audio profile:', error)
    return null
  }
}

/**
 * Store audio features for a track in the database
 */
export async function storeTrackAudioFeatures(
  spotifyTrackId: string,
  trackName: string,
  artistName: string,
  features: SpotifyAudioFeatures
): Promise<void> {
  await prisma.trackAudioFeatures.upsert({
    where: { spotifyTrackId },
    update: {
      danceability: features.danceability,
      energy: features.energy,
      valence: features.valence,
      acousticness: features.acousticness,
      instrumentalness: features.instrumentalness,
      speechiness: features.speechiness,
      liveness: features.liveness,
      tempo: features.tempo,
      loudness: features.loudness,
      mode: features.mode,
      key: features.key,
    },
    create: {
      spotifyTrackId,
      trackName,
      artistName,
      danceability: features.danceability,
      energy: features.energy,
      valence: features.valence,
      acousticness: features.acousticness,
      instrumentalness: features.instrumentalness,
      speechiness: features.speechiness,
      liveness: features.liveness,
      tempo: features.tempo,
      loudness: features.loudness,
      mode: features.mode,
      key: features.key,
    },
  })
}

/**
 * Store album audio profile in the database
 */
export async function storeAlbumAudioProfile(
  albumId: string,
  spotifyAlbumId: string | null,
  profile: AlbumAudioProfileData
): Promise<void> {
  await prisma.albumAudioProfile.upsert({
    where: { albumId },
    update: {
      spotifyAlbumId,
      avgDanceability: profile.avgDanceability,
      avgEnergy: profile.avgEnergy,
      avgValence: profile.avgValence,
      avgAcousticness: profile.avgAcousticness,
      avgInstrumentalness: profile.avgInstrumentalness,
      avgSpeechiness: profile.avgSpeechiness,
      avgLiveness: profile.avgLiveness,
      avgTempo: profile.avgTempo,
      avgLoudness: profile.avgLoudness,
      energyVariance: profile.energyVariance,
      valenceVariance: profile.valenceVariance,
      tempoVariance: profile.tempoVariance,
      featureSignature: profile.featureSignature,
      trackCount: profile.trackCount,
    },
    create: {
      albumId,
      spotifyAlbumId,
      avgDanceability: profile.avgDanceability,
      avgEnergy: profile.avgEnergy,
      avgValence: profile.avgValence,
      avgAcousticness: profile.avgAcousticness,
      avgInstrumentalness: profile.avgInstrumentalness,
      avgSpeechiness: profile.avgSpeechiness,
      avgLiveness: profile.avgLiveness,
      avgTempo: profile.avgTempo,
      avgLoudness: profile.avgLoudness,
      energyVariance: profile.energyVariance,
      valenceVariance: profile.valenceVariance,
      tempoVariance: profile.tempoVariance,
      featureSignature: profile.featureSignature,
      trackCount: profile.trackCount,
    },
  })
}
