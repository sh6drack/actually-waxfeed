import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

// Conservative rate limiting for continuous running
const BASE_DELAY = 600 // 600ms between requests
const BATCH_DELAY = 30000 // 30 seconds between batches
const BATCH_SIZE = 20 // Process 20 artists per batch
const MAX_RETRIES = 3
const INITIAL_BACKOFF = 5000

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options)

    if (response.status === 429) {
      const retryAfter = response.headers.get('retry-after')
      let waitTime = retryAfter
        ? Math.min(parseInt(retryAfter) * 1000, 120000) // Cap at 2 minutes
        : INITIAL_BACKOFF * Math.pow(2, attempt)

      console.log(`⚠️  Rate limited. Waiting ${waitTime/1000}s...`)
      await sleep(waitTime)
      continue
    }

    if (!response.ok && attempt < retries) {
      await sleep(INITIAL_BACKOFF * Math.pow(2, attempt))
      continue
    }

    return response
  }
  throw new Error(`Failed after ${retries} retries`)
}

async function getSpotifyToken(): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })
  const data = await response.json()
  return data.access_token
}

interface SpotifyAlbum {
  id: string
  name: string
  artists: { name: string; id: string }[]
  images: { url: string; width: number }[]
  release_date: string
  album_type: string
  total_tracks: number
  external_urls: { spotify: string }
}

async function searchArtist(token: string, name: string): Promise<{ id: string; name: string } | null> {
  try {
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(name)}&type=artist&limit=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    return data.artists?.items?.[0] || null
  } catch {
    return null
  }
}

async function getArtistAlbums(token: string, artistId: string): Promise<SpotifyAlbum[]> {
  try {
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/artists/${artistId}/albums?include_groups=album&limit=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    return data.items || []
  } catch {
    return []
  }
}

async function importAlbum(album: SpotifyAlbum): Promise<boolean> {
  try {
    if (album.album_type === "single" && album.total_tracks < 4) return false
    if (album.album_type === "compilation") return false

    const existing = await prisma.album.findUnique({
      where: { spotifyId: album.id }
    })
    if (existing) return false

    const images = album.images.sort((a, b) => b.width - a.width)

    await prisma.album.create({
      data: {
        spotifyId: album.id,
        title: album.name,
        artistName: album.artists.map(a => a.name).join(", "),
        artistSpotifyId: album.artists[0]?.id || null,
        coverArtUrl: images[0]?.url || null,
        coverArtUrlLarge: images[0]?.url || null,
        coverArtUrlMedium: images[1]?.url || null,
        coverArtUrlSmall: images[2]?.url || null,
        releaseDate: album.release_date ? new Date(album.release_date) : new Date(),
        genres: [],
        totalTracks: album.total_tracks,
        spotifyUrl: album.external_urls.spotify,
      },
    })
    return true
  } catch {
    return false
  }
}

