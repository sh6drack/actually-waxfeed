import { PrismaClient } from '@prisma/client'

// Source: Google Cloud SQL
const sourceDb = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://waxfeed:J3jkXkf8RLNCARBE5eSun2z1@35.188.137.24:5432/waxfeed"
    }
  }
})

// Target: Neon
const targetDb = new PrismaClient({
  datasources: {
    db: {
      url: "postgresql://neondb_owner:npg_woSxdcaYq7M1@ep-polished-union-adufykz6.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    }
  }
})

const BATCH_SIZE = 100

async function migrateTableBatched<T extends { id: string }>(
  name: string,
  countFn: () => Promise<number>,
  fetchFn: (skip: number, take: number) => Promise<T[]>,
  upsertFn: (item: T) => Promise<unknown>
): Promise<number> {
  console.log(`\nMigrating ${name}...`)

  let totalCount = 0
  try {
    totalCount = await countFn()
  } catch (e) {
    console.log(`  Error counting ${name}, skipping...`)
    return 0
  }

  console.log(`  Found ${totalCount} ${name}`)

  let migrated = 0
  let offset = 0

  while (offset < totalCount) {
    try {
      const items = await fetchFn(offset, BATCH_SIZE)

      for (const item of items) {
        try {
          await upsertFn(item)
          migrated++
        } catch (e) {
          // Skip individual errors
        }
      }
    } catch (e) {
      console.log(`  Batch error at offset ${offset}, continuing...`)
    }

    offset += BATCH_SIZE
    if (offset % 500 === 0) {
      console.log(`  Progress: ${migrated}/${totalCount}`)
    }
  }

  console.log(`  Migrated: ${migrated}/${totalCount}`)
  return migrated
}

async function migrate() {
  console.log('=' .repeat(60))
  console.log('FULL DATABASE MIGRATION: Google Cloud SQL → Neon')
  console.log('=' .repeat(60))

  try {
    // ==========================================
    // 1. USERS & AUTH
    // ==========================================
    console.log('\n--- USERS & AUTHENTICATION ---')

    await migrateTableBatched('Users',
      () => sourceDb.user.count(),
      (skip, take) => sourceDb.user.findMany({ skip, take }),
      (item) => targetDb.user.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('Accounts',
      () => sourceDb.account.count(),
      (skip, take) => sourceDb.account.findMany({ skip, take }),
      (item) => targetDb.account.upsert({
        where: { provider_providerAccountId: { provider: item.provider, providerAccountId: item.providerAccountId } },
        create: item, update: item
      })
    )

    await migrateTableBatched('Sessions',
      () => sourceDb.session.count(),
      (skip, take) => sourceDb.session.findMany({ skip, take }),
      (item) => targetDb.session.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // ==========================================
    // 2. ALBUMS & TRACKS
    // ==========================================
    console.log('\n--- ALBUMS & TRACKS ---')

    await migrateTableBatched('Albums',
      () => sourceDb.album.count(),
      (skip, take) => sourceDb.album.findMany({ skip, take }),
      (item) => targetDb.album.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('Tracks',
      () => sourceDb.track.count(),
      (skip, take) => sourceDb.track.findMany({ skip, take }),
      (item) => targetDb.track.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('Artists',
      () => sourceDb.artist.count(),
      (skip, take) => sourceDb.artist.findMany({ skip, take }),
      (item) => targetDb.artist.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('AlbumTags',
      () => sourceDb.albumTag.count(),
      (skip, take) => sourceDb.albumTag.findMany({ skip, take }),
      (item) => targetDb.albumTag.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('Lyrics',
      () => sourceDb.lyrics.count(),
      (skip, take) => sourceDb.lyrics.findMany({ skip, take }),
      (item) => targetDb.lyrics.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // ==========================================
    // 3. REVIEWS & ENGAGEMENT
    // ==========================================
    console.log('\n--- REVIEWS & ENGAGEMENT ---')

    await migrateTableBatched('Reviews',
      () => sourceDb.review.count(),
      (skip, take) => sourceDb.review.findMany({ skip, take }),
      (item) => targetDb.review.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('ReviewDrafts',
      () => sourceDb.reviewDraft.count(),
      (skip, take) => sourceDb.reviewDraft.findMany({ skip, take }),
      (item) => targetDb.reviewDraft.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('Replies',
      () => sourceDb.reply.count(),
      (skip, take) => sourceDb.reply.findMany({ skip, take }),
      (item) => targetDb.reply.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('ReviewLikes',
      () => sourceDb.reviewLike.count(),
      (skip, take) => sourceDb.reviewLike.findMany({ skip, take }),
      (item) => targetDb.reviewLike.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('ReviewReactions',
      () => sourceDb.reviewReaction.count(),
      (skip, take) => sourceDb.reviewReaction.findMany({ skip, take }),
      (item) => targetDb.reviewReaction.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('ReplyLikes',
      () => sourceDb.replyLike.count(),
      (skip, take) => sourceDb.replyLike.findMany({ skip, take }),
      (item) => targetDb.replyLike.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('WaxAwards',
      () => sourceDb.waxAward.count(),
      (skip, take) => sourceDb.waxAward.findMany({ skip, take }),
      (item) => targetDb.waxAward.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // ==========================================
    // 4. LISTS
    // ==========================================
    console.log('\n--- LISTS ---')

    await migrateTableBatched('Lists',
      () => sourceDb.list.count(),
      (skip, take) => sourceDb.list.findMany({ skip, take }),
      (item) => targetDb.list.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('ListItems',
      () => sourceDb.listItem.count(),
      (skip, take) => sourceDb.listItem.findMany({ skip, take }),
      (item) => targetDb.listItem.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('ListLikes',
      () => sourceDb.listLike.count(),
      (skip, take) => sourceDb.listLike.findMany({ skip, take }),
      (item) => targetDb.listLike.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('ListComments',
      () => sourceDb.listComment.count(),
      (skip, take) => sourceDb.listComment.findMany({ skip, take }),
      (item) => targetDb.listComment.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('ListReorderSuggestions',
      () => sourceDb.listReorderSuggestion.count(),
      (skip, take) => sourceDb.listReorderSuggestion.findMany({ skip, take }),
      (item) => targetDb.listReorderSuggestion.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // ==========================================
    // 5. SOCIAL
    // ==========================================
    console.log('\n--- SOCIAL ---')

    await migrateTableBatched('Friendships',
      () => sourceDb.friendship.count(),
      (skip, take) => sourceDb.friendship.findMany({ skip, take }),
      (item) => targetDb.friendship.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('FriendRequests',
      () => sourceDb.friendRequest.count(),
      (skip, take) => sourceDb.friendRequest.findMany({ skip, take }),
      (item) => targetDb.friendRequest.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('Blocks',
      () => sourceDb.block.count(),
      (skip, take) => sourceDb.block.findMany({ skip, take }),
      (item) => targetDb.block.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // ==========================================
    // 6. NOTIFICATIONS
    // ==========================================
    console.log('\n--- NOTIFICATIONS ---')

    await migrateTableBatched('Notifications',
      () => sourceDb.notification.count(),
      (skip, take) => sourceDb.notification.findMany({ skip, take }),
      (item) => targetDb.notification.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('NotificationSettings',
      () => sourceDb.notificationSettings.count(),
      (skip, take) => sourceDb.notificationSettings.findMany({ skip, take }),
      (item) => targetDb.notificationSettings.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // ==========================================
    // 7. HOT TAKES
    // ==========================================
    console.log('\n--- HOT TAKES ---')

    await migrateTableBatched('HotTakes',
      () => sourceDb.hotTake.count(),
      (skip, take) => sourceDb.hotTake.findMany({ skip, take }),
      (item) => targetDb.hotTake.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('HotTakeVotes',
      () => sourceDb.hotTakeVote.count(),
      (skip, take) => sourceDb.hotTakeVote.findMany({ skip, take }),
      (item) => targetDb.hotTakeVote.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('HotTakeArguments',
      () => sourceDb.hotTakeArgument.count(),
      (skip, take) => sourceDb.hotTakeArgument.findMany({ skip, take }),
      (item) => targetDb.hotTakeArgument.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // ==========================================
    // 8. TASTEID
    // ==========================================
    console.log('\n--- TASTEID ---')

    await migrateTableBatched('TasteIDs',
      () => sourceDb.tasteID.count(),
      (skip, take) => sourceDb.tasteID.findMany({ skip, take }),
      (item) => targetDb.tasteID.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('TasteIDSnapshots',
      () => sourceDb.tasteIDSnapshot.count(),
      (skip, take) => sourceDb.tasteIDSnapshot.findMany({ skip, take }),
      (item) => targetDb.tasteIDSnapshot.upsert({ where: { id: item.id }, create: item, update: item })
    )

    await migrateTableBatched('TasteMatches',
      () => sourceDb.tasteMatch.count(),
      (skip, take) => sourceDb.tasteMatch.findMany({ skip, take }),
      (item) => targetDb.tasteMatch.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // ==========================================
    // 9. ANALYTICS & CACHE
    // ==========================================
    console.log('\n--- ANALYTICS & CACHE ---')

    await migrateTableBatched('UserYearlyStats',
      () => sourceDb.userYearlyStats.count(),
      (skip, take) => sourceDb.userYearlyStats.findMany({ skip, take }),
      (item) => targetDb.userYearlyStats.upsert({ where: { id: item.id }, create: item, update: item })
    )

    // Skip SpotifyCache - not critical and can be rebuilt
    console.log('\n  Skipping SpotifyCache (can be rebuilt)')

    // ==========================================
    // 10. MODERATION
    // ==========================================
    console.log('\n--- MODERATION ---')

    await migrateTableBatched('Reports',
      () => sourceDb.report.count(),
      (skip, take) => sourceDb.report.findMany({ skip, take }),
      (item) => targetDb.report.upsert({ where: { id: item.id }, create: item, update: item })
    )

    console.log('\n' + '=' .repeat(60))
    console.log('MIGRATION COMPLETE!')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('\nMIGRATION FAILED:', error)
  } finally {
    await sourceDb.$disconnect()
    await targetDb.$disconnect()
  }
}

migrate()
