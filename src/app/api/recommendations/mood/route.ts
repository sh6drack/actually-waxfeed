import { NextRequest, NextResponse } from "next/server"
import { getMoodAwareRecommendations } from "@/lib/mood-recommendations"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const userId = searchParams.get("userId")
  const mood = searchParams.get("mood") as "comfort" | "discovery" | "depth" | "reactive" | "emotional"

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "userId required" },
      { status: 400 }
    )
  }

  if (!mood || !["comfort", "discovery", "depth", "reactive", "emotional"].includes(mood)) {
    return NextResponse.json(
      { success: false, error: "valid mood required" },
      { status: 400 }
    )
  }

  try {
    const recommendations = await getMoodAwareRecommendations(userId, mood, 6)

    return NextResponse.json({
      success: true,
      data: recommendations,
    })
  } catch (error) {
    console.error("Error fetching mood recommendations:", error)
    return NextResponse.json(
      { success: false, error: "Failed to get recommendations" },
      { status: 500 }
    )
  }
}
