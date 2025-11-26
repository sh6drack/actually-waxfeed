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
  genres?: string[]
}

interface SpotifyArtist {
  id: string
  name: string
  genres: string[]
  images: SpotifyImage[]
  popularity: number
}

async function getArtistGenres(token: string, artistId: string): Promise<string[]> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const artist: SpotifyArtist = await response.json()
    return artist.genres || []
  } catch {
    return []
  }
}

async function getFullAlbum(token: string, albumId: string): Promise<SpotifyAlbum | null> {
  try {
    const response = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    return await response.json()
  } catch {
    return null
  }
}

async function searchAlbum(token: string, query: string): Promise<SpotifyAlbum | null> {
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await response.json()
  const album = data.albums?.items?.[0]
  if (!album) return null

  // Get full album details with tracks
  return getFullAlbum(token, album.id)
}

async function importAlbumWithTracks(album: SpotifyAlbum, genres: string[]): Promise<boolean> {
  try {
    // Skip singles with less than 4 tracks
    if (album.album_type === "single" && album.total_tracks < 4) {
      return false
    }

    // Get image sizes
    const images = album.images.sort((a, b) => (b.height || 0) - (a.height || 0))
    const coverArtUrlLarge = images[0]?.url || null
    const coverArtUrlMedium = images[1]?.url || images[0]?.url || null
    const coverArtUrlSmall = images[2]?.url || images[1]?.url || images[0]?.url || null

    // Upsert album
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

    // Import tracks if available
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
    console.error(`Failed to import ${album.name}:`, error)
    return false
  }
}