// Extended artist lists for continuous import
const ALL_ARTISTS = [
  // Jazz
  "Miles Davis", "John Coltrane", "Thelonious Monk", "Charlie Parker", "Duke Ellington",
  "Herbie Hancock", "Wayne Shorter", "Chick Corea", "Pat Metheny", "Bill Evans",
  "Kamasi Washington", "Robert Glasper", "Christian Scott aTunde Adjuah", "Esperanza Spalding",
  "Terrace Martin", "Thundercat", "Flying Lotus", "BadBadNotGood", "Snarky Puppy",

  // Soul / Funk
  "Stevie Wonder", "Marvin Gaye", "Donny Hathaway", "Bill Withers", "Isaac Hayes",
  "Curtis Mayfield", "Parliament", "Funkadelic", "George Clinton", "Bootsy Collins",
  "Sly and the Family Stone", "The Isley Brothers", "Kool & The Gang", "Ohio Players",
  "Cameo", "The Gap Band", "Rick James", "Teena Marie", "Morris Day", "Deniece Williams",

  // Disco / Dance
  "Donna Summer", "Gloria Gaynor", "Sylvester", "Chic", "Sister Sledge",
  "KC and the Sunshine Band", "The Bee Gees", "Donna Summer", "Village People",
  "Diana Ross", "Barry White", "Love Unlimited Orchestra", "Evelyn Champagne King",

  // Contemporary R&B
  "Tank", "Avant", "Joe", "Ginuwine", "Mario",
  "Tevin Campbell", "Donell Jones", "Jaheim", "Dru Hill", "Next",
  "112", "Jagged Edge", "Case", "Carl Thomas", "Tyrese",
  "Omarion", "Marques Houston", "B2K", "Sammie", "Lloyd",
  "Pleasure P", "Pretty Ricky", "Day26", "Mario Winans", "Lyfe Jennings",

  // Gospel / Inspirational
  "Kirk Franklin", "Fred Hammond", "Donnie McClurkin", "Yolanda Adams", "CeCe Winans",
  "BeBe Winans", "Marvin Sapp", "Hezekiah Walker", "Mary Mary", "Tye Tribbett",
  "Tamela Mann", "William McDowell", "Travis Greene", "Jonathan McReynolds", "Tasha Cobbs",

  // Reggae / Dancehall
  "Bob Marley", "Peter Tosh", "Jimmy Cliff", "Burning Spear", "Dennis Brown",
  "Gregory Isaacs", "Beres Hammond", "Sizzla", "Capleton", "Buju Banton",
  "Shabba Ranks", "Beenie Man", "Bounty Killer", "Sean Paul", "Shaggy",
  "Damian Marley", "Stephen Marley", "Ziggy Marley", "Koffee", "Popcaan",
  "Vybz Kartel", "Chronixx", "Protoje", "Kabaka Pyramid", "Tarrus Riley",

  // Afrobeats / Afropop
  "Fela Kuti", "King Sunny Ade", "Youssou N'Dour", "Angelique Kidjo", "Salif Keita",
  "WizKid", "Burna Boy", "Davido", "Mr Eazi", "Rema",
  "Tems", "Ayra Starr", "Tiwa Savage", "Yemi Alade", "CKay",
  "Asake", "Fireboy DML", "Joeboy", "Omah Lay", "Adekunle Gold",
  "Patoranking", "Tekno", "Flavour", "P-Square", "2Baba",

  // UK Grime / UK Rap
  "Skepta", "Stormzy", "Wiley", "Dizzee Rascal", "Kano",
  "Dave", "J Hus", "Headie One", "Central Cee", "AJ Tracey",
  "Little Simz", "Slowthai", "Aitch", "Fredo", "Tion Wayne",
  "M Huncho", "Digga D", "Unknown T", "Russ Millions", "Ardee",

  // Latin / Reggaeton
  "Bad Bunny", "J Balvin", "Daddy Yankee", "Ozuna", "Maluma",
  "Anuel AA", "Rauw Alejandro", "Karol G", "Rosalia", "Nicky Jam",
  "Farruko", "Don Omar", "Wisin y Yandel", "Tego Calderon", "Calle 13",
  "C. Tangana", "El Alfa", "Myke Towers", "Jhay Cortez", "Feid",

  // Rock / Alternative
  "Led Zeppelin", "Pink Floyd", "The Rolling Stones", "The Beatles", "Queen",
  "David Bowie", "Fleetwood Mac", "Eagles", "Steely Dan", "The Police",
  "Nirvana", "Pearl Jam", "Soundgarden", "Alice in Chains", "Stone Temple Pilots",
  "Red Hot Chili Peppers", "Foo Fighters", "Green Day", "Blink-182", "Sum 41",
  "Linkin Park", "System of a Down", "Rage Against the Machine", "Tool", "Deftones",

  // Pop
  "Michael Jackson", "Madonna", "Whitney Houston", "Mariah Carey", "Celine Dion",
  "Janet Jackson", "Britney Spears", "Christina Aguilera", "Justin Timberlake", "Usher",
  "Beyonce", "Rihanna", "Lady Gaga", "Katy Perry", "Taylor Swift",
  "Ariana Grande", "Dua Lipa", "The Weeknd", "Bruno Mars", "Ed Sheeran",
  "Harry Styles", "Doja Cat", "Olivia Rodrigo", "Billie Eilish", "SZA",

  // Country
  "Johnny Cash", "Willie Nelson", "Dolly Parton", "Kenny Rogers", "Loretta Lynn",
  "George Jones", "Merle Haggard", "Waylon Jennings", "Alan Jackson", "George Strait",
  "Garth Brooks", "Tim McGraw", "Faith Hill", "Shania Twain", "Keith Urban",
  "Carrie Underwood", "Luke Bryan", "Blake Shelton", "Jason Aldean", "Chris Stapleton",
  "Morgan Wallen", "Luke Combs", "Kacey Musgraves", "Sturgill Simpson", "Tyler Childers",

  // Electronic / EDM
  "Aphex Twin", "Boards of Canada", "Autechre", "Squarepusher", "Burial",
  "Skrillex", "Deadmau5", "Calvin Harris", "David Guetta", "Tiesto",
  "Swedish House Mafia", "Avicii", "Marshmello", "Kygo", "The Chainsmokers",
  "Flume", "ODESZA", "Porter Robinson", "Madeon", "Illenium",
  "Zedd", "Martin Garrix", "Diplo", "Major Lazer", "DJ Snake",

  // Classical Crossover / Orchestral
  "Hans Zimmer", "John Williams", "Ennio Morricone", "Max Richter", "Ludovico Einaudi",
  "Yo-Yo Ma", "Itzhak Perlman", "Lang Lang", "Yuja Wang", "André Rieu",

  // More Hip Hop / Rap
  "Lil Durk", "Polo G", "NBA Youngboy", "King Von", "Lil Tjay",
  "A Boogie wit da Hoodie", "PnB Rock", "YNW Melly", "Moneybagg Yo", "EST Gee",
  "Quando Rondo", "Lil Keed", "42 Dugg", "Lil Gotit", "Doe Boy",
  "Babyface Ray", "Rio Da Yung OG", "Icewear Vezzo", "BabyTron", "RXKNephew",
  "Curren$y", "Larry June", "Jay Worthy", "Boldy James", "Stove God Cooks",

  // More Indie
  "The War on Drugs", "Bon Iver", "Sufjan Stevens", "Fleet Foxes", "Iron & Wine",
  "The Tallest Man on Earth", "Father John Misty", "Hozier", "Lord Huron", "Gregory Alan Isakov",
  "The Lumineers", "Vance Joy", "Passenger", "Jose Gonzalez", "Mumford & Sons",
  "Of Monsters and Men", "AURORA", "Agnes Obel", "Ane Brun", "First Aid Kit",

  // More Alternative R&B
  "Gallant", "Leon Bridges", "Anderson .Paak", "Masego", "Tom Misch",
  "Jacob Collier", "Cory Henry", "Moonchild", "The Internet", "Syd",
  "Steve Lacy", "Matt Martians", "Ravyn Lenae", "Jean Deaux", "Noname",

  // Experimental / Art
  "Bjork", "Radiohead", "Sigur Ros", "Massive Attack", "Portishead",
  "Thom Yorke", "Atoms for Peace", "Arca", "SOPHIE", "Oneohtrix Point Never",
  "Tim Hecker", "Fennesz", "William Basinski", "Brian Eno", "Ambient 1",
]

