import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

let spotifyToken: string | null = null

async function getSpotifyToken(): Promise<string> {
  if (spotifyToken) return spotifyToken

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })

  const data = await response.json()
  spotifyToken = data.access_token
  return spotifyToken
}

interface SpotifyImage {
  url: string
  height: number
  width: number
}

interface SpotifyTrack {
  id: string
  name: string
  track_number: number
  disc_number: number
  duration_ms: number
  external_urls: { spotify: string }
}

interface SpotifyAlbum {
  id: string
  name: string
  artists: { id: string; name: string }[]
  images: SpotifyImage[]
  release_date: string
  release_date_precision: string
  album_type: string
  total_tracks: number
  external_urls: { spotify: string }
  tracks?: { items: SpotifyTrack[] }
}

interface SpotifyPlaylistTrack {
  track: {
    album: SpotifyAlbum
    artists: { id: string; name: string }[]
  } | null
}

interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
}

const seenAlbumIds = new Set<string>()
const artistGenreCache = new Map<string, string[]>()

async function getArtistGenres(token: string, artistId: string): Promise<string[]> {
  if (!artistId) return []
  if (artistGenreCache.has(artistId)) return artistGenreCache.get(artistId)!

  try {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return []
    const artist: SpotifyArtist = await response.json()
    const genres = artist.genres || []
    artistGenreCache.set(artistId, genres)
    return genres
  } catch {
    return []
  }
}

async function getFullAlbum(token: string, albumId: string): Promise<SpotifyAlbum | null> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function importAlbumWithTracks(album: SpotifyAlbum, genres: string[]): Promise<boolean> {
  try {
    if (seenAlbumIds.has(album.id)) return false
    seenAlbumIds.add(album.id)

    // Skip singles with less than 4 tracks
    if (album.album_type === "single" && album.total_tracks < 4) {
      return false
    }

    const images = album.images.sort((a, b) => (b.height || 0) - (a.height || 0))
    const coverArtUrlLarge = images[0]?.url || null
    const coverArtUrlMedium = images[1]?.url || images[0]?.url || null
    const coverArtUrlSmall = images[2]?.url || images[1]?.url || images[0]?.url || null

    const dbAlbum = await prisma.album.upsert({
      where: { spotifyId: album.id },
      update: {
        genres,
        coverArtUrlSmall,
        coverArtUrlMedium,
        coverArtUrlLarge,
        lastSyncedAt: new Date(),
      },
      create: {
        spotifyId: album.id,
        title: album.name,
        artistName: album.artists.map((a) => a.name).join(", "),
        artistSpotifyId: album.artists[0]?.id || null,
        releaseDate: new Date(album.release_date),
        releaseDatePrecision: album.release_date_precision,
        coverArtUrl: coverArtUrlLarge,
        coverArtUrlSmall,
        coverArtUrlMedium,
        coverArtUrlLarge,
        genres,
        albumType: album.album_type,
        totalTracks: album.total_tracks,
        spotifyUrl: album.external_urls.spotify,
      },
    })

    if (album.tracks?.items) {
      for (const track of album.tracks.items) {
        await prisma.track.upsert({
          where: { spotifyId: track.id },
          update: {
            name: track.name,
            trackNumber: track.track_number,
            discNumber: track.disc_number,
            durationMs: track.duration_ms,
          },
          create: {
            spotifyId: track.id,
            albumId: dbAlbum.id,
            name: track.name,
            trackNumber: track.track_number,
            discNumber: track.disc_number,
            durationMs: track.duration_ms,
            spotifyUrl: track.external_urls.spotify,
          },
        })
      }
    }

    return true
  } catch (error) {
    return false
  }
}

