import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET

// Rate limiting config - be conservative to avoid long bans
const BASE_DELAY = 500 // 500ms between requests (slower but safer)
const MAX_RETRIES = 3
const INITIAL_BACKOFF = 5000 // 5 seconds
const MAX_WAIT_TIME = 60000 // Cap wait time at 60 seconds

async function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms))
}

async function fetchWithRetry(url: string, options: RequestInit, retries = MAX_RETRIES): Promise<Response> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const response = await fetch(url, options)

    if (response.status === 429) {
      // Rate limited - get retry-after header or use exponential backoff
      const retryAfter = response.headers.get('retry-after')
      let waitTime = retryAfter
        ? parseInt(retryAfter) * 1000
        : INITIAL_BACKOFF * Math.pow(2, attempt)

      // Cap wait time - if Spotify says wait > 60s, we're likely banned for a while
      if (waitTime > MAX_WAIT_TIME) {
        console.log(`⚠️  Rate limit too long (${waitTime/1000}s). Capping at ${MAX_WAIT_TIME/1000}s...`)
        waitTime = MAX_WAIT_TIME
      }

      console.log(`⚠️  Rate limited. Waiting ${waitTime/1000}s before retry ${attempt + 1}/${retries}...`)
      await sleep(waitTime)
      continue
    }

    if (!response.ok && attempt < retries) {
      const waitTime = Math.min(INITIAL_BACKOFF * Math.pow(2, attempt), MAX_WAIT_TIME)
      console.log(`⚠️  Request failed (${response.status}). Retrying in ${waitTime/1000}s...`)
      await sleep(waitTime)
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

interface SpotifyArtist {
  id: string
  name: string
}

async function searchAlbums(token: string, query: string, limit = 50): Promise<SpotifyAlbum[]> {
  try {
    const response = await fetchWithRetry(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=${limit}`,
      { headers: { Authorization: `Bearer ${token}` } }
    )
    const data = await response.json()
    return data.albums?.items || []
  } catch {
    return []
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

async function searchArtist(token: string, name: string): Promise<SpotifyArtist | null> {
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

// ============================================
// MASSIVE ARTIST LISTS BY GENRE
// ============================================

// R&B / Neo Soul / Alt R&B
const RNB_ARTISTS = [
  // Classic R&B
  "Marvin Gaye", "Stevie Wonder", "Aretha Franklin", "Al Green", "Curtis Mayfield",
  "Otis Redding", "Sam Cooke", "Ray Charles", "James Brown", "The Temptations",
  "The Supremes", "Smokey Robinson", "Earth Wind & Fire", "Chaka Khan", "Luther Vandross",
  "Whitney Houston", "Prince", "Michael Jackson", "Janet Jackson", "Tina Turner",
  "Anita Baker", "Sade", "Babyface", "Boyz II Men", "TLC",
  "Aaliyah", "Brandy", "Monica", "Mary J Blige", "Toni Braxton",
  "R Kelly", "Keith Sweat", "Jodeci", "SWV", "En Vogue",
  "Destiny's Child", "Beyonce", "Alicia Keys", "Usher", "Chris Brown",

  // Neo Soul
  "D'Angelo", "Erykah Badu", "Lauryn Hill", "Maxwell", "Jill Scott",
  "India.Arie", "Musiq Soulchild", "Anthony Hamilton", "John Legend", "Raphael Saadiq",
  "Meshell Ndegeocello", "Bilal", "Dwele", "Raheem DeVaughn", "Eric Roberson",
  "Goapele", "Floetry", "Jaguar Wright", "Kindred the Family Soul", "Leela James",

  // Alt R&B / Modern R&B
  "Frank Ocean", "The Weeknd", "SZA", "Daniel Caesar", "Khalid",
  "H.E.R.", "Summer Walker", "Snoh Aalegra", "Jhene Aiko", "Kehlani",
  "Brent Faiyaz", "Steve Lacy", "Giveon", "Lucky Daye", "Ari Lennox",
  "Victoria Monet", "Chloe x Halle", "Normani", "Tinashe", "Sevyn Streeter",
  "dvsn", "PARTYNEXTDOOR", "6LACK", "Bryson Tiller", "Ty Dolla Sign",
  "Jeremih", "Trey Songz", "August Alsina", "Jacquees", "Ella Mai",
  "Jorja Smith", "Mahalia", "NAO", "Ravyn Lenae", "Amaarae",
  "Tems", "Ayra Starr", "Tiwa Savage", "WizKid", "Burna Boy",
  "Raveena", "Sabrina Claudio", "Kali Uchis", "Jessie Reyez", "Amber Mark",
  "Kelela", "Solange", "FKA twigs", "Sampha", "James Blake",
  "Blood Orange", "Moses Sumney", "Mereba", "Jean Deaux", "UMI",
  "Emotional Oranges", "Pink Sweat$", "Vedo", "Mariah the Scientist", "Cleo Sol",
  "Joy Crookes", "Pip Millett", "Bree Runway", "Tiana Major9", "Ray BLK",

  // R&B House / Dance R&B
  "Janet Jackson", "Mary J Blige", "Brandy", "Monica", "Ciara",
  "Tinashe", "Normani", "Doja Cat", "Chloe Bailey", "FLO",
]

// Hip Hop / Rap / Trap
const HIPHOP_ARTISTS = [
  // Pioneers & Legends
  "Grandmaster Flash", "Run DMC", "LL Cool J", "Public Enemy", "Eric B & Rakim",
  "KRS-One", "Big Daddy Kane", "EPMD", "Slick Rick", "Biz Markie",
  "De La Soul", "A Tribe Called Quest", "Jungle Brothers", "DJ Jazzy Jeff & Fresh Prince",
  "Ice-T", "N.W.A", "Ice Cube", "Dr. Dre", "Snoop Dogg", "2Pac",
  "The Notorious B.I.G.", "Wu-Tang Clan", "Nas", "Jay-Z", "DMX",
  "Busta Rhymes", "Method Man", "Redman", "OutKast", "Goodie Mob",
  "Bone Thugs-N-Harmony", "Cypress Hill", "The Roots", "Common", "Mos Def",
  "Talib Kweli", "Black Star", "Mobb Deep", "Raekwon", "Ghostface Killah",
  "GZA", "Scarface", "UGK", "8Ball & MJG", "Three 6 Mafia",

  // 2000s Era
  "Eminem", "50 Cent", "Kanye West", "Lil Wayne", "T.I.",
  "Ludacris", "Nelly", "Ja Rule", "Cam'ron", "Dipset",
  "Young Jeezy", "Rick Ross", "Gucci Mane", "T-Pain", "Lupe Fiasco",
  "Kid Cudi", "J. Cole", "Wale", "Big Sean", "Meek Mill",
  "Mac Miller", "Wiz Khalifa", "Curren$y", "Freddie Gibbs", "Danny Brown",
  "Action Bronson", "ScHoolboy Q", "Ab-Soul", "Jay Rock", "Isaiah Rashad",

  // Modern Era / Trap
  "Kendrick Lamar", "Drake", "Travis Scott", "Future", "Young Thug",
  "Migos", "21 Savage", "Metro Boomin", "Gunna", "Lil Baby",
  "Roddy Ricch", "DaBaby", "Pop Smoke", "Juice WRLD", "XXXTentacion",
  "Lil Uzi Vert", "Playboi Carti", "Lil Yachty", "Post Malone", "A$AP Rocky",
  "A$AP Ferg", "Tyler the Creator", "Earl Sweatshirt", "Vince Staples", "Aminé",
  "JID", "Denzel Curry", "JPEGMAFIA", "slowthai", "Little Simz",
  "Dave", "Stormzy", "Skepta", "Wiley", "Giggs",
  "Central Cee", "Headie One", "Fredo", "Tion Wayne", "AJ Tracey",

  // New Generation
  "Baby Keem", "Don Toliver", "Jack Harlow", "Cordae", "IDK",
  "Smino", "Saba", "Noname", "Chance the Rapper", "Vic Mensa",
  "Joey Bada$$", "Flatbush Zombies", "The Underachievers", "Pro Era", "Westside Gunn",
  "Conway the Machine", "Benny the Butcher", "Boldy James", "Roc Marciano", "Ka",
  "Billy Woods", "Armand Hammer", "Mavi", "Navy Blue", "MIKE",
  "Yeat", "Ken Carson", "Destroy Lonely", "Lancey Foux", "SoFaygo",

  // Women in Hip Hop
  "Nicki Minaj", "Cardi B", "Megan Thee Stallion", "Doja Cat", "Ice Spice",
  "Saweetie", "City Girls", "Glorilla", "Latto", "Flo Milli",
  "Rico Nasty", "Tierra Whack", "Noname", "Rapsody", "Little Simz",
  "Missy Elliott", "Lil Kim", "Foxy Brown", "Eve", "Lauryn Hill",
  "Queen Latifah", "MC Lyte", "Salt-N-Pepa", "Da Brat", "Trina",
]

// House / Electronic / Dance
const HOUSE_ARTISTS = [
  // Chicago / Detroit House
  "Frankie Knuckles", "Larry Heard", "Marshall Jefferson", "Ron Hardy", "Derrick Carter",
  "Gene Farris", "DJ Sneak", "Cajmere", "Glenn Underground", "Ron Trent",
  "Moodymann", "Theo Parrish", "Omar S", "Kyle Hall", "Jay Daniel",

  // UK House / Garage
  "Disclosure", "Duke Dumont", "MK", "Todd Edwards", "Burial",
  "Four Tet", "Floating Points", "Caribou", "Jamie xx", "SBTRKT",
  "Rudimental", "Chase & Status", "Sub Focus", "Wilkinson", "Fred Again",
  "Overmono", "Bicep", "Ross From Friends", "Mall Grab", "DJ Seinfeld",

  // Deep House / Afro House
  "Black Coffee", "Culoe De Song", "Da Capo", "Enoo Napa", "Sun-El Musician",
  "Shimza", "Prince Kaybee", "Zakes Bantwini", "Mi Casa", "Bucie",
  "Louie Vega", "Kenny Dope", "Kerri Chandler", "Dennis Ferrer", "DJ Spen",

  // French House / Nu Disco
  "Daft Punk", "Justice", "Cassius", "Alan Braxe", "Fred Falke",
  "Breakbot", "Kavinsky", "Madeon", "Gesaffelstein", "SebastiAn",
  "Chromeo", "Poolside", "Roosevelt", "Purple Disco Machine", "Tensnake",

  // Tech House / Minimal
  "Fisher", "Chris Lake", "Solardo", "Camelphat", "Hot Since 82",
  "Patrick Topping", "Green Velvet", "Claude VonStroke", "Justin Martin", "Walker & Royce",

  // R&B House / Soulful House
  "Kaytranada", "Channel Tres", "Jayda G", "Honey Dijon", "The Blessed Madonna",
  "Peggy Gou", "TOKiMONSTA", "Sango", "Esta", "Stwo",
]

// Indie / Alternative
const INDIE_ARTISTS = [
  // Classic Indie / Alt Rock
  "Radiohead", "The Smiths", "The Cure", "Joy Division", "New Order",
  "Depeche Mode", "Pixies", "Sonic Youth", "My Bloody Valentine", "Slowdive",
  "Cocteau Twins", "This Mortal Coil", "Dead Can Dance", "Siouxsie and the Banshees",
  "R.E.M.", "The Replacements", "Husker Du", "Dinosaur Jr", "Pavement",
  "Guided by Voices", "Built to Spill", "Modest Mouse", "Elliott Smith", "Jeff Buckley",
  "Nick Drake", "Leonard Cohen", "Joni Mitchell", "Kate Bush", "Bjork",

  // 2000s Indie
  "The Strokes", "Interpol", "Yeah Yeah Yeahs", "LCD Soundsystem", "TV on the Radio",
  "Arcade Fire", "Vampire Weekend", "Fleet Foxes", "Bon Iver", "Grizzly Bear",
  "Animal Collective", "Panda Bear", "Beach House", "Tame Impala", "MGMT",
  "Phoenix", "The National", "Sufjan Stevens", "Iron & Wine", "Death Cab for Cutie",
  "The Shins", "Spoon", "Wilco", "Broken Social Scene", "Stars",
  "Of Montreal", "Neutral Milk Hotel", "The Microphones", "Mount Eerie", "Sun Kil Moon",

  // Modern Indie
  "Phoebe Bridgers", "Boygenius", "Big Thief", "Adrianne Lenker", "Angel Olsen",
  "Weyes Blood", "Julia Holter", "Cate Le Bon", "Aldous Harding", "Amen Dunes",
  "Alex G", "Soccer Mommy", "Snail Mail", "Clairo", "Beabadoobee",
  "Japanese Breakfast", "Michelle Zauner", "Mitski", "St. Vincent", "Perfume Genius",
  "Arca", "SOPHIE", "Caroline Polachek", "Charli XCX", "Rina Sawayama",
  "100 gecs", "Dorian Electra", "Kim Petras", "Slayyyter", "Hannah Diamond",

  // Indie Rock / Post Punk Revival
  "Fontaines D.C.", "IDLES", "Squid", "Black Country, New Road", "Black Midi",
  "Dry Cleaning", "Porridge Radio", "Shame", "Yard Act", "English Teacher",
  "Parquet Courts", "Protomartyr", "Preoccupations", "Ought", "Women",
  "Deerhunter", "Atlas Sound", "Wild Nothing", "DIIV", "Widowspeak",

  // Dream Pop / Shoegaze
  "Cigarettes After Sex", "Men I Trust", "Boy Pablo", "Still Woozy", "Gus Dapperton",
  "Current Joys", "Surf Curse", "The Marías", "Inner Wave", "Cuco",
  "Omar Apollo", "Dominic Fike", "Rex Orange County", "Yellow Days", "Wallows",

  // Art Pop / Experimental
  "FKA twigs", "Arca", "Bjork", "Grimes", "Sevdaliza",
  "Rosalia", "Bad Bunny", "J Balvin", "Rauw Alejandro", "Tokischa",
]

// Additional Genre Searches
const GENRE_SEARCHES = [
  // R&B specific searches
  "90s r&b classic", "new jack swing", "quiet storm r&b", "contemporary r&b 2020s",
  "alternative r&b", "progressive r&b", "experimental r&b", "uk r&b",
  "neo soul essential", "soul music classic", "motown classics", "philadelphia soul",

  // Hip Hop searches
  "golden age hip hop", "east coast hip hop classic", "west coast g-funk",
  "southern hip hop classic", "underground hip hop", "conscious hip hop",
  "trap music essential", "drill music", "uk drill", "brooklyn drill",
  "memphis rap", "houston chopped screwed", "bay area hyphy",

  // House searches
  "chicago house classic", "deep house essential", "afro house 2020",
  "uk garage classic", "2 step garage", "speed garage", "jersey club",
  "amapiano essential", "soulful house", "disco house", "french touch",

  // Indie searches
  "indie rock essential", "dream pop essential", "shoegaze classic",
  "post punk revival", "art rock", "chamber pop", "baroque pop",
  "lo-fi indie", "bedroom pop", "hyperpop essential", "pc music",

  // Crossover / Fusion
  "r&b hip hop fusion", "alternative hip hop", "jazz rap", "trip hop essential",
  "downtempo electronic", "nu jazz", "future soul", "electro soul",
]

async function main() {
  console.log("🎵 MASSIVE GENRE IMPORT - R&B, Hip Hop, House, Indie, Alt")
  console.log("=" .repeat(60))

  const startCount = await prisma.album.count()
  console.log(`Starting with ${startCount} albums in database\n`)

  let token = await getSpotifyToken()
  let totalImported = 0
  let artistsProcessed = 0

  const allArtists = [
    ...RNB_ARTISTS.map(name => ({ name, genre: "R&B" })),
    ...HIPHOP_ARTISTS.map(name => ({ name, genre: "Hip Hop" })),
    ...HOUSE_ARTISTS.map(name => ({ name, genre: "House" })),
    ...INDIE_ARTISTS.map(name => ({ name, genre: "Indie" })),
  ]

  console.log(`Processing ${allArtists.length} artists across all genres...\n`)

  // Process artists
  for (const { name, genre } of allArtists) {
    try {
      // Refresh token every 100 artists
      if (artistsProcessed > 0 && artistsProcessed % 100 === 0) {
        token = await getSpotifyToken()
        console.log(`\n🔄 Refreshed token at ${artistsProcessed} artists`)
      }

      const artist = await searchArtist(token, name)
      if (!artist) {
        console.log(`  ✗ ${name} not found`)
        continue
      }

      const albums = await getArtistAlbums(token, artist.id)
      let imported = 0

      for (const album of albums) {
        if (await importAlbum(album)) {
          imported++
          totalImported++
        }
      }

      if (imported > 0) {
        console.log(`  ✓ ${name} [${genre}]: ${imported} albums`)
      }

      artistsProcessed++

      // Progress update every 50 artists
      if (artistsProcessed % 50 === 0) {
        const currentCount = await prisma.album.count()
        console.log(`\n📊 Progress: ${artistsProcessed}/${allArtists.length} artists | ${totalImported} new albums | ${currentCount} total\n`)
      }

      await sleep(BASE_DELAY)
    } catch (error) {
      console.error(`  Error with ${name}:`, error)
    }
  }

  console.log("\n" + "=" .repeat(60))
  console.log("🔍 Processing genre searches...\n")

  // Process genre searches
  for (const query of GENRE_SEARCHES) {
    try {
      const albums = await searchAlbums(token, query)
      let imported = 0

      for (const album of albums) {
        if (await importAlbum(album)) {
          imported++
          totalImported++
        }
      }

      if (imported > 0) {
        console.log(`  ✓ "${query}": ${imported} albums`)
      }

      await sleep(BASE_DELAY)
    } catch (error) {
      console.error(`  Error with search "${query}":`, error)
    }
  }

  const finalCount = await prisma.album.count()

  console.log("\n" + "=" .repeat(60))
  console.log("🎉 IMPORT COMPLETE!")
  console.log(`   Artists processed: ${artistsProcessed}`)
  console.log(`   New albums imported: ${totalImported}`)
  console.log(`   Total albums in database: ${finalCount}`)
  console.log("=" .repeat(60))

  await prisma.$disconnect()
}

main().catch(console.error)
