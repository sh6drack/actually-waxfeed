import { prisma } from "@/lib/prisma"
import { ListsOverview } from "@/components/lists-overview"

export const dynamic = "force-dynamic"

async function getPopularLists() {
  return prisma.list.findMany({
    take: 20,
    where: { isPublic: true, publishedAt: { not: null } },
    orderBy: { likeCount: "desc" },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          image: true,
          isVerified: true,
        },
      },
      items: {
        take: 5,
        orderBy: { position: "asc" },
        include: {
          album: {
            select: {
              coverArtUrl: true,
              coverArtUrlMedium: true,
            },
          },
        },
      },
      _count: {
        select: { items: true, comments: true, likes: true },
      },
    },
  })
}

export default async function ListsPage() {
  const popularLists = await getPopularLists()

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold tracking-tighter mb-12">Lists</h1>
      <ListsOverview popularLists={popularLists} />
    </div>
  )
}