async function importFromPlaylist(token: string, playlistId: string, name: string): Promise<number> {
  console.log(`\n📀 Importing from playlist: ${name}`)
  let imported = 0
  let offset = 0
  const limit = 100

  while (true) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}&fields=items(track(album(id)))`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!response.ok) {
        console.log(`  Failed to fetch playlist: ${response.status}`)
        break
      }

      const data = await response.json()
      const items: SpotifyPlaylistTrack[] = data.items || []

      if (items.length === 0) break

      for (const item of items) {
        if (!item.track?.album?.id) continue
        if (seenAlbumIds.has(item.track.album.id)) continue

        const fullAlbum = await getFullAlbum(token, item.track.album.id)
        if (!fullAlbum) continue

        const genres = await getArtistGenres(token, fullAlbum.artists[0]?.id || "")
        const success = await importAlbumWithTracks(fullAlbum, genres)
        if (success) imported++

        await new Promise((r) => setTimeout(r, 50))
      }

      offset += limit
      if (items.length < limit) break
    } catch (error) {
      console.log(`  Error: ${error}`)
      break
    }
  }

  console.log(`  ✓ Imported ${imported} albums`)
  return imported
}

async function importFromSearch(token: string, query: string, limit: number = 50): Promise<number> {
  console.log(`\n🔍 Searching: ${query}`)
  let imported = 0

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!response.ok) return 0

    const data = await response.json()
    const albums = data.albums?.items || []

    for (const album of albums) {
      if (seenAlbumIds.has(album.id)) continue

      const fullAlbum = await getFullAlbum(token, album.id)
      if (!fullAlbum) continue

      const genres = await getArtistGenres(token, fullAlbum.artists[0]?.id || "")
      const success = await importAlbumWithTracks(fullAlbum, genres)
      if (success) imported++

      await new Promise((r) => setTimeout(r, 50))
    }
  } catch (error) {
    console.log(`  Error: ${error}`)
  }

  console.log(`  ✓ Imported ${imported} albums`)
  return imported
}

async function importNewReleases(token: string, limit: number = 50): Promise<number> {
  console.log(`\n🆕 Importing new releases`)
  let imported = 0
  let offset = 0

  while (imported < limit) {
    try {
      const response = await fetch(
        `https://api.spotify.com/v1/browse/new-releases?offset=${offset}&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      )

      if (!response.ok) break

      const data = await response.json()
      const albums = data.albums?.items || []

      if (albums.length === 0) break

      for (const album of albums) {
        if (seenAlbumIds.has(album.id)) continue

        const fullAlbum = await getFullAlbum(token, album.id)
        if (!fullAlbum) continue

        const genres = await getArtistGenres(token, fullAlbum.artists[0]?.id || "")
        const success = await importAlbumWithTracks(fullAlbum, genres)
        if (success) imported++

        await new Promise((r) => setTimeout(r, 50))
      }

      offset += 50
    } catch {
      break
    }
  }

  console.log(`  ✓ Imported ${imported} albums`)
  return imported
}

async function importArtistDiscography(token: string, artistId: string, artistName: string): Promise<number> {
  let imported = 0

  try {
    const response = await fetch(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album,single&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    )

    if (!response.ok) return 0

    const data = await response.json()
    const albums = data.items || []

    for (const album of albums) {
      if (seenAlbumIds.has(album.id)) continue

      const fullAlbum = await getFullAlbum(token, album.id)
      if (!fullAlbum) continue

      const genres = await getArtistGenres(token, artistId)
      const success = await importAlbumWithTracks(fullAlbum, genres)
      if (success) imported++

      await new Promise((r) => setTimeout(r, 50))
    }
  } catch {
    // ignore
  }

  return imported
}

