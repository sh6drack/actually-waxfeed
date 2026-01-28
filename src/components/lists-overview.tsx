"use client"

import { useState } from "react"
import Link from "next/link"
import { ViewToggle } from "@/components/view-toggle"
import { VerifiedIcon, HeartIcon } from "@/components/icons"

interface ListData {
  id: string
  title: string
  user: {
    id: string
    username: string | null
    image: string | null
    isVerified: boolean
  }
  items: {
    album: {
      coverArtUrl: string | null
      coverArtUrlMedium: string | null
    }
  }[]
  _count: {
    items: number
    comments: number
    likes: number
  }
}

interface ListsSectionProps {
  title: string
  lists: ListData[]
  emptyMessage: string
}

function ListCard({ list }: { list: ListData }) {
  return (
    <Link
      href={`/list/${list.id}`}
      className="block border border-[--border] p-4 hover:border-[--foreground]/30 transition-colors no-underline"
    >
      <div className="flex gap-1 mb-4">
        {list.items.slice(0, 5).map((item, i) => (
          <div key={i} className="w-12 h-12 bg-[--surface]">
            {item.album.coverArtUrlMedium || item.album.coverArtUrl ? (
              <img
                src={item.album.coverArtUrlMedium || item.album.coverArtUrl || ""}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        ))}
        {list._count.items > 5 && (
          <div className="w-12 h-12 bg-[--surface] flex items-center justify-center text-xs text-[--muted]">
            +{list._count.items - 5}
          </div>
        )}
      </div>
      <h3 className="font-bold truncate mb-1">{list.title}</h3>
      <div className="flex items-center gap-2 text-xs text-[--muted]">
        <span>@{list.user.username}</span>
        {list.user.isVerified && <VerifiedIcon size={12} className="text-blue-400" />}
        <span>•</span>
        <span>{list._count.items} albums</span>
        <span>•</span>
        <span className="flex items-center gap-1"><HeartIcon size={12} /> {list._count.likes}</span>
      </div>
    </Link>
  )
}

function ListRow({ list }: { list: ListData }) {
  return (
    <Link
      href={`/list/${list.id}`}
      className="flex items-center gap-4 border border-[--border] p-4 hover:border-[--foreground]/30 transition-colors no-underline"
    >
      <div className="flex gap-0.5 shrink-0">
        {list.items.slice(0, 4).map((item, i) => (
          <div key={i} className="w-10 h-10 bg-[--surface]">
            {item.album.coverArtUrlMedium || item.album.coverArtUrl ? (
              <img
                src={item.album.coverArtUrlMedium || item.album.coverArtUrl || ""}
                alt=""
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold truncate">{list.title}</h3>
        <div className="flex items-center gap-2 text-xs text-[--muted]">
          <span>@{list.user.username}</span>
          {list.user.isVerified && <VerifiedIcon size={12} className="text-blue-400" />}
        </div>
      </div>
      <div className="text-right text-xs text-[--muted]">
        <div>{list._count.items} albums</div>
        <div className="flex items-center justify-end gap-1"><HeartIcon size={12} /> {list._count.likes}</div>
      </div>
    </Link>
  )
}

function ListsSection({ title, lists, emptyMessage }: ListsSectionProps) {
  const [view, setView] = useState<"list" | "grid">("grid")

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">{title}</h2>
        <ViewToggle view={view} onChange={setView} />
      </div>
      {lists.length === 0 ? (
        <p className="text-[--muted]">{emptyMessage}</p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lists.map((list) => (
            <ListCard key={list.id} list={list} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map((list) => (
            <ListRow key={list.id} list={list} />
          ))}
        </div>
      )}
    </section>
  )
}

interface ListsOverviewProps {
  popularLists: ListData[]
}

export function ListsOverview({ popularLists }: ListsOverviewProps) {
  return (
    <ListsSection
      title="Popular Lists"
      lists={popularLists}
      emptyMessage="No lists yet. Create the first one!"
    />
  )
}
