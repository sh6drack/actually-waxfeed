import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

// Curated lists data - iconic albums from music publications
const CURATED_LISTS = [
  {
    title: "Rolling Stone's Greatest Albums",
    description: "The definitive list of the greatest albums of all time, as voted by artists, producers, and critics. Updated 2023.",
    albums: [
      { artist: "Marvin Gaye", title: "What's Going On" },
      { artist: "The Beach Boys", title: "Pet Sounds" },
      { artist: "Joni Mitchell", title: "Blue" },
      { artist: "Stevie Wonder", title: "Songs in the Key of Life" },
      { artist: "The Beatles", title: "Abbey Road" },
      { artist: "Nirvana", title: "Nevermind" },
      { artist: "Fleetwood Mac", title: "Rumours" },
      { artist: "Prince", title: "Purple Rain" },
      { artist: "Bob Dylan", title: "Blood on the Tracks" },
      { artist: "Lauryn Hill", title: "The Miseducation of Lauryn Hill" },
      { artist: "The Beatles", title: "Revolver" },
      { artist: "Michael Jackson", title: "Thriller" },
      { artist: "Aretha Franklin", title: "I Never Loved a Man the Way I Love You" },
      { artist: "The Rolling Stones", title: "Exile on Main St." },
      { artist: "The Clash", title: "London Calling" },
      { artist: "Bob Dylan", title: "Highway 61 Revisited" },
      { artist: "Kendrick Lamar", title: "To Pimp a Butterfly" },
      { artist: "Pink Floyd", title: "The Dark Side of the Moon" },
      { artist: "Radiohead", title: "OK Computer" },
      { artist: "Amy Winehouse", title: "Back to Black" },
    ]
  },
  {
    title: "Essential Hip-Hop Albums",
    description: "The albums that defined and shaped hip-hop culture. From golden age classics to modern masterpieces.",
    albums: [
      { artist: "Kendrick Lamar", title: "good kid, m.A.A.d city" },
      { artist: "Nas", title: "Illmatic" },
      { artist: "The Notorious B.I.G.", title: "Ready to Die" },
      { artist: "Kanye West", title: "My Beautiful Dark Twisted Fantasy" },
      { artist: "OutKast", title: "Stankonia" },
      { artist: "A Tribe Called Quest", title: "The Low End Theory" },
      { artist: "Jay-Z", title: "The Blueprint" },
      { artist: "Dr. Dre", title: "The Chronic" },
      { artist: "Wu-Tang Clan", title: "Enter the Wu-Tang (36 Chambers)" },
      { artist: "Lauryn Hill", title: "The Miseducation of Lauryn Hill" },
      { artist: "Kendrick Lamar", title: "To Pimp a Butterfly" },
      { artist: "Tyler, The Creator", title: "IGOR" },
      { artist: "Frank Ocean", title: "Blonde" },
      { artist: "Travis Scott", title: "Astroworld" },
      { artist: "Kanye West", title: "The College Dropout" },
    ]
  },
  {
    title: "Pitchfork's Best of 2024",
    description: "The albums that defined 2024, as selected by Pitchfork's critics.",
    albums: [
      { artist: "Charli XCX", title: "Brat" },
      { artist: "MJ Lenderman", title: "Manning Fireworks" },
      { artist: "Waxahatchee", title: "Tigers Blood" },
      { artist: "Kim Gordon", title: "The Collective" },
      { artist: "Mannequin Pussy", title: "I Got Heaven" },
      { artist: "Beyonce", title: "Cowboy Carter" },
      { artist: "Tyler, The Creator", title: "Chromakopia" },
      { artist: "Sabrina Carpenter", title: "Short n' Sweet" },
      { artist: "Ariana Grande", title: "Eternal Sunshine" },
      { artist: "The Smile", title: "Wall of Eyes" },
    ]
  },
  {
    title: "Essential R&B",
    description: "Soulful albums that showcase the best of rhythm and blues, from classic Motown to contemporary R&B.",
    albums: [
      { artist: "Frank Ocean", title: "Blonde" },
      { artist: "D'Angelo", title: "Voodoo" },
      { artist: "Erykah Badu", title: "Baduizm" },
      { artist: "Stevie Wonder", title: "Innervisions" },
      { artist: "Marvin Gaye", title: "What's Going On" },
      { artist: "Prince", title: "Sign o' the Times" },
      { artist: "Whitney Houston", title: "Whitney Houston" },
      { artist: "SZA", title: "Ctrl" },
      { artist: "The Weeknd", title: "After Hours" },
      { artist: "Beyonce", title: "Lemonade" },
      { artist: "Solange", title: "A Seat at the Table" },
      { artist: "Usher", title: "Confessions" },
    ]
  },
  {
    title: "Rock Essentials",
    description: "The albums that define rock music across its many eras and subgenres.",
    albums: [
      { artist: "Led Zeppelin", title: "Led Zeppelin IV" },
      { artist: "Pink Floyd", title: "The Dark Side of the Moon" },
      { artist: "The Beatles", title: "Sgt. Pepper's Lonely Hearts Club Band" },
      { artist: "Nirvana", title: "Nevermind" },
      { artist: "Radiohead", title: "OK Computer" },
      { artist: "The Who", title: "Who's Next" },
      { artist: "AC/DC", title: "Back in Black" },
      { artist: "Queen", title: "A Night at the Opera" },
      { artist: "Guns N' Roses", title: "Appetite for Destruction" },
      { artist: "The Velvet Underground", title: "The Velvet Underground & Nico" },
      { artist: "David Bowie", title: "The Rise and Fall of Ziggy Stardust" },
      { artist: "U2", title: "The Joshua Tree" },
    ]
  },
  {
    title: "Album of the Year Contenders",
    description: "Recent acclaimed albums that dominated year-end lists and award conversations.",
    albums: [
      { artist: "Taylor Swift", title: "The Tortured Poets Department" },
      { artist: "Charli XCX", title: "Brat" },
      { artist: "Beyonce", title: "Cowboy Carter" },
      { artist: "Tyler, The Creator", title: "Chromakopia" },
      { artist: "Sabrina Carpenter", title: "Short n' Sweet" },
      { artist: "Billie Eilish", title: "Hit Me Hard and Soft" },
      { artist: "Kendrick Lamar", title: "GNX" },
      { artist: "Chappell Roan", title: "The Rise and Fall of a Midwest Princess" },
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
