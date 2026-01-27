import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { format } from 'date-fns'
import { Metadata } from 'next'
import { BadgeShareButtons } from './badge-share-buttons'

interface BadgePageProps {
  params: Promise<{ id: string }>
}

async function getBadge(id: string) {
  const badge = await prisma.firstSpinBadge.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          name: true,
          image: true,
          tastemakeScore: true,
        },
      },
      album: {
        select: {
          id: true,
          title: true,
          artistName: true,
          coverArtUrl: true,
          coverArtUrlLarge: true,
          releaseDate: true,
          _count: {
            select: { reviews: true },
          },
        },
      },
    },
  })

  return badge
}

export async function generateMetadata({ params }: BadgePageProps): Promise<Metadata> {
  const { id } = await params
  const badge = await getBadge(id)

  if (!badge) {
    return { title: 'Badge Not Found | WAXFEED' }
  }

  const badgeLabel = badge.badgeType === 'GOLD' ? 'Gold Spin' : badge.badgeType === 'SILVER' ? 'Silver Spin' : 'Bronze Spin'
  const title = `${badgeLabel} Badge #${badge.position} | ${badge.album.title}`

  return {
    title: `${title} | WAXFEED`,
    description: `@${badge.user.username} earned a ${badgeLabel} badge for being reviewer #${badge.position} of "${badge.album.title}" by ${badge.album.artistName}`,
    openGraph: {
      title,
      description: `Reviewer #${badge.position} of ${badge.album.title}`,
      images: badge.album.coverArtUrlLarge ? [badge.album.coverArtUrlLarge] : undefined,
    },
  }
}

export default async function BadgePage({ params }: BadgePageProps) {
  const { id } = await params
  const badge = await getBadge(id)

  if (!badge) {
    notFound()
  }

  const badgeColors = {
    GOLD: { bg: '#ffd700', text: '#000', border: '#ffd700', glow: 'rgba(255, 215, 0, 0.3)' },
    SILVER: { bg: '#e5e5e5', text: '#000', border: '#c0c0c0', glow: 'rgba(192, 192, 192, 0.3)' },
    BRONZE: { bg: '#cd7f32', text: '#fff', border: '#cd7f32', glow: 'rgba(205, 127, 50, 0.3)' },
  }

  const badgeLabels = {
    GOLD: 'Gold Spin',
    SILVER: 'Silver Spin',
    BRONZE: 'Bronze Spin',
  }

  const badgeDescriptions = {
    GOLD: 'Among the first 10 reviewers',
    SILVER: 'Among the first 50 reviewers',
    BRONZE: 'Among the first 100 reviewers',
  }

  const color = badgeColors[badge.badgeType]
  const label = badgeLabels[badge.badgeType]
  const description = badgeDescriptions[badge.badgeType]

  return (
    <div className="min-h-screen bg-[--background] text-[--foreground]">
      {/* Header */}
      <div className="border-b border-[--border]">
        <div className="w-full px-6 lg:px-12 xl:px-20 py-4">
          <Link
            href="/wallet"
            className="inline-flex items-center gap-2 text-sm text-[--muted] hover:text-[#ffd700] transition-colors group"
          >
            <svg className="w-4 h-4 transform group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="tracking-wide uppercase text-[10px] font-medium">Back to Wallet</span>
          </Link>
        </div>
      </div>

      {/* Badge Display */}
      <div className="w-full px-6 lg:px-12 xl:px-20 py-16">
        <div className="text-center mb-12 animate-fade-in">
          {/* Badge Icon */}
          <div
            className="w-32 h-32 mx-auto mb-8 flex items-center justify-center relative"
            style={{
              backgroundColor: color.bg,
              boxShadow: `0 0 60px ${color.glow}, 0 0 100px ${color.glow}`,
            }}
          >
            <span className="text-6xl font-black tabular-nums" style={{ color: color.text }}>
              #{badge.position}
            </span>
          </div>

          {/* Badge Label */}
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-3" style={{ color: color.bg }}>
            {label}
          </h1>
          <p className="text-[--muted] text-lg mb-4">{description}</p>
          <p className="text-sm text-[--muted]">
            Earned {format(new Date(badge.createdAt), 'MMMM d, yyyy')}
          </p>
        </div>

        {/* Album Card */}
        <div className="border border-[--border] p-6 mb-8 animate-fade-in" style={{ animationDelay: '100ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5" style={{ backgroundColor: color.bg }} />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">Album</span>
          </div>
          <Link href={`/album/${badge.album.id}`} className="flex items-start gap-5 group">
            {badge.album.coverArtUrlLarge ? (
              <img
                src={badge.album.coverArtUrlLarge}
                alt={badge.album.title}
                className="w-24 h-24 object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-24 h-24 bg-[--muted]/10 border border-[--border] flex items-center justify-center flex-shrink-0">
                <svg className="w-10 h-10 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-xl font-bold group-hover:text-[#ffd700] transition-colors line-clamp-1">
                {badge.album.title}
              </h2>
              <p className="text-[--muted] mb-2">{badge.album.artistName}</p>
              <div className="flex items-center gap-4 text-xs text-[--muted]">
                {badge.album.releaseDate && (
                  <span>{format(new Date(badge.album.releaseDate), 'yyyy')}</span>
                )}
                <span>{badge.album._count.reviews} reviews</span>
              </div>
            </div>
            <svg className="w-5 h-5 text-[--muted] opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8 animate-fade-in" style={{ animationDelay: '200ms' }}>
          <div className="border border-[--border] p-5 text-center">
            <p className="text-3xl font-bold tabular-nums mb-1" style={{ color: color.bg }}>
              #{badge.position}
            </p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Review Position</p>
          </div>
          <div className="border border-[--border] p-5 text-center">
            <p className="text-3xl font-bold tabular-nums mb-1 text-green-500">
              +{badge.waxAwarded}
            </p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">WAX Earned</p>
          </div>
          <div className="border border-[--border] p-5 text-center">
            <p className="text-3xl font-bold tabular-nums mb-1">
              {badge.album._count.reviews}
            </p>
            <p className="text-[10px] tracking-[0.2em] uppercase text-[--muted]">Total Reviews</p>
          </div>
        </div>

        {/* Earned By */}
        <div className="border border-[--border] p-6 animate-fade-in" style={{ animationDelay: '300ms' }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1.5 h-1.5 bg-[--muted]" />
            <span className="text-[10px] tracking-[0.3em] uppercase text-[--muted]">Earned By</span>
          </div>
          <Link href={`/u/${badge.user.username}`} className="flex items-center gap-4 group">
            {badge.user.image ? (
              <img
                src={badge.user.image}
                alt={badge.user.username || 'User'}
                className="w-12 h-12 object-cover"
              />
            ) : (
              <div className="w-12 h-12 bg-[--muted]/10 border border-[--border] flex items-center justify-center">
                <span className="text-lg font-bold text-[--muted]">
                  {(badge.user.username || 'U')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <p className="font-semibold group-hover:text-[#ffd700] transition-colors">
                @{badge.user.username || 'user'}
              </p>
              <p className="text-sm text-[--muted]">
                Tastemaker Score: {badge.user.tastemakeScore}
              </p>
            </div>
          </Link>
        </div>

        {/* Share Section */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '400ms' }}>
          <p className="text-[10px] tracking-[0.3em] uppercase text-[--muted] mb-4">Share This Badge</p>
          <BadgeShareButtons badgeId={id} albumTitle={badge.album.title} label={label} />
        </div>
      </div>
    </div>
  )
}
