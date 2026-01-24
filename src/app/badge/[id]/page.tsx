import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { Metadata } from "next"
import { DefaultAvatar } from "@/components/default-avatar"
import { CopyButton } from "./copy-button"

interface Props {
  params: Promise<{ id: string }>
}

const BADGE_COLORS = {
  GOLD: { bg: "bg-[#ffd700]/20", border: "border-[#ffd700]", text: "text-[#ffd700]" },
  SILVER: { bg: "bg-[#c0c0c0]/20", border: "border-[#c0c0c0]", text: "text-[#c0c0c0]" },
  BRONZE: { bg: "bg-[#cd7f32]/20", border: "border-[#cd7f32]", text: "text-[#cd7f32]" },
}

const BADGE_TITLES = {
  GOLD: "Gold Spin",
  SILVER: "Silver Spin", 
  BRONZE: "Bronze Spin",
}

async function getBadge(id: string) {
  return prisma.firstSpinBadge.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
        }
      },
      album: {
        select: {
          id: true,
          spotifyId: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          coverArtUrlLarge: true,
          totalReviews: true,
        }
      }
    }
  })
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params
  const badge = await getBadge(id)

  if (!badge) {
    return { title: "Badge Not Found | WaxFeed" }
  }

  const title = `${badge.user.username} was #${badge.position} on "${badge.album.title}" | WaxFeed`
  const description = `${badge.user.username} earned a ${BADGE_TITLES[badge.badgeType]} badge for being one of the first to rate ${badge.album.title} by ${badge.album.artistName}. They believed first.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [`/api/og/badge/${id}`],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [`/api/og/badge/${id}`],
    },
  }
}

export default async function BadgePage({ params }: Props) {
  const { id } = await params
  const badge = await getBadge(id)

  if (!badge) {
    notFound()
  }

  const colors = BADGE_COLORS[badge.badgeType]
  const title = BADGE_TITLES[badge.badgeType]
  const coverUrl = badge.album.coverArtUrlLarge || badge.album.coverArtUrl

  // Generate share URLs
  const badgeUrl = `https://wax-feed.com/badge/${id}`
  const shareText = `I was #${badge.position} to rate "${badge.album.title}" by ${badge.album.artistName} 🎵 I believed first.`
  
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(badgeUrl)}`
  const threadsUrl = `https://threads.net/intent/post?text=${encodeURIComponent(shareText + " " + badgeUrl)}`

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Badge Card */}
        <div className={`border-2 ${colors.border} p-6 md:p-8 ${colors.bg}`}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-3xl">
                {badge.badgeType === 'GOLD' ? '🥇' : badge.badgeType === 'SILVER' ? '🥈' : '🥉'}
              </span>
              <div>
                <p className={`text-sm uppercase tracking-widest font-bold ${colors.text}`}>
                  {title}
                </p>
                <p className="text-xs text-[--muted]">First Spin Badge</p>
              </div>
            </div>
            <div className={`px-4 py-2 border ${colors.border} ${colors.bg}`}>
              <span className={`text-2xl font-bold ${colors.text}`}>#{badge.position}</span>
            </div>
          </div>

          {/* Album */}
          <div className="flex gap-4 mb-6">
            <div className="w-32 h-32 flex-shrink-0 bg-[--border]">
              {coverUrl && (
                <img src={coverUrl} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link 
                href={`/album/${badge.album.spotifyId}`}
                className="hover:underline"
              >
                <h1 className="text-xl md:text-2xl font-bold mb-1 line-clamp-2">
                  {badge.album.title}
                </h1>
              </Link>
              <p className="text-[--muted] mb-2">{badge.album.artistName}</p>
              <p className="text-sm text-[--muted]">
                {badge.album.totalReviews.toLocaleString()} total reviews
              </p>
            </div>
          </div>

          {/* User */}
          <div className="flex items-center gap-3 py-4 border-t border-[--border]">
            <Link href={`/u/${badge.user.username}`} className="flex items-center gap-3 group">
              {badge.user.image ? (
                <img src={badge.user.image} alt="" className="w-10 h-10 rounded-full" />
              ) : (
                <DefaultAvatar size="md" />
              )}
              <div>
                <p className="font-bold group-hover:underline">@{badge.user.username}</p>
                <p className="text-xs text-[--muted]">Believed first</p>
              </div>
            </Link>
          </div>

          {/* Share Buttons */}
          <div className="pt-4 border-t border-[--border]">
            <p className="text-xs text-[--muted] uppercase tracking-wider mb-3">Share this badge</p>
            <div className="flex gap-2">
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white border border-white/20 hover:bg-white/10 transition-colors text-sm font-bold"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                X / Twitter
              </a>
              <a
                href={threadsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-black text-white border border-white/20 hover:bg-white/10 transition-colors text-sm font-bold"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.5 12.068V12c.012-6.627 4.668-11.478 10.792-11.493h.028c3.186.008 6.063 1.252 8.102 3.499 1.945 2.146 3.005 5.065 3.078 8.067l-2.186.053c-.062-2.535-.936-4.93-2.533-6.691-1.673-1.847-3.975-2.858-6.48-2.865-4.931.013-8.578 3.985-8.588 9.362v.062c0 2.96.693 5.335 2.064 7.067 1.493 1.884 3.76 2.893 6.732 2.933h.007c2.487 0 4.613-.887 6.173-2.581.79-.858 1.368-1.94 1.769-3.315l2.127.523c-.51 1.742-1.269 3.141-2.313 4.274-2.024 2.195-4.82 3.327-8.105 3.327z"/>
                  <path d="M8.563 10.065h2.123v7.84H8.563z"/>
                </svg>
                Threads
              </a>
              <CopyButton url={badgeUrl} />
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-[--muted] mb-4">
            Think you can spot the next hit before everyone else?
          </p>
          <Link
            href="/discover"
            className="inline-block px-6 py-3 bg-white text-black font-bold text-sm uppercase tracking-wider hover:bg-[#e5e5e5] transition-colors"
          >
            Start Rating Albums
          </Link>
        </div>
      </div>
    </div>
  )
}