// MASSIVE CURATED PLAYLIST IDS
// These are Spotify's official editorial playlists with thousands of songs
const SPOTIFY_PLAYLISTS = [
  // OFFICIAL CHART PLAYLISTS
  { id: "37i9dQZF1DXcBWIGoYBM5M", name: "Today's Top Hits" },
  { id: "37i9dQZF1DX0XUsuxWHRQd", name: "RapCaviar" },
  { id: "37i9dQZF1DX4SBhb3fqCJd", name: "Are & Be" },
  { id: "37i9dQZF1DX10zKzsJ2jva", name: "Viva Latino" },
  { id: "37i9dQZF1DX4JAvHpjipBk", name: "New Music Friday" },
  { id: "37i9dQZF1DWXRqgorJj26U", name: "Rock Classics" },
  { id: "37i9dQZF1DX4o1oenSJRJd", name: "All Out 00s" },
  { id: "37i9dQZF1DX4UtSsGT1Sbe", name: "All Out 90s" },
  { id: "37i9dQZF1DX4sWSpwq3LiO", name: "All Out 80s" },
  { id: "37i9dQZF1DWTJ7xPn4vNaz", name: "All Out 70s" },
  { id: "37i9dQZF1DXaKIA8E7WcJj", name: "All Out 60s" },
  { id: "37i9dQZF1DX1lVhptIYRda", name: "Hot Country" },
  { id: "37i9dQZF1DX0kbJZpiYdZl", name: "Hot Hits USA" },

  // GENRE DEEP DIVES
  { id: "37i9dQZF1DX0SM0LYsmbMT", name: "Jazz Classics" },
  { id: "37i9dQZF1DX1n9whBbBKoL", name: "Hip-Hop Controller" },
  { id: "37i9dQZF1DWWEJlAGA9gs0", name: "Classical Essentials" },
  { id: "37i9dQZF1DX2RxBh64BHjQ", name: "Most Necessary" },
  { id: "37i9dQZF1DX4dyzvuaRJ0n", name: "mint" },
  { id: "37i9dQZF1DX4JAvHpjipBk", name: "New Music Friday" },
  { id: "37i9dQZF1DX7QOv5kjbU68", name: "New Boots" },
  { id: "37i9dQZF1DX4WYpdgoIcn6", name: "Chill Hits" },
  { id: "37i9dQZF1DX3rxVfibe1L0", name: "Mood Booster" },
  { id: "37i9dQZF1DX0BcQWzuB7ZO", name: "Dance Hits" },

  // DECADE ESSENTIALS
  { id: "37i9dQZF1DX5Ejj0EkURtP", name: "All Out 2010s" },
  { id: "37i9dQZEVXbMDoHDwVN2tF", name: "Global Top 50" },
  { id: "37i9dQZEVXbLRQDuF5jeBp", name: "Top 50 USA" },

  // INDIE/ALTERNATIVE
  { id: "37i9dQZF1DX2Nc3B70tvx0", name: "Ultimate Indie" },
  { id: "37i9dQZF1DXdbXrPNafg9d", name: "Indie Pop" },
  { id: "37i9dQZF1DX873GaRGUmPl", name: "Alternative 10s" },
  { id: "37i9dQZF1DX9GRpeD4bpm2", name: "Alternative 00s" },

  // R&B/SOUL
  { id: "37i9dQZF1DX4SBhb3fqCJd", name: "Are & Be" },
  { id: "37i9dQZF1DWYmmr74INQlb", name: "R&B Classics" },
  { id: "37i9dQZF1DX7FY5ma9162x", name: "Neo Soul" },

  // ELECTRONIC
  { id: "37i9dQZF1DX4dyzvuaRJ0n", name: "mint" },
  { id: "37i9dQZF1DX8tZsk68tuDw", name: "Dance Rising" },
  { id: "37i9dQZF1DX0r3x8OtiwEM", name: "Electronic Essentials" },

  // K-POP
  { id: "37i9dQZF1DX9tPFwDMOaN1", name: "K-Pop Daebak" },
  { id: "37i9dQZF1DX4FcAKI5Nhzq", name: "K-Pop Rising" },

  // AFROBEATS
  { id: "37i9dQZF1DWYkaDif7Ztbp", name: "Afro Hits" },
  { id: "37i9dQZF1DWVnD3gJuAvSR", name: "African Heat" },

  // LATIN
  { id: "37i9dQZF1DX10zKzsJ2jva", name: "Viva Latino" },
  { id: "37i9dQZF1DX1HCSbq8TXRD", name: "Baila Reggaeton" },
  { id: "37i9dQZF1DX6GJXiuZRisr", name: "Corridos Tumbados" },
]

