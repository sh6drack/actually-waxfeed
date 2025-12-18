import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

const CRON_SECRET = process.env.CRON_SECRET

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (CRON_SECRET && authHeader !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    // Simple query to keep the database connection alive
    const count = await prisma.user.count()

    return NextResponse.json({
      success: true,
      message: "Database connection alive",
      userCount: count,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Keep-alive failed:", error)
    return NextResponse.json(
      { error: "Keep-alive failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    )
  }
}