// ZEITGEIST ALBUMS - Culturally relevant music across categories
const ZEITGEIST_QUERIES = [
  // ============ CURRENT CHART TOPPERS (Billboard 200 Nov 2025) ============
  { query: "The Life Of A Showgirl Taylor Swift", category: "charts" },
  { query: "I'm The Problem Morgan Wallen", category: "charts" },
  { query: "Lux Rosalia", category: "charts" },
  { query: "Man's Best Friend Sabrina Carpenter", category: "charts" },
  { query: "Am I The Drama Cardi B", category: "charts" },
  { query: "GNX Kendrick Lamar", category: "charts" },
  { query: "CHROMAKOPIA Tyler the Creator", category: "charts" },
  { query: "DeBi TiRAR MaS FOToS Bad Bunny", category: "charts" },
  { query: "Ego Death Hayley Williams", category: "charts" },
  { query: "Lil Herb G Herbo", category: "charts" },

  // ============ 2025 ACCLAIMED RELEASES ============
  { query: "GNX Kendrick Lamar", category: "2025" },
  { query: "CHROMAKOPIA Tyler the Creator", category: "2025" },
  { query: "eternal sunshine Ariana Grande", category: "2025" },
  { query: "BRAT Charli XCX", category: "2025" },
  { query: "Hit Me Hard And Soft Billie Eilish", category: "2025" },
  { query: "Cowboy Carter Beyonce", category: "2025" },
  { query: "The Tortured Poets Department Taylor Swift", category: "2025" },
  { query: "Short n Sweet Sabrina Carpenter", category: "2025" },
  { query: "Radical Optimism Dua Lipa", category: "2025" },
  { query: "The Rise and Fall Chappell Roan", category: "2025" },
  { query: "So Close To What Tate McRae", category: "2025" },
  { query: "Megan Megan Thee Stallion", category: "2025" },

  // ============ HIP HOP / RAP ESSENTIALS ============
  { query: "good kid m.A.A.d city Kendrick Lamar", category: "hiphop" },
  { query: "To Pimp a Butterfly Kendrick Lamar", category: "hiphop" },
  { query: "DAMN Kendrick Lamar", category: "hiphop" },
  { query: "My Beautiful Dark Twisted Fantasy Kanye West", category: "hiphop" },
  { query: "The College Dropout Kanye West", category: "hiphop" },
  { query: "Graduation Kanye West", category: "hiphop" },
  { query: "Yeezus Kanye West", category: "hiphop" },
  { query: "808s and Heartbreak Kanye West", category: "hiphop" },
  { query: "Blonde Frank Ocean", category: "hiphop" },
  { query: "Channel Orange Frank Ocean", category: "hiphop" },
  { query: "IGOR Tyler the Creator", category: "hiphop" },
  { query: "Flower Boy Tyler the Creator", category: "hiphop" },
  { query: "Call Me If You Get Lost Tyler", category: "hiphop" },
  { query: "ASTROWORLD Travis Scott", category: "hiphop" },
  { query: "Rodeo Travis Scott", category: "hiphop" },
  { query: "Die Lit Playboi Carti", category: "hiphop" },
  { query: "Whole Lotta Red Playboi Carti", category: "hiphop" },
  { query: "DS4EVER Gunna", category: "hiphop" },
  { query: "Punk Young Thug", category: "hiphop" },
  { query: "So Much Fun Young Thug", category: "hiphop" },
  { query: "Culture Migos", category: "hiphop" },
  { query: "Take Care Drake", category: "hiphop" },
  { query: "Nothing Was The Same Drake", category: "hiphop" },
  { query: "If You're Reading This Drake", category: "hiphop" },
  { query: "Her Loss Drake", category: "hiphop" },
  { query: "For All The Dogs Drake", category: "hiphop" },

  // ============ R&B / SOUL ============
  { query: "SOS SZA", category: "rnb" },
  { query: "Ctrl SZA", category: "rnb" },
  { query: "Freudian Daniel Caesar", category: "rnb" },
  { query: "Case Study 01 Daniel Caesar", category: "rnb" },
  { query: "Gemini Rights Steve Lacy", category: "rnb" },
  { query: "Apollo XXI Steve Lacy", category: "rnb" },
  { query: "Wasteland Brent Faiyaz", category: "rnb" },
  { query: "Fuck The World Brent Faiyaz", category: "rnb" },
  { query: "ANTI Rihanna", category: "rnb" },
  { query: "Lemonade Beyonce", category: "rnb" },
  { query: "Renaissance Beyonce", category: "rnb" },
  { query: "After Hours The Weeknd", category: "rnb" },
  { query: "Dawn FM The Weeknd", category: "rnb" },
  { query: "Starboy The Weeknd", category: "rnb" },
  { query: "Beauty Behind the Madness The Weeknd", category: "rnb" },
  { query: "House of Balloons The Weeknd", category: "rnb" },
  { query: "Blonde Frank Ocean", category: "rnb" },

  // ============ POP ============
  { query: "1989 Taylor Swift", category: "pop" },
  { query: "Reputation Taylor Swift", category: "pop" },
  { query: "Lover Taylor Swift", category: "pop" },
  { query: "Folklore Taylor Swift", category: "pop" },
  { query: "Evermore Taylor Swift", category: "pop" },
  { query: "Midnights Taylor Swift", category: "pop" },
  { query: "Red Taylor's Version Taylor Swift", category: "pop" },
  { query: "Future Nostalgia Dua Lipa", category: "pop" },
  { query: "Chromatica Lady Gaga", category: "pop" },
  { query: "Born This Way Lady Gaga", category: "pop" },
  { query: "The Fame Monster Lady Gaga", category: "pop" },
  { query: "Dangerous Woman Ariana Grande", category: "pop" },
  { query: "Thank U Next Ariana Grande", category: "pop" },
  { query: "Positions Ariana Grande", category: "pop" },
  { query: "Sweetener Ariana Grande", category: "pop" },
  { query: "When We All Fall Asleep Billie Eilish", category: "pop" },
  { query: "Happier Than Ever Billie Eilish", category: "pop" },
  { query: "Fine Line Harry Styles", category: "pop" },
  { query: "Harry's House Harry Styles", category: "pop" },
  { query: "SOUR Olivia Rodrigo", category: "pop" },
  { query: "GUTS Olivia Rodrigo", category: "pop" },

  // ============ INDIE / ALTERNATIVE ============
  { query: "In Rainbows Radiohead", category: "indie" },
  { query: "OK Computer Radiohead", category: "indie" },
  { query: "Kid A Radiohead", category: "indie" },
  { query: "Is This It The Strokes", category: "indie" },
  { query: "Room On Fire The Strokes", category: "indie" },
  { query: "AM Arctic Monkeys", category: "indie" },
  { query: "Whatever People Say Arctic Monkeys", category: "indie" },
  { query: "Tranquility Base Arctic Monkeys", category: "indie" },
  { query: "The Car Arctic Monkeys", category: "indie" },
  { query: "Currents Tame Impala", category: "indie" },
  { query: "Lonerism Tame Impala", category: "indie" },
  { query: "The Slow Rush Tame Impala", category: "indie" },
  { query: "Punisher Phoebe Bridgers", category: "indie" },
  { query: "Stranger in the Alps Phoebe Bridgers", category: "indie" },
  { query: "For Emma Bon Iver", category: "indie" },
  { query: "22 A Million Bon Iver", category: "indie" },
  { query: "i,i Bon Iver", category: "indie" },
  { query: "Carrie and Lowell Sufjan Stevens", category: "indie" },
  { query: "Illinois Sufjan Stevens", category: "indie" },
  { query: "Javelin Sufjan Stevens", category: "indie" },
  { query: "Fetch the Bolt Cutters Fiona Apple", category: "indie" },
  { query: "Norman Fucking Rockwell Lana Del Rey", category: "indie" },
  { query: "Born to Die Lana Del Rey", category: "indie" },
  { query: "Did you know tunnel Ocean Blvd Lana Del Rey", category: "indie" },

  // ============ ELECTRONIC / DANCE ============
  { query: "Random Access Memories Daft Punk", category: "electronic" },
  { query: "Discovery Daft Punk", category: "electronic" },
  { query: "Homework Daft Punk", category: "electronic" },
  { query: "Settle Disclosure", category: "electronic" },
  { query: "Energy Disclosure", category: "electronic" },
  { query: "99.9% Kaytranada", category: "electronic" },
  { query: "Bubba Kaytranada", category: "electronic" },
  { query: "Timeless Kaytranada", category: "electronic" },
  { query: "New Energy Four Tet", category: "electronic" },
  { query: "Sixteen Oceans Four Tet", category: "electronic" },
  { query: "Three Four Tet", category: "electronic" },
  { query: "LP5 Apparat", category: "electronic" },
  { query: "Immunity Jon Hopkins", category: "electronic" },
  { query: "Singularity Jon Hopkins", category: "electronic" },
  { query: "In Colour Jamie xx", category: "electronic" },
  { query: "Melt Away James Blake", category: "electronic" },
  { query: "Assume Form James Blake", category: "electronic" },
  { query: "James Blake James Blake", category: "electronic" },
  { query: "Oil of Every Pearl Arca Sophie", category: "electronic" },

  // ============ AFROBEATS / AMAPIANO / AFRICAN ============
  { query: "Made in Lagos Wizkid", category: "afrobeats" },
  { query: "Morayo Wizkid", category: "afrobeats" },
  { query: "African Giant Burna Boy", category: "afrobeats" },
  { query: "Twice As Tall Burna Boy", category: "afrobeats" },
  { query: "Love Damini Burna Boy", category: "afrobeats" },
  { query: "I Told Them Burna Boy", category: "afrobeats" },
  { query: "If Orange Was a Place Tems", category: "afrobeats" },
  { query: "Born in the Wild Tems", category: "afrobeats" },
  { query: "Rave and Roses Rema", category: "afrobeats" },
  { query: "HEIS Rema", category: "afrobeats" },
  { query: "Timeless Davido", category: "afrobeats" },
  { query: "A Good Time Davido", category: "afrobeats" },
  { query: "TYLA Tyla", category: "afrobeats" },
  { query: "Subconsciously Black Coffee", category: "afrobeats" },
  { query: "Pieces of Me Black Coffee", category: "afrobeats" },
  { query: "I Am Kabza De Small", category: "afrobeats" },
  { query: "Rumble in the Jungle Kabza", category: "afrobeats" },

  // ============ LATIN ============
  { query: "Un Verano Sin Ti Bad Bunny", category: "latin" },
  { query: "YHLQMDLG Bad Bunny", category: "latin" },
  { query: "El Ultimo Tour Bad Bunny", category: "latin" },
  { query: "Motomami Rosalia", category: "latin" },
  { query: "El Mal Querer Rosalia", category: "latin" },
  { query: "Genesis Peso Pluma", category: "latin" },
  { query: "Exodo Peso Pluma", category: "latin" },
  { query: "Ferxxocalipsis Feid", category: "latin" },
  { query: "Feliz Cumpleanos Ferxxo Feid", category: "latin" },
  { query: "Manana Sera Bonito Karol G", category: "latin" },
  { query: "KG0516 Karol G", category: "latin" },
  { query: "Vida Cotidiana Juanes", category: "latin" },

  // ============ ROCK CLASSICS ============
  { query: "Rumours Fleetwood Mac", category: "rock" },
  { query: "The Dark Side of the Moon Pink Floyd", category: "rock" },
  { query: "Abbey Road The Beatles", category: "rock" },
  { query: "Sgt Pepper The Beatles", category: "rock" },
  { query: "Led Zeppelin IV Led Zeppelin", category: "rock" },
  { query: "Back in Black AC/DC", category: "rock" },
  { query: "Appetite for Destruction Guns N Roses", category: "rock" },
  { query: "Nevermind Nirvana", category: "rock" },
  { query: "In Utero Nirvana", category: "rock" },
  { query: "Purple Rain Prince", category: "rock" },
  { query: "Thriller Michael Jackson", category: "rock" },
  { query: "Off the Wall Michael Jackson", category: "rock" },
  { query: "Bad Michael Jackson", category: "rock" },

  // ============ K-POP ============
  { query: "GOLDEN Jung Kook", category: "kpop" },
  { query: "Face Jimin", category: "kpop" },
  { query: "D-Day Agust D", category: "kpop" },
  { query: "Map of the Soul BTS", category: "kpop" },
  { query: "Love Yourself BTS", category: "kpop" },
  { query: "5-STAR Stray Kids", category: "kpop" },
  { query: "ROCK-STAR Stray Kids", category: "kpop" },
  { query: "FML Seventeen", category: "kpop" },
  { query: "Born Pink BLACKPINK", category: "kpop" },
  { query: "THE ALBUM BLACKPINK", category: "kpop" },
  { query: "Get Up NewJeans", category: "kpop" },
  { query: "IM NAYEON Nayeon", category: "kpop" },
  { query: "INVU Taeyeon", category: "kpop" },
  { query: "Girls aespa", category: "kpop" },
  { query: "Armageddon aespa", category: "kpop" },
]

