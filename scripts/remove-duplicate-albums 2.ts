import { prisma } from '../src/lib/prisma'

async function removeDuplicateAlbums() {
  console.log('Finding duplicate albums...\n')

  // Get all albums with their review counts
  const albums = await prisma.album.findMany({
    select: {
      id: true,
      title: true,
      artistName: true,
      totalReviews: true,
      createdAt: true,
    },
  })

  // Group by title+artist (case-insensitive)
  const groups = new Map<string, typeof albums>()
  for (const album of albums) {
    const key = `${album.title.toLowerCase()}|${album.artistName.toLowerCase()}`
    if (!groups.has(key)) {
      groups.set(key, [])
    }
    groups.get(key)!.push(album)
  }

  // Find duplicates (groups with more than 1 album)
  const duplicateGroups = Array.from(groups.entries()).filter(
    ([, albums]) => albums.length > 1
  )

  if (duplicateGroups.length === 0) {
    console.log('No duplicate albums found!')
    return
  }

  console.log(`Found ${duplicateGroups.length} groups of duplicate albums\n`)

  let totalDeleted = 0
  const toDelete: string[] = []

  for (const [key, dupes] of duplicateGroups) {
    // Sort by totalReviews (desc), then by createdAt (asc) to keep oldest if tie
    dupes.sort((a, b) => {
      if (b.totalReviews !== a.totalReviews) {
        return b.totalReviews - a.totalReviews
      }
      return a.createdAt.getTime() - b.createdAt.getTime()
    })

    // Keep the first one (most reviews or oldest), delete the rest without reviews
    const [keep, ...rest] = dupes
    const deletable = rest.filter((a) => a.totalReviews === 0)

    if (deletable.length > 0) {
      console.log(`"${keep.title}" by ${keep.artistName}`)
      console.log(`  Keeping: ${keep.id} (${keep.totalReviews} reviews)`)
      for (const d of deletable) {
        console.log(`  Deleting: ${d.id} (${d.totalReviews} reviews)`)
        toDelete.push(d.id)
      }
      console.log()
    }
  }

  if (toDelete.length === 0) {
    console.log('No duplicate albums without reviews to delete.')
    return
  }

  console.log(`\nDeleting ${toDelete.length} duplicate albums without reviews...`)

  // Delete in batches
  const batchSize = 100
  for (let i = 0; i < toDelete.length; i += batchSize) {
    const batch = toDelete.slice(i, i + batchSize)
    await prisma.album.deleteMany({
      where: { id: { in: batch } },
    })
    console.log(`Deleted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(toDelete.length / batchSize)}`)
  }

  console.log(`\nDone! Deleted ${toDelete.length} duplicate albums.`)
}

removeDuplicateAlbums()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