// Genre-based searches for discovery
const GENRE_SEARCHES = [
  // Decades
  "best albums 1970s", "best albums 1980s", "best albums 1990s", "best albums 2000s", "best albums 2010s",
  "classic albums 1975", "classic albums 1985", "classic albums 1995", "classic albums 2005",

  // Specific genres
  "acid jazz", "smooth jazz", "nu jazz", "jazz fusion", "bebop",
  "new jack swing", "quiet storm", "adult contemporary", "urban contemporary",
  "g-funk", "dirty south", "crunk", "snap music", "phonk",
  "uk bass", "grime essential", "dubstep", "drum and bass", "jungle",
  "vaporwave", "synthwave", "retrowave", "chillwave", "lo-fi beats",
  "amapiano", "afro house", "kwaito", "gqom", "afropiano",
  "dembow", "champeta", "kuduro", "baile funk", "reggaeton clasico",
  "k-pop essential", "city pop", "j-pop", "shibuya-kei", "future funk",
  "emo", "screamo", "post-hardcore", "metalcore", "deathcore",
  "psytrance", "progressive trance", "uplifting trance", "goa trance",
  "tech house", "progressive house", "melodic techno", "minimal techno",
  "witch house", "dark ambient", "industrial", "noise", "power electronics",
]

async function processArtistBatch(token: string, artists: string[]): Promise<number> {
  let imported = 0

  for (const name of artists) {
    try {
      const artist = await searchArtist(token, name)
      if (!artist) continue

      const albums = await getArtistAlbums(token, artist.id)
      for (const album of albums) {
        if (await importAlbum(album)) imported++
      }

      await sleep(BASE_DELAY)
    } catch (error) {
      console.error(`  Error with ${name}:`, error)
    }
  }

  return imported
}

