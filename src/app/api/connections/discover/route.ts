/**
 * API: /api/connections/discover
 * Discover taste connections powered by Polarity 1.2
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import {
  discoverTasteConnections,
  findOppositeAttracts,
  findTasteTwins,
  findExplorerGuides,
  type ConnectionMatchType
} from "@/lib/tasteid"

export async function GET(request: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const mode = searchParams.get("mode") || "all"  // all, twins, opposites, guides
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50)
    const matchTypesParam = searchParams.get("matchTypes")

    // Check if user has a TasteID
    const tasteId = await prisma.tasteID.findUnique({
      where: { userId: session.user.id },
    })

    if (!tasteId) {
      return NextResponse.json({
        error: "TasteID required",
        message: "You need at least 20 reviews to discover connections",
        reviewCount: 0,
        required: 20,
      }, { status: 400 })
    }

    if (tasteId.reviewCount < 20) {
      return NextResponse.json({
        error: "More reviews needed",
        message: `Review ${20 - tasteId.reviewCount} more albums to unlock taste connections`,
        reviewCount: tasteId.reviewCount,
        required: 20,
      }, { status: 400 })
    }

    let connections

    switch (mode) {
      case "twins":
        connections = await findTasteTwins(session.user.id, limit)
        break
      case "opposites":
        connections = await findOppositeAttracts(session.user.id, limit)
        break
      case "guides":
        connections = await findExplorerGuides(session.user.id, limit)
        break
      default:
        // Parse match types filter if provided
        const matchTypes = matchTypesParam
          ? matchTypesParam.split(",") as ConnectionMatchType[]
          : undefined
        connections = await discoverTasteConnections(session.user.id, {
          limit,
          matchTypes,
        })
    }

    // Group connections by match type for UI
    const grouped = {
      tasteTwins: connections.filter(c => c.matchType === "taste_twin"),
      networkResonance: connections.filter(c => c.matchType === "network_resonance"),
      oppositeAttracts: connections.filter(c => c.matchType === "opposite_attracts"),
      explorerGuides: connections.filter(c => c.matchType === "explorer_guide"),
      genreBuddies: connections.filter(c => c.matchType === "genre_buddy"),
      complementary: connections.filter(c => c.matchType === "complementary"),
    }

    return NextResponse.json({
      connections,
      grouped,
      total: connections.length,
      userTasteId: {
        archetype: tasteId.primaryArchetype,
        reviewCount: tasteId.reviewCount,
        polarityScore: tasteId.polarityScore2 || tasteId.polarityScore,
      },
    })
  } catch (error) {
    console.error("Error discovering connections:", error)
    return NextResponse.json(
      { error: "Failed to discover connections" },
      { status: 500 }
    )
  }
}
