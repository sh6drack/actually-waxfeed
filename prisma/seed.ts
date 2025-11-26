import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create Waxfeed Team account
  const teamUser = await prisma.user.upsert({
    where: { email: 'team@waxfeed.com' },
    update: {},
    create: {
      email: 'team@waxfeed.com',
      username: 'waxfeed',
      name: 'Waxfeed Team',
      bio: 'Official Waxfeed curated lists',
      isVerified: true,
      verifiedAt: new Date(),
    }
  })
  console.log('Created team user:', teamUser.username)

  // Create notification settings for team
  await prisma.notificationSettings.upsert({
    where: { userId: teamUser.id },
    update: {},
    create: { userId: teamUser.id }
  })

  // Get albums by genre search (albums and EPs only, no singles)
  const afroHouseAlbums = await prisma.album.findMany({
    where: {
      albumType: { in: ['album', 'ep'] }, // Albums and EPs only
      OR: [
        { artistName: { contains: 'Black Coffee', mode: 'insensitive' } },
        { title: { contains: 'Subconsciously', mode: 'insensitive' } },
        { genres: { hasSome: ['afro house', 'amapiano'] } },
      ]
    },
    take: 15,
    orderBy: { totalReviews: 'desc' }
  })

  const electronicAlbums = await prisma.album.findMany({
    where: {
      albumType: { in: ['album', 'ep'] }, // Albums and EPs only
      OR: [
        { artistName: { contains: 'Disclosure', mode: 'insensitive' } },
        { artistName: { contains: 'Kaytranada', mode: 'insensitive' } },
        { artistName: { contains: 'Four Tet', mode: 'insensitive' } },
        { artistName: { contains: 'Keinemusik', mode: 'insensitive' } },
      ]
    },
    take: 15,
    orderBy: { totalReviews: 'desc' }
  })

  const rapAlbums = await prisma.album.findMany({
    where: {
      albumType: { in: ['album', 'ep'] }, // Albums and EPs only
      OR: [
        { artistName: { contains: 'Drake', mode: 'insensitive' } },
        { genres: { hasSome: ['rap', 'hip hop', 'hip-hop'] } },
      ]
    },
    take: 15,
    orderBy: { totalReviews: 'desc' }
  })

  // Create curated lists
  if (afroHouseAlbums.length > 0) {
    const afroList = await prisma.list.upsert({
      where: { id: 'curated-afro-house' },
      update: { publishedAt: new Date() },
      create: {
        id: 'curated-afro-house',
        title: 'Afro House Essentials',
        description: 'The best of Afro house and Amapiano - from Black Coffee to the underground',
        isPublic: true,
        isRanked: false,
        userId: teamUser.id,
        publishedAt: new Date(),
      }
    })

    // Add albums to list
    for (let i = 0; i < afroHouseAlbums.length; i++) {
      await prisma.listItem.upsert({
        where: {
          listId_albumId: {
            listId: afroList.id,
            albumId: afroHouseAlbums[i].id
          }
        },
        update: {},
        create: {
          listId: afroList.id,
          albumId: afroHouseAlbums[i].id,
          position: i + 1,
        }
      })
    }
    console.log(`Created list: ${afroList.title} with ${afroHouseAlbums.length} albums`)
  }

  if (electronicAlbums.length > 0) {
    const electronicList = await prisma.list.upsert({
      where: { id: 'curated-electronic' },
      update: { publishedAt: new Date() },
      create: {
        id: 'curated-electronic',
        title: 'Electronic for the Soul',
        description: 'House, UK garage, and electronic music that moves you',
        isPublic: true,
        isRanked: false,
        userId: teamUser.id,
        publishedAt: new Date(),
      }
    })

    for (let i = 0; i < electronicAlbums.length; i++) {
      await prisma.listItem.upsert({
        where: {
          listId_albumId: {
            listId: electronicList.id,
            albumId: electronicAlbums[i].id
          }
        },
        update: {},
        create: {
          listId: electronicList.id,
          albumId: electronicAlbums[i].id,
          position: i + 1,
        }
      })
    }
    console.log(`Created list: ${electronicList.title} with ${electronicAlbums.length} albums`)
  }

  if (rapAlbums.length > 0) {
    const rapList = await prisma.list.upsert({
      where: { id: 'curated-rap' },
      update: { publishedAt: new Date() },
      create: {
        id: 'curated-rap',
        title: 'Essential Hip Hop',
        description: null,
        isPublic: true,
        isRanked: true,
        userId: teamUser.id,
        publishedAt: new Date(),
      }
    })

    for (let i = 0; i < rapAlbums.length; i++) {
      await prisma.listItem.upsert({
        where: {
          listId_albumId: {
            listId: rapList.id,
            albumId: rapAlbums[i].id
          }
        },
        update: {},
        create: {
          listId: rapList.id,
          albumId: rapAlbums[i].id,
          position: i + 1,
        }
      })
    }
    console.log(`Created list: ${rapList.title} with ${rapAlbums.length} albums`)
  }

  // Create a "Staff Picks" list with diverse albums (albums and EPs only)
  const allAlbums = await prisma.album.findMany({
    where: {
      albumType: { in: ['album', 'ep'] }
    },
    take: 10,
    orderBy: { createdAt: 'desc' }
  })

  if (allAlbums.length > 0) {
    const staffPicks = await prisma.list.upsert({
      where: { id: 'curated-staff-picks' },
      update: { publishedAt: new Date() },
      create: {
        id: 'curated-staff-picks',
        title: 'Staff Picks',
        description: null,
        isPublic: true,
        isRanked: false,
        userId: teamUser.id,
        publishedAt: new Date(),
      }
    })

    for (let i = 0; i < allAlbums.length; i++) {
      await prisma.listItem.upsert({
        where: {
          listId_albumId: {
            listId: staffPicks.id,
            albumId: allAlbums[i].id
          }
        },
        update: {},
        create: {
          listId: staffPicks.id,
          albumId: allAlbums[i].id,
          position: i + 1,
        }
      })
    }
    console.log(`Created list: ${staffPicks.title} with ${allAlbums.length} albums`)
  }

  console.log('Seeding complete!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
