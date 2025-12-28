import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteSingles() {
  console.log('🔍 Finding all singles in database...')

  const singles = await prisma.album.findMany({
    where: {
      albumType: 'single'
    },
    select: {
      id: true,
      title: true,
      artistName: true,
      spotifyId: true,
    }
  })

  console.log(`Found ${singles.length} singles to delete:`)
  singles.forEach(single => {
    console.log(`  - ${single.artistName} - ${single.title}`)
  })

  if (singles.length === 0) {
    console.log('✅ No singles found. Database is clean!')
    return
  }

  console.log('\n🗑️  Deleting singles...')

  const result = await prisma.album.deleteMany({
    where: {
      albumType: 'single'
    }
  })

  console.log(`✅ Deleted ${result.count} singles from database`)
  console.log('✅ Database is now SINGLES-FREE!')
}

deleteSingles()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
