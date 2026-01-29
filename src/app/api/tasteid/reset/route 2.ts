import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

/**
 * POST /api/tasteid/reset
 *
 * Resets a user's TasteID by deleting:
 * - All their reviews
 * - Their TasteID record (cascades to snapshots and matches)
 * - Review drafts
 *
 * This is a destructive, irreversible action.
 */
export async function POST(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Parse body for confirmation
    const body = await request.json().catch(() => ({}))

    if (body.confirm !== "DELETE_ALL_MY_REVIEWS") {
      return NextResponse.json(
        { error: "Confirmation required. Send { confirm: 'DELETE_ALL_MY_REVIEWS' }" },
        { status: 400 }
      )
    }

    // Check if user has TasteID
    const tasteId = await prisma.tasteID.findUnique({
      where: { userId }
    })

    // Delete everything in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Delete all reviews (this cascades to likes, reactions, replies)
      const deletedReviews = await tx.review.deleteMany({
        where: { userId }
      })

      // 2. Delete review drafts
      const deletedDrafts = await tx.reviewDraft.deleteMany({
        where: { userId }
      })

      // 3. Delete TasteID (cascades to TasteIDSnapshot and TasteMatch)
      let deletedTasteId = null
      if (tasteId) {
        deletedTasteId = await tx.tasteID.delete({
          where: { userId }
        })
      }

      return {
        reviewsDeleted: deletedReviews.count,
        draftsDeleted: deletedDrafts.count,
        tasteIdDeleted: !!deletedTasteId
      }
    })

    return NextResponse.json({
      success: true,
      message: "TasteID reset complete. All reviews have been deleted.",
      deleted: {
        reviews: result.reviewsDeleted,
        drafts: result.draftsDeleted,
        tasteId: result.tasteIdDeleted
      }
    })

  } catch (error) {
    console.error("[TasteID Reset] Error:", error)
    return NextResponse.json(
      { error: "Failed to reset TasteID" },
      { status: 500 }
    )
  }
}