// KEY ARTISTS - Get full discographies
const KEY_ARTISTS = [
  // Hip Hop/Rap Legends
  { id: "2YZyLoL8N0Wb9xBt1NhZWg", name: "Kendrick Lamar" },
  { id: "5K4W6rqBFWDnAN6FQUkS6x", name: "Kanye West" },
  { id: "3TVXtAsR1Inumwj472S9r4", name: "Drake" },
  { id: "0Y5tJX1MQlPlqiwlOH1tJY", name: "Travis Scott" },
  { id: "4O15NlyKLIASxsJ0PrXPfz", name: "Lil Uzi Vert" },
  { id: "699OTQXzgjhIYAHMy9RyPD", name: "Playboi Carti" },
  { id: "1URnnhqYAYcrqrcwql10ft", name: "21 Savage" },
  { id: "7c0XG5cIJTrrAgEC3ULPiq", name: "Young Thug" },
  { id: "5cj0lLjcoR7YOSnhnX0Po5", name: "Doja Cat" },
  { id: "6M2wZ9GZgrQXHCFfjv46we", name: "Dua Lipa" },

  // R&B
  { id: "7tYKF4w9nC0nq9CsPZTHyP", name: "SZA" },
  { id: "2h93pZq0e7k5yf4dywlkpM", name: "Frank Ocean" },
  { id: "1Xyo4u8uXC1ZmMpatF05PJ", name: "The Weeknd" },
  { id: "7bXgB6jMjp9ATFy66eO08Z", name: "Chris Brown" },
  { id: "3fMbdgg4jU18AjLCKBhRSm", name: "Michael Jackson" },

  // Pop Icons
  { id: "06HL4z0CvFAxyc27GXpf02", name: "Taylor Swift" },
  { id: "6qqNVTkY8uBg9cP3Jd7DAH", name: "Billie Eilish" },
  { id: "66CXWjxzNUsdJxJ2JdwvnR", name: "Ariana Grande" },
  { id: "1uNFoZAHBGtllmzznpCI3s", name: "Justin Bieber" },
  { id: "6S2OmqARrzebs0tKUEyXyp", name: "Demi Lovato" },
  { id: "6vWDO969PvNqNYHIOW5v0m", name: "Beyoncé" },
  { id: "0EmeFodog0BfCgMzAIvKQp", name: "Shakira" },

  // Rock/Alternative
  { id: "4Z8W4fKeB5YxbusRsdQVPb", name: "Radiohead" },
  { id: "5INjqkS1o8h1imAzPqGZBb", name: "Tame Impala" },
  { id: "7Ln80lUS6He07XvHI8qqHH", name: "Arctic Monkeys" },
  { id: "0oSGxfWSnnOXhD2fKuz2Gy", name: "David Bowie" },
  { id: "36QJpDe2go2KgaRleHCDTp", name: "Led Zeppelin" },
  { id: "6olE6TJLqED3rqDCT0FyPh", name: "Nirvana" },
  { id: "0k17h0D3J5VfsdmQ1iZtE9", name: "Pink Floyd" },
  { id: "3WrFJ7ztbogyGnTHbHJFl2", name: "The Beatles" },

  // Electronic/Dance
  { id: "4tZwfgrHOc3mvqYlEYSvVi", name: "Daft Punk" },
  { id: "6GI52t8N5F02MxU0g5U3Aw", name: "Disclosure" },
  { id: "6kBDZFXuLrZgHnvmPu9NsG", name: "Kaytranada" },
  { id: "1vCWHaC5f2uS3yhpwWbIA6", name: "Avicii" },

  // Latin
  { id: "4q3ewBCX7sLwd24euuV69X", name: "Bad Bunny" },
  { id: "7ltDVBr6mKbRvohxheJ9h1", name: "Rosalía" },
  { id: "12GqGscKJx3aE4t07u7eVZ", name: "Peso Pluma" },
  { id: "790FomKkXshlbRYZFtlgla", name: "Karol G" },

  // Afrobeats
  { id: "3tVQdUvClmAT7URs9V3rsp", name: "Wizkid" },
  { id: "3wcj11K77LjEY1PkEazffa", name: "Burna Boy" },
  { id: "0iEtIxbK0KxaSlF7G42ZOp", name: "Rema" },
  { id: "0Y3agQaa6g2r0YmHPOO9rh", name: "Davido" },

  // K-Pop
  { id: "3Nrfpe0tUJi4K4DXYWgMUX", name: "BTS" },
  { id: "41MozSoPIsD1dJM0CLPjZF", name: "BLACKPINK" },
  { id: "0ghlgldX5Dd6720Q3qFyQB", name: "NewJeans" },
  { id: "6HvZYsbFfjnjFrWF950C9d", name: "Stray Kids" },

  // Classic Soul/R&B
  { id: "3koiLjNrgRTNbOwViDipeA", name: "Marvin Gaye" },
  { id: "2wY79sveU1sp5g7SokKOiI", name: "Sam Cooke" },
  { id: "7guDJrEfX3qb6FEbdPA5qi", name: "Stevie Wonder" },
  { id: "0X2BH1fck6amBIoJhDVmmJ", name: "Elton John" },

  // Indie/Alternative Modern
  { id: "1r1uxoy19fzMxunt3ONAkG", name: "Phoebe Bridgers" },
  { id: "4dpARuHxo51G3z768sgnrY", name: "Adele" },
  { id: "00FQb4jTyendYWaN8pK0wa", name: "Lana Del Rey" },
  { id: "4gzpq5DPGxSnKTe4SA8HAU", name: "Coldplay" },
  { id: "2YZyLoL8N0Wb9xBt1NhZWg", name: "Kendrick Lamar" },

  // More Hip Hop
  { id: "1RyvyyTE3xzB2ZywiAwp0i", name: "Future" },
  { id: "0iEtIxbK0KxaSlF7G42ZOp", name: "Metro Boomin" },
  { id: "20sxb77xiYeusSH8cVdatc", name: "Meek Mill" },
  { id: "55Aa2cqylxrFIXC767Z865", name: "Lil Wayne" },
  { id: "15UsOTVnJzReFVN1VCnxy4", name: "XXXTENTACION" },
  { id: "4MCBfE4596Uoi2O4Dtmber", name: "Juice WRLD" },

  // More Pop
  { id: "74KM79TiuVKeVCqs8QtB0B", name: "Sabrina Carpenter" },
  { id: "1McMsnEElThX1knmY4oliG", name: "Olivia Rodrigo" },
  { id: "45dkTj5sMRSjrmBSBeiHym", name: "Tate McRae" },
  { id: "0C8ZW7ezQVs4URX5aX7Kqx", name: "Selena Gomez" },
  { id: "1HY2Jd0NmPuamShAr6KMms", name: "Lady Gaga" },
]

