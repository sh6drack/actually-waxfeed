import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// REAL lists scraped from publications - December 2025
const CURATED_LISTS = [
  {
    title: "Pitchfork's 50 Best Albums of 2025",
    description: "The 50 best albums of 2025 as selected by Pitchfork.",
    albums: [
      { artist: "Los Thuthanaka", title: "Los Thuthanaka" },
      { artist: "Dijon", title: "Baby" },
      { artist: "Cameron Winter", title: "Heavy Metal" },
      { artist: "Oklou", title: "Choke Enough" },
      { artist: "Bad Bunny", title: "DeBÍ TiRAR MáS FOToS" },
      { artist: "Wednesday", title: "Bleeds" },
      { artist: "Geese", title: "Getting Killed" },
      { artist: "Joanne Robertson", title: "Blurrr" },
      { artist: "Nourished By Time", title: "The Passionate Ones" },
      { artist: "Amaarae", title: "Black Star" },
      { artist: "Smerz", title: "Big City Life" },
      { artist: "Addison Rae", title: "Addison" },
      { artist: "Sudan Archives", title: "The BPM" },
      { artist: "Barker", title: "Stochastic Drift" },
      { artist: "Earl Sweatshirt", title: "Live Laugh Love" },
      { artist: "Rosalía", title: "Lux" },
      { artist: "Water From Your Eyes", title: "It's a Beautiful Place" },
      { artist: "PinkPantheress", title: "Fancy That" },
      { artist: "Titanic", title: "HAGEN" },
      { artist: "Nick León", title: "A Tropical Entropy" },
      { artist: "Billy Woods", title: "Golliwog" },
      { artist: "aya", title: "hexed!" },
      { artist: "Alex G", title: "Headlights" },
      { artist: "Blood Orange", title: "Essex Honey" },
      { artist: "Rochelle Jordan", title: "Through The Wall" },
      { artist: "Erika de Casier", title: "Lifetime" },
      { artist: "Djrum", title: "Under Tangled Silence" },
      { artist: "caroline", title: "Caroline 2" },
      { artist: "YHWH Nailgun", title: "45 Pounds" },
      { artist: "Oneohtrix Point Never", title: "Tranquilizer" },
      { artist: "Ryan Davis & the Roadhouse Band", title: "New Threats from the Soul" },
      { artist: "WNC WhopBezzy", title: "Out The Blue" },
      { artist: "Ichiko Aoba", title: "Luminescent Creatures" },
      { artist: "Lucrecia Dalt", title: "A Danger to Ourselves" },
      { artist: "Playboi Carti", title: "Music" },
      { artist: "Wet Leg", title: "Moisturizer" },
      { artist: "Blawan", title: "SickElixir" },
      { artist: "Hayden Pedigo", title: "I'll Be Waving as You Drive Away" },
      { artist: "Che", title: "Rest in Bass" },
      { artist: "KeiyaA", title: "hooke's law" },
      { artist: "KP SKYWALKA", title: "I Tried To Tell You" },
      { artist: "FKA twigs", title: "Eusexua" },
      { artist: "Panda Bear", title: "Sinister Grift" },
      { artist: "Annahstasia", title: "Tether" },
      { artist: "Mike", title: "Showbiz!" },
      { artist: "Cleo Reed", title: "Cuntry" },
      { artist: "james K", title: "Friend" },
      { artist: "Perfume Genius", title: "Glory" },
      { artist: "bassvictim", title: "Forever" },
      { artist: "Sharp Pins", title: "Radio DDR" },
    ]
  },
  {
    title: "NME's 50 Best Albums of 2025",
    description: "NME's definitive list of the best albums released in 2025.",
    albums: [
      { artist: "Geese", title: "Getting Killed" },
      { artist: "Addison Rae", title: "Addison" },
      { artist: "FKA twigs", title: "Eusexua" },
      { artist: "CMAT", title: "Euro-Country" },
      { artist: "Bad Bunny", title: "DeBÍ TiRAR MáS FOToS" },
      { artist: "Oklou", title: "Choke Enough" },
      { artist: "Rosalía", title: "Lux" },
      { artist: "Turnstile", title: "Never Enough" },
      { artist: "Hayley Williams", title: "Ego Death at a Bachelorette Party" },
      { artist: "PinkPantheress", title: "Fancy That" },
      { artist: "Wolf Alice", title: "The Clearing" },
      { artist: "Amaarae", title: "Black Star" },
      { artist: "Lily Allen", title: "West End Girl" },
      { artist: "Jim Legxacy", title: "Black British Music" },
      { artist: "Blood Orange", title: "Essex Honey" },
      { artist: "Pulp", title: "More" },
      { artist: "Jade", title: "That's Showbiz Baby" },
      { artist: "Olivia Dean", title: "The Art of Loving" },
      { artist: "Lady Gaga", title: "Mayhem" },
      { artist: "Sam Fender", title: "People Watching" },
      { artist: "Deftones", title: "Private Music" },
      { artist: "Wet Leg", title: "Moisturizer" },
      { artist: "YHWH Nailgun", title: "45 Pounds" },
      { artist: "Lorde", title: "Virgin" },
      { artist: "Clipse", title: "Let God Sort Em Out" },
      { artist: "Big Thief", title: "Double Infinity" },
      { artist: "Florence + The Machine", title: "Everybody Scream" },
      { artist: "Nourished By Time", title: "The Passionate Ones" },
      { artist: "The Last Dinner Party", title: "From the Pyre" },
      { artist: "Annahstasia", title: "Tether" },
      { artist: "Spiritbox", title: "Tsunami Sea" },
      { artist: "Lambrini Girls", title: "Who Let the Dogs Out" },
      { artist: "Dijon", title: "Baby" },
      { artist: "Wretch 32", title: "Home?" },
      { artist: "Haim", title: "I Quit" },
      { artist: "Folk Bitch Trio", title: "Now Would Be a Good Time" },
      { artist: "Rochelle Jordan", title: "Through The Wall" },
      { artist: "Tyler, The Creator", title: "Don't Tap the Glass" },
      { artist: "Maruja", title: "Pain to Power" },
      { artist: "Vlure", title: "Escalate" },
      { artist: "Knucks", title: "A Fine African Man" },
      { artist: "Wednesday", title: "Bleeds" },
      { artist: "Erika de Casier", title: "Lifetime" },
      { artist: "Samia", title: "Bloodless" },
      { artist: "Denzel Himself", title: "Violator" },
      { artist: "Ethel Cain", title: "Willoughby Tucker, I'll Always Love You" },
      { artist: "Rose Gray", title: "Louder, Please" },
      { artist: "EsDeeKid", title: "Rebel" },
      { artist: "Nmixx", title: "Blue Valentine" },
      { artist: "Viagra Boys", title: "Viagr Aboys" },
    ]
  },
  {
    title: "Rolling Stone's 100 Best Albums of 2025",
    description: "Rolling Stone's top 100 albums of 2025.",
    albums: [
      { artist: "Bad Bunny", title: "DeBÍ TiRAR MáS FOToS" },
      { artist: "Lady Gaga", title: "Mayhem" },
      { artist: "Rosalía", title: "Lux" },
      { artist: "Dijon", title: "Baby" },
      { artist: "Geese", title: "Getting Killed" },
      { artist: "Clipse", title: "Let God Sort Em Out" },
      { artist: "Tyler Childers", title: "Snipe Hunter" },
      { artist: "Wednesday", title: "Bleeds" },
      { artist: "Hayley Williams", title: "Ego Death at a Bachelorette Party" },
      { artist: "Playboi Carti", title: "Music" },
      { artist: "FKA twigs", title: "Eusexua" },
      { artist: "Addison Rae", title: "Addison" },
      { artist: "Sabrina Carpenter", title: "Man's Best Friend" },
      { artist: "Earl Sweatshirt", title: "Live Laugh Love" },
      { artist: "Taylor Swift", title: "The Life of a Showgirl" },
      { artist: "Silvana Estrada", title: "Vendrán Suaves Lluvias" },
      { artist: "Billy Woods", title: "Golliwog" },
      { artist: "Carter Faith", title: "Cherry Valley" },
      { artist: "Olivia Dean", title: "The Art of Loving" },
      { artist: "Justin Bieber", title: "Swag" },
      { artist: "Lifeguard", title: "Ripped and Torn" },
      { artist: "Jade", title: "That's Showbiz Baby" },
      { artist: "PinkPantheress", title: "Fancy That" },
      { artist: "Teyana Taylor", title: "Escape Room" },
      { artist: "Florence + The Machine", title: "Everybody Scream" },
      { artist: "Eric Church", title: "Evangeline vs. the Machine" },
      { artist: "Sarz", title: "Protect Sarz At All Costs" },
      { artist: "Jeff Tweedy", title: "Twilight Override" },
      { artist: "Jennie", title: "Ruby" },
      { artist: "Lorde", title: "Virgin" },
      { artist: "Turnstile", title: "Never Enough" },
      { artist: "Cameron Winter", title: "Heavy Metal" },
      { artist: "Lily Allen", title: "West End Girl" },
      { artist: "Karol G", title: "Tropicoqueta" },
      { artist: "Haim", title: "I Quit" },
      { artist: "Snocaps", title: "Snocaps" },
      { artist: "Amaarae", title: "Black Star" },
      { artist: "Jim Legxacy", title: "Black British Music" },
      { artist: "Horsegirl", title: "Phonetics On and On" },
      { artist: "Charley Crockett", title: "Dollar a Day" },
      { artist: "Pulp", title: "More" },
      { artist: "Nourished By Time", title: "The Passionate Ones" },
      { artist: "Japanese Breakfast", title: "For Melancholy Brunettes (& Sad Women)" },
      { artist: "Zara Larsson", title: "Midnight Sun" },
      { artist: "Little Simz", title: "Lotus" },
      { artist: "Guitarricadelafuente", title: "Spanish Leather" },
      { artist: "Oklou", title: "Choke Enough" },
      { artist: "Not for Radio", title: "Melt" },
      { artist: "Lola Young", title: "I'm Only F***ing Myself" },
      { artist: "Fuerza Regida", title: "111xpantia" },
      { artist: "Central Cee", title: "Can't Rush Greatness" },
      { artist: "Alex G", title: "Headlights" },
      { artist: "Reneé Rapp", title: "Bite Me" },
      { artist: "Mike", title: "Showbiz!" },
      { artist: "Water From Your Eyes", title: "It's a Beautiful Place" },
      { artist: "Mark Pritchard", title: "Tall Tales" },
      { artist: "Giveon", title: "Beloved" },
      { artist: "Tate McRae", title: "So Close to What" },
      { artist: "Bon Iver", title: "Sable, Fable" },
      { artist: "Cardi B", title: "Am I the Drama?" },
      { artist: "kwn", title: "with all due respect" },
      { artist: "Jensen McRae", title: "I Don't Know How but They Found Me!" },
      { artist: "Wet Leg", title: "Moisturizer" },
      { artist: "Craig Finn", title: "Always Been" },
      { artist: "Wolf Alice", title: "The Clearing" },
      { artist: "OsamaSon", title: "Jump Out" },
      { artist: "Mavis Staples", title: "Sad and Beautiful World" },
      { artist: "girlpuppy", title: "Sweetness" },
      { artist: "Monaleo", title: "Who Did the Body" },
      { artist: "Kelsey Waldon", title: "Every Ghost" },
      { artist: "The Beaches", title: "No Hard Feelings" },
      { artist: "Milo J", title: "La vida era más corta" },
      { artist: "Davido", title: "5ive" },
      { artist: "hannah bahng", title: "The Misunderstood EP" },
      { artist: "Brandi Carlile", title: "Returning to Myself" },
      { artist: "Deftones", title: "Private Music" },
      { artist: "CMAT", title: "Euro-Country" },
      { artist: "Mobb Deep", title: "Infinite" },
      { artist: "Hannah Cohen", title: "Earthstar Mountain" },
      { artist: "They Are Gutting a Body of Water", title: "LOTTO" },
      { artist: "Brian Dunne", title: "Clams Casino" },
      { artist: "Cuco", title: "Ridin'" },
      { artist: "KAYTRANADA", title: "Ain't No Damn Way!" },
      { artist: "Open Mike Eagle", title: "Neighborhood Gods Unlimited" },
      { artist: "Momma", title: "Welcome to My Blue Sky" },
      { artist: "Chaeyoung", title: "Lil Fantasy Vol. 1" },
      { artist: "Amber Mark", title: "Pretty Idea" },
      { artist: "FOLA", title: "catharsis" },
      { artist: "Selena Gomez", title: "I Said I Love You First" },
      { artist: "Bob Mould", title: "Here We Go Crazy" },
      { artist: "PartyNextDoor", title: "Some Sexy Songs 4 U" },
      { artist: "Bar Italia", title: "Some Like It Hot" },
      { artist: "Freddie Gibbs", title: "Alfredo 2" },
      { artist: "Blondshell", title: "If You Asked for a Picture" },
      { artist: "Lucy Dacus", title: "Forever Is a Feeling" },
      { artist: "Chance the Rapper", title: "Star Line" },
      { artist: "Lizzo", title: "My Face Hurts from Smiling" },
      { artist: "Demi Lovato", title: "It's Not That Deep" },
      { artist: "Skrillex", title: "Fuck U Skrillex You Think Ur Andy Warhol but Ur Not!!" },
      { artist: "Sombr", title: "I Barely Know Her" },
    ]
  }
]

