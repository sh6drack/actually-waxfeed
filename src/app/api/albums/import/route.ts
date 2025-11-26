import { NextRequest } from 'next/server'
import { successResponse, errorResponse, requireAuth } from '@/lib/api-utils'
import {
  bulkImportAlbums,
  searchAlbums,
  getAlbum,
  importAlbumToDatabase,
  getArtist
} from '@/lib/spotify'
import { prisma } from '@/lib/prisma'

// POST /api/albums/import - Bulk import albums
// Supports multiple import methods:
// 1. spotifyIds: Array of Spotify album IDs
// 2. spotifyUrls: Array of Spotify URLs (album or playlist)
// 3. artistId: Import all albums from an artist
// 4. newReleases: Import new releases
// 5. searchQueries: Array of search terms to import top results
export async function POST(request: NextRequest) {
  try {
    // Optional auth - some imports may be admin-only later
    const user = await requireAuth().catch(() => null)

    const body = await request.json()
    const {
      spotifyIds,
      spotifyUrls,
      artistId,
      artistName,
      searchQueries,
      limit = 50, // Max albums per import
    } = body

    const results = {
      total: 0,
      imported: 0,
      failed: 0,
      skipped: 0,
      albums: [] as unknown[],
      errors: [] as string[],
    }

    // Method 1: Direct Spotify IDs
    if (spotifyIds && Array.isArray(spotifyIds)) {
      const ids = spotifyIds.slice(0, limit)
      results.total += ids.length

      const importResult = await bulkImportAlbums(ids)
      results.imported += importResult.imported
      results.failed += importResult.failed
      results.errors.push(...importResult.errors)
    }

    // Method 2: Parse Spotify URLs to extract IDs
    if (spotifyUrls && Array.isArray(spotifyUrls)) {
      const extractedIds: string[] = []

      for (const url of spotifyUrls.slice(0, limit)) {
        // Supports: open.spotify.com/album/ID and spotify:album:ID
        const albumMatch = url.match(/album[\/:]([a-zA-Z0-9]+)/)
        if (albumMatch) {
          extractedIds.push(albumMatch[1])
        }
      }

      if (extractedIds.length > 0) {
        results.total += extractedIds.length
        const importResult = await bulkImportAlbums(extractedIds)
        results.imported += importResult.imported
        results.failed += importResult.failed
        results.errors.push(...importResult.errors)
      }
    }

    // Method 3: Import all albums from an artist
    if (artistId || artistName) {
      try {
        let artistSpotifyId = artistId

        // If only name provided, search for artist
        if (!artistSpotifyId && artistName) {
          const { albums } = await searchAlbums(`artist:${artistName}`, 1)
          if (albums.length > 0) {
            artistSpotifyId = albums[0].artists[0]?.id
          }
        }

        if (artistSpotifyId) {
          // Get artist's albums by searching
          const { albums } = await searchAlbums(`artist:${artistName || ''}`, limit)
          const artistAlbums = albums.filter(a =>
            a.artists.some(artist => artist.id === artistSpotifyId)
          )

          results.total += artistAlbums.length

          for (const album of artistAlbums) {
            try {
              const fullAlbum = await getAlbum(album.id)
              await importAlbumToDatabase(fullAlbum)
              results.imported++
            } catch (error) {
              results.failed++
              results.errors.push(`${album.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }
        }
      } catch (error) {
        results.errors.push(`Artist import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Method 4: Import from multiple search queries
    if (searchQueries && Array.isArray(searchQueries)) {
      const perQueryLimit = Math.floor(limit / searchQueries.length) || 10

      for (const query of searchQueries) {
        try {
          const { albums } = await searchAlbums(query, perQueryLimit)
          results.total += albums.length

          for (const album of albums) {
            try {
              const fullAlbum = await getAlbum(album.id)
              await importAlbumToDatabase(fullAlbum)
              results.imported++
            } catch (error) {
              results.failed++
              results.errors.push(`${album.name}: ${error instanceof Error ? error.message : 'Unknown error'}`)
            }
          }
        } catch (error) {
          results.errors.push(`Search "${query}" failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        }
      }
    }

    return successResponse(results)
  } catch (error) {
    if (error instanceof Error && error.message === 'UNAUTHORIZED') {
      return errorResponse('Authentication required', 401)
    }
    console.error('Error importing albums:', error)
    return errorResponse('Failed to import albums', 500)
  }
}

// GET /api/albums/import/status - Get import stats
export async function GET() {
  try {
    const [totalAlbums, totalArtists, recentImports] = await Promise.all([
      prisma.album.count(),
      prisma.artist.count(),
      prisma.album.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        }
      })
    ])

    return successResponse({
      totalAlbums,
      totalArtists,
      recentImports,
    })
  } catch (error) {
    console.error('Error getting import status:', error)
    return errorResponse('Failed to get import status', 500)
  }
}
