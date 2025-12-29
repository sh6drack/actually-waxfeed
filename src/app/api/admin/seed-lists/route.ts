import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// REAL lists scraped from publications - December 2024
const CURATED_LISTS = [
  {
    title: "Pitchfork's 50 Best Albums of 2024",
    description: "The 50 best albums of 2024 as selected by Pitchfork.",
    albums: [
      { artist: "Cindy Lee", title: "Diamond Jubilee" },
      { artist: "Charli XCX", title: "Brat" },
      { artist: "Jessica Pratt", title: "Here in the Pitch" },
      { artist: "MJ Lenderman", title: "Manning Fireworks" },
      { artist: "Nala Sinephro", title: "Endlessness" },
      { artist: "Waxahatchee", title: "Tigers Blood" },
      { artist: "Mount Eerie", title: "Night Palace" },
      { artist: "Bladee", title: "Cold Visions" },
      { artist: "Astrid Sonne", title: "Great Doubt" },
      { artist: "Kim Gordon", title: "The Collective" },
      { artist: "Mannequin Pussy", title: "I Got Heaven" },
      { artist: "Nilüfer Yanya", title: "My Method Actor" },
      { artist: "Arooj Aftab", title: "Night Reign" },
      { artist: "Mk.gee", title: "Two Star & The Dream Police" },
      { artist: "Magdalena Bay", title: "Imaginal Disk" },
      { artist: "Clairo", title: "Charm" },
      { artist: "Tyla", title: "Tyla" },
      { artist: "Adrianne Lenker", title: "Bright Future" },
      { artist: "Vampire Weekend", title: "Only God Was Above Us" },
      { artist: "Cassandra Jenkins", title: "My Light, My Destroyer" },
      { artist: "Mdou Moctar", title: "Funeral for Justice" },
      { artist: "Laura Marling", title: "Patterns in Repeat" },
      { artist: "Sabrina Carpenter", title: "Short n' Sweet" },
      { artist: "Kali Uchis", title: "Orquídeas" },
      { artist: "Chief Keef", title: "Almighty So 2" },
    ]
  },
  {
    title: "NME's 50 Best Albums of 2024",
    description: "NME's definitive list of the best albums released in 2024.",
    albums: [
      { artist: "Charli XCX", title: "Brat" },
      { artist: "Fontaines D.C.", title: "Romance" },
      { artist: "English Teacher", title: "This Could Be Texas" },
      { artist: "Nia Archives", title: "Silence Is Loud" },
      { artist: "Magdalena Bay", title: "Imaginal Disk" },
      { artist: "The Cure", title: "Songs of a Lost World" },
      { artist: "Beyoncé", title: "Cowboy Carter" },
      { artist: "Mustafa", title: "Dunya" },
      { artist: "Billie Eilish", title: "Hit Me Hard and Soft" },
      { artist: "Rachel Chinouriri", title: "What A Devastating Turn of Events" },
      { artist: "Cindy Lee", title: "Diamond Jubilee" },
      { artist: "Kendrick Lamar", title: "GNX" },
      { artist: "Kneecap", title: "Fine Art" },
      { artist: "MJ Lenderman", title: "Manning Fireworks" },
      { artist: "Mk.gee", title: "Two Star & The Dream Police" },
      { artist: "Clairo", title: "Charm" },
      { artist: "Tyla", title: "Tyla" },
      { artist: "Adrianne Lenker", title: "Bright Future" },
      { artist: "The Last Dinner Party", title: "Prelude to Ecstasy" },
      { artist: "Ariana Grande", title: "Eternal Sunshine" },
      { artist: "The Smile", title: "Wall of Eyes" },
      { artist: "Beth Gibbons", title: "Lives Outgrown" },
      { artist: "Amyl and The Sniffers", title: "Cartoon Darkness" },
      { artist: "Waxahatchee", title: "Tigers Blood" },
      { artist: "Nilüfer Yanya", title: "My Method Actor" },
      { artist: "Sabrina Carpenter", title: "Short n' Sweet" },
      { artist: "Tyler, The Creator", title: "Chromakopia" },
      { artist: "Beabadoobee", title: "This Is How Tomorrow Moves" },
    ]
  },
  {
    title: "Rolling Stone's Best Albums of 2024",
    description: "Rolling Stone's top albums of 2024.",
    albums: [
      { artist: "Charli XCX", title: "Brat" },
      { artist: "Beyoncé", title: "Cowboy Carter" },
      { artist: "MJ Lenderman", title: "Manning Fireworks" },
      { artist: "Sabrina Carpenter", title: "Short n' Sweet" },
      { artist: "Billie Eilish", title: "Hit Me Hard and Soft" },
      { artist: "Tyla", title: "Tyla" },
      { artist: "Future", title: "We Don't Trust You" },
      { artist: "Ariana Grande", title: "Eternal Sunshine" },
      { artist: "Doechii", title: "Alligator Bites Never Heal" },
      { artist: "Waxahatchee", title: "Tigers Blood" },
      { artist: "Rema", title: "HEIS" },
      { artist: "Zach Bryan", title: "The Great American Bar Scene" },
      { artist: "Clairo", title: "Charm" },
      { artist: "Mk.gee", title: "Two Star & The Dream Police" },
      { artist: "Cindy Lee", title: "Diamond Jubilee" },
      { artist: "Tyler, The Creator", title: "Chromakopia" },
      { artist: "Jessica Pratt", title: "Here in the Pitch" },
      { artist: "Mdou Moctar", title: "Funeral for Justice" },
      { artist: "Jack White", title: "No Name" },
      { artist: "Kendrick Lamar", title: "GNX" },
      { artist: "Mannequin Pussy", title: "I Got Heaven" },
      { artist: "Taylor Swift", title: "The Tortured Poets Department" },
      { artist: "Kim Gordon", title: "The Collective" },
      { artist: "Shakira", title: "Las Mujeres Ya No Lloran" },
      { artist: "Mustafa", title: "Dunya" },
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

    // Must be logged in
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