// SEARCH QUERIES for additional discovery
const SEARCH_QUERIES = [
  // Decades
  "best albums 2024", "best albums 2023", "best albums 2022", "best albums 2021", "best albums 2020",
  "best albums 2019", "best albums 2018", "best albums 2017", "best albums 2016", "best albums 2015",
  "best albums 2010s", "best albums 2000s", "best albums 1990s", "best albums 1980s", "best albums 1970s",

  // Genre specific
  "classic hip hop albums", "greatest rap albums", "best r&b albums",
  "indie rock essentials", "alternative rock classics", "post-punk revival",
  "electronic music classics", "house music albums", "techno albums",
  "jazz fusion albums", "neo soul albums", "classic soul albums",
  "country music classics", "modern country albums",
  "latin pop albums", "reggaeton albums", "bachata albums",
  "k-pop albums", "j-pop albums",
  "afrobeats albums", "amapiano albums", "afro house",
  "british rock albums", "psychedelic rock", "progressive rock",
  "punk rock albums", "grunge albums", "emo albums",
  "metal albums", "heavy metal classics",

  // Award winners / critical acclaim
  "grammy album of the year", "mercury prize albums",
  "pitchfork best new music", "rolling stone 500 greatest albums",

  // Modern hits
  "viral tiktok songs 2024", "trending music 2024",
  "summer hits 2024", "party music 2024",
]

async function main() {
  console.log("=".repeat(70))
  console.log("🎵 MASSIVE ALBUM IMPORT - Building the Ultimate Music Library")
  console.log("=".repeat(70))

  const token = await getSpotifyToken()
  let totalImported = 0

  // 1. Import from Spotify Playlists
  console.log("\n" + "=".repeat(70))
  console.log("📀 PHASE 1: Importing from Spotify Editorial Playlists")
  console.log("=".repeat(70))

  for (const playlist of SPOTIFY_PLAYLISTS) {
    const count = await importFromPlaylist(token, playlist.id, playlist.name)
    totalImported += count
    console.log(`Running total: ${totalImported} albums`)
  }

  // 2. Import Artist Discographies
  console.log("\n" + "=".repeat(70))
  console.log("🎤 PHASE 2: Importing Key Artist Discographies")
  console.log("=".repeat(70))

  for (const artist of KEY_ARTISTS) {
    console.log(`\n🎤 ${artist.name}`)
    const count = await importArtistDiscography(token, artist.id, artist.name)
    console.log(`  ✓ Imported ${count} albums`)
    totalImported += count
    console.log(`Running total: ${totalImported} albums`)
  }

  // 3. Import New Releases
  console.log("\n" + "=".repeat(70))
  console.log("🆕 PHASE 3: Importing New Releases")
  console.log("=".repeat(70))

  const newReleasesCount = await importNewReleases(token, 100)
  totalImported += newReleasesCount

  // 4. Search-based discovery
  console.log("\n" + "=".repeat(70))
  console.log("🔍 PHASE 4: Search-based Discovery")
  console.log("=".repeat(70))

  for (const query of SEARCH_QUERIES) {
    const count = await importFromSearch(token, query, 50)
    totalImported += count
  }

  // Final stats
  console.log("\n" + "=".repeat(70))
  console.log("✅ IMPORT COMPLETE!")
  console.log("=".repeat(70))

  const [albumCount, trackCount] = await Promise.all([
    prisma.album.count(),
    prisma.track.count(),
  ])

  console.log(`\n📊 Final Statistics:`)
  console.log(`   Albums in database: ${albumCount.toLocaleString()}`)
  console.log(`   Tracks in database: ${trackCount.toLocaleString()}`)
  console.log(`   New albums added this run: ${totalImported.toLocaleString()}`)
  console.log("=".repeat(70))

  await prisma.$disconnect()
}

main().catch(console.error)