async function processSearchBatch(token: string, searches: string[]): Promise<number> {
  let imported = 0

  for (const query of searches) {
    try {
      const response = await fetchWithRetry(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=50`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const data = await response.json()
      const albums = data.albums?.items || []

      for (const album of albums) {
        if (await importAlbum(album)) imported++
      }

      await sleep(BASE_DELAY)
    } catch (error) {
      console.error(`  Error with search "${query}":`, error)
    }
  }

  return imported
}

async function main() {
  console.log("🔄 CONTINUOUS ALBUM IMPORT")
  console.log("=" .repeat(60))
  console.log("Running continuously with rate limiting...\n")

  let totalImported = 0
  let cycleCount = 0

  // Shuffle arrays for variety
  const shuffledArtists = [...ALL_ARTISTS].sort(() => Math.random() - 0.5)
  const shuffledSearches = [...GENRE_SEARCHES].sort(() => Math.random() - 0.5)

  while (true) {
    cycleCount++
    const startCount = await prisma.album.count()
    console.log(`\n🔄 Cycle ${cycleCount} | Starting with ${startCount} albums`)

    let token = await getSpotifyToken()

    // Process artists in batches
    for (let i = 0; i < shuffledArtists.length; i += BATCH_SIZE) {
      const batch = shuffledArtists.slice(i, i + BATCH_SIZE)
      console.log(`  Processing artists ${i + 1}-${Math.min(i + BATCH_SIZE, shuffledArtists.length)}...`)

      const imported = await processArtistBatch(token, batch)
      totalImported += imported

      if (imported > 0) {
        console.log(`  ✓ Imported ${imported} albums`)
      }

      // Refresh token periodically
      if (i > 0 && i % 100 === 0) {
        token = await getSpotifyToken()
      }

      // Rest between batches
      console.log(`  💤 Resting ${BATCH_DELAY/1000}s...`)
      await sleep(BATCH_DELAY)
    }

    // Process searches
    console.log(`\n🔍 Processing ${shuffledSearches.length} genre searches...`)
    for (let i = 0; i < shuffledSearches.length; i += BATCH_SIZE) {
      const batch = shuffledSearches.slice(i, i + BATCH_SIZE)
      const imported = await processSearchBatch(token, batch)
      totalImported += imported

      if (imported > 0) {
        console.log(`  ✓ Imported ${imported} albums from searches`)
      }

      await sleep(BATCH_DELAY)
    }

    const endCount = await prisma.album.count()
    console.log(`\n📊 Cycle ${cycleCount} complete:`)
    console.log(`   Albums this cycle: ${endCount - startCount}`)
    console.log(`   Total imported: ${totalImported}`)
    console.log(`   Total in database: ${endCount}`)

    // Wait 5 minutes between full cycles
    console.log(`\n💤 Waiting 5 minutes before next cycle...`)
    await sleep(5 * 60 * 1000)

    // Re-shuffle for next cycle
    shuffledArtists.sort(() => Math.random() - 0.5)
    shuffledSearches.sort(() => Math.random() - 0.5)
  }
}

main().catch(console.error)