async function main() {
  console.log("=".repeat(60))
  console.log("ZEITGEIST IMPORT - Full Metadata + Tracks")
  console.log("=".repeat(60))

  const token = await getSpotifyToken()
  let imported = 0
  let skipped = 0
  let failed = 0
  const seen = new Set<string>()

  for (const { query, category } of ZEITGEIST_QUERIES) {
    // Skip duplicates
    if (seen.has(query.toLowerCase())) continue
    seen.add(query.toLowerCase())

    console.log(`[${category.toUpperCase()}] ${query}`)

    const album = await searchAlbum(token, query)

    if (album) {
      // Get artist genres
      const genres = await getArtistGenres(token, album.artists[0]?.id || "")

      const success = await importAlbumWithTracks(album, genres)
      if (success) {
        const trackCount = album.tracks?.items?.length || 0
        console.log(`  ✓ ${album.name} (${trackCount} tracks, genres: ${genres.slice(0, 3).join(", ") || "none"})`)
        imported++
      } else {
        console.log(`  - Skipped: ${album.name}`)
        skipped++
      }
    } else {
      console.log(`  ✗ Not found`)
      failed++
    }

    // Rate limiting
    await new Promise((r) => setTimeout(r, 80))
  }

  console.log("\n" + "=".repeat(60))
  console.log(`DONE! Imported: ${imported}, Skipped: ${skipped}, Failed: ${failed}`)

  const [albumCount, trackCount] = await Promise.all([
    prisma.album.count(),
    prisma.track.count(),
  ])
  console.log(`Total albums: ${albumCount}, Total tracks: ${trackCount}`)
  console.log("=".repeat(60))

  await prisma.$disconnect()
}

main().catch(console.error)