async function getSpotifyToken(): Promise<string> {
  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  })
  const data = await response.json()
  return data.access_token
}

async function searchAlbum(token: string, artist: string, title: string) {
  const query = `album:${title} artist:${artist}`
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=album&limit=1`,
    { headers: { Authorization: `Bearer ${token}` } }
  )
  const data = await response.json()
  return data.albums?.items?.[0] || null
}

// GET also works for convenience
export async function GET(request: NextRequest) {
  return POST(request)
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()

    // Must be logged in AND be an admin
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Verify admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: "Forbidden - Admin access required" }, { status: 403 })
    }

    const token = await getSpotifyToken()
    const results = []

    for (const listData of CURATED_LISTS) {
      // Check if list already exists
      const existingList = await prisma.list.findFirst({
        where: {
          title: listData.title,
          userId: session.user.id
        }
      })

      if (existingList) {
        results.push({ list: listData.title, status: "skipped", reason: "already exists" })
        continue
      }

      // Create the list
      const list = await prisma.list.create({
        data: {
          userId: session.user.id,
          title: listData.title,
          description: listData.description,
          isRanked: true,
          isPublic: true,
          publishedAt: new Date(),
        }
      })

      let position = 1
      let albumsAdded = 0

      for (const albumInfo of listData.albums) {
        // Search for album on Spotify
        const spotifyAlbum = await searchAlbum(token, albumInfo.artist, albumInfo.title)

        if (!spotifyAlbum || spotifyAlbum.album_type === "single" || !spotifyAlbum.release_date) {
          continue
        }

        // Check if album exists in our database
        let album = await prisma.album.findFirst({
          where: { spotifyId: spotifyAlbum.id }
        })

        // If not, create it
        if (!album) {
          album = await prisma.album.create({
            data: {
              spotifyId: spotifyAlbum.id,
              title: spotifyAlbum.name,
              artistName: spotifyAlbum.artists[0]?.name || "Unknown",
              coverArtUrl: spotifyAlbum.images[0]?.url,
              releaseDate: new Date(spotifyAlbum.release_date),
              albumType: spotifyAlbum.album_type,
              totalTracks: spotifyAlbum.total_tracks,
            }
          })
        }

        // Add to list
        await prisma.listItem.create({
          data: {
            listId: list.id,
            albumId: album.id,
            position: position++,
          }
        })

        albumsAdded++

        // Rate limit
        await new Promise(r => setTimeout(r, 100))
      }

      results.push({ list: listData.title, status: "created", albumsAdded })
    }

    return NextResponse.json({
      success: true,
      results,
      message: "Lists seeded successfully"
    })
  } catch (error) {
    console.error("Error seeding lists:", error)
    return NextResponse.json(
      { error: "Failed to seed lists", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    )
  }
}
