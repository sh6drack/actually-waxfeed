import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ListContent } from "@/components/list-content"

export const dynamic = "force-dynamic"

async function getList(id: string) {
  return prisma.list.findUnique({
    where: { id },
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
        orderBy: { position: "asc" },
        include: {
          album: {
            select: {
              id: true,
              spotifyId: true,
              title: true,
              artistName: true,
              coverArtUrl: true,
              coverArtUrlMedium: true,
              averageRating: true,
              totalReviews: true,
            },
          },
        },
      },
      _count: {
        select: { likes: true, comments: true },
      },
    },
  })
}

export default async function ListPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const list = await getList(id)

  if (!list) {
    notFound()
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold tracking-tighter mb-2">{list.title}</h1>
        {list.description && (
          <p className="text-[#888] text-lg mb-4">{list.description}</p>
        )}
        <div className="flex items-center gap-4 text-sm text-[#888]">
          <Link href={`/u/${list.user.username}`} className="hover:text-white">
            @{list.user.username}
            {list.user.isVerified && <span className="ml-1">✓</span>}
          </Link>
          <span>•</span>
          <span>{list.items.length} albums</span>
          <span>•</span>
          <span>♡ {list._count.likes} likes</span>
          {list.isRanked && (
            <>
              <span>•</span>
              <span className="text-yellow-500">Ranked</span>
            </>
          )}
        </div>
      </div>

      {/* List Content with View Toggle */}
      <ListContent items={list.items} isRanked={list.isRanked} />
    </div>
  )
}
