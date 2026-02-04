"use client"

import Link from "next/link"
import { DefaultAvatar } from "@/components/default-avatar"

interface FirstFan {
  position: number
  rating: number
  user: {
    id: string
    username: string | null
    image: string | null
  }
  badgeType: "GOLD" | "SILVER" | "BRONZE" | null
  createdAt: Date
}

interface FirstFansProps {
  fans: FirstFan[]
  albumTrending: boolean
  totalReviews: number
  className?: string
}

const BADGE_COLORS = {
  GOLD: { bg: "bg-[var(--accent-primary)]/10", border: "border-[var(--accent-primary)]/40", text: "text-[var(--accent-primary)]", glow: "shadow-[0_0_10px_rgba(255,215,0,0.1)]" },
  SILVER: { bg: "bg-[#c0c0c0]/10", border: "border-[#c0c0c0]/40", text: "text-[#c0c0c0]", glow: "shadow-[0_0_10px_rgba(192,192,192,0.1)]" },
  BRONZE: { bg: "bg-[#cd7f32]/10", border: "border-[#cd7f32]/40", text: "text-[#cd7f32]", glow: "shadow-[0_0_10px_rgba(205,127,50,0.1)]" },
}

export function FirstFans({ fans, albumTrending, totalReviews, className = "" }: FirstFansProps) {
  if (fans.length === 0) return null

  // Group fans by badge tier
  const goldFans = fans.filter(f => f.position <= 10)
  const silverFans = fans.filter(f => f.position > 10 && f.position <= 50)
  const bronzeFans = fans.filter(f => f.position > 50 && f.position <= 100)

  return (
    <div className={`border border-[--border] animate-fade-in ${className}`}>
      <div className="px-4 py-3 border-b border-[--border] flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-[var(--accent-primary)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
            <h3 className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.2em]">
              First Fans
            </h3>
          </div>
          <p className="text-[10px] sm:text-xs text-[--muted] mt-1 leading-relaxed">
            {albumTrending
              ? "These people believed first"
              : `${100 - totalReviews > 0 ? `${100 - totalReviews} more reviews until badges unlock` : "Approaching trend"}`
            }
          </p>
        </div>
        {albumTrending && (
          <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] px-2.5 py-1.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30 flex items-center gap-1.5">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Trending
          </span>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Gold Tier - First 10 */}
        {goldFans.length > 0 && (
          <FanTier
            title="Gold Spin"
            subtitle="First 10"
            fans={goldFans}
            badgeType="GOLD"
            showBadges={albumTrending}
            animationDelay={0}
          />
        )}

        {/* Silver Tier - 11-50 */}
        {silverFans.length > 0 && (
          <FanTier
            title="Silver Spin"
            subtitle="11-50"
            fans={silverFans}
            badgeType="SILVER"
            showBadges={albumTrending}
            animationDelay={100}
          />
        )}

        {/* Bronze Tier - 51-100 */}
        {bronzeFans.length > 0 && (
          <FanTier
            title="Bronze Spin"
            subtitle="51-100"
            fans={bronzeFans}
            badgeType="BRONZE"
            showBadges={albumTrending}
            animationDelay={200}
          />
        )}

        {/* If not trending yet, show progress */}
        {!albumTrending && totalReviews < 100 && (
          <div className="pt-3 border-t border-[--border] animate-fade-in" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center justify-between text-[10px] text-[--muted] mb-2">
              <span className="uppercase tracking-wide">Progress to trending</span>
              <span className="tabular-nums font-medium">{totalReviews}/100</span>
            </div>
            <div className="h-1 bg-[--border] overflow-hidden">
              <div
                className="h-full bg-[var(--accent-primary)] transition-all duration-500"
                style={{ width: `${Math.min(totalReviews, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[--muted]/70 mt-2 leading-relaxed">
              When this album hits 100 reviews, early fans get their badges.
              <span className="block mt-1 text-[var(--accent-primary)]/70">Only written reviews count—quick rates don&apos;t qualify.</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FanTier({
  title,
  subtitle,
  fans,
  badgeType,
  showBadges,
  animationDelay = 0
}: {
  title: string
  subtitle: string
  fans: FirstFan[]
  badgeType: "GOLD" | "SILVER" | "BRONZE"
  showBadges: boolean
  animationDelay?: number
}) {
  const colors = BADGE_COLORS[badgeType]

  return (
    <div className="animate-fade-in" style={{ animationDelay: `${animationDelay}ms` }}>
      <div className="flex items-center gap-2 mb-2.5">
        <div className={`w-4 h-4 flex items-center justify-center ${colors.bg} border ${colors.border}`}>
          {badgeType === "GOLD" ? (
            <svg className="w-2.5 h-2.5 text-[var(--accent-primary)]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className={`w-2.5 h-2.5 ${colors.text}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className={`text-[10px] sm:text-xs uppercase tracking-[0.15em] font-bold ${colors.text}`}>
          {title}
        </span>
        <span className="text-[10px] sm:text-xs text-[--muted]/60">
          ({subtitle})
        </span>
        {showBadges && (
          <span className={`ml-auto text-[9px] sm:text-[10px] tracking-wide uppercase px-2 py-0.5 ${colors.bg} ${colors.text} border ${colors.border} flex items-center gap-1`}>
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Earned
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        {fans.map((fan, index) => (
          <Link
            key={fan.user.id}
            href={`/u/${fan.user.username}`}
            className={`group flex items-center gap-1.5 px-2 py-1.5 border border-[--border] hover:border-[var(--accent-primary)]/30 hover:bg-[var(--accent-primary)]/5 transition-all animate-fade-in`}
            title={`#${fan.position} - Rated ${fan.rating}/10`}
            style={{ animationDelay: `${animationDelay + index * 30}ms` }}
          >
            {fan.user.image ? (
              <img
                src={fan.user.image}
                alt=""
                className="w-4 h-4 object-cover"
              />
            ) : (
              <DefaultAvatar size="xs" />
            )}
            <span className="text-[11px] sm:text-xs group-hover:text-[var(--accent-primary)] transition-colors">
              @{fan.user.username}
            </span>
            <span className={`text-[9px] sm:text-[10px] tabular-nums font-medium ${colors.text}`}>
              #{fan.position}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}

// Compact version for sidebar/smaller spaces
export function FirstFansCompact({
  fans,
  albumTrending,
  totalReviews,
}: {
  fans: FirstFan[]
  albumTrending: boolean
  totalReviews: number
}) {
  if (fans.length === 0) return null

  const topFans = fans.slice(0, 5)

  return (
    <div className="border border-[--border] p-3 animate-fade-in">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-1.5">
          <svg className="w-3 h-3 text-[var(--accent-primary)]" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px] uppercase tracking-[0.15em] text-[--muted] font-bold">
            First Fans
          </span>
        </div>
        {albumTrending && (
          <span className="text-[9px] px-1.5 py-0.5 bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] border border-[var(--accent-primary)]/30">
            <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
          </span>
        )}
      </div>

      <div className="flex -space-x-1.5 mb-2.5">
        {topFans.map((fan, i) => (
          <Link
            key={fan.user.id}
            href={`/u/${fan.user.username}`}
            className="relative hover:z-10 transition-transform hover:scale-110"
            style={{ zIndex: topFans.length - i }}
            title={`#${fan.position} - @${fan.user.username}`}
          >
            {fan.user.image ? (
              <img
                src={fan.user.image}
                alt=""
                className="w-7 h-7 object-cover border-2 border-[--background]"
              />
            ) : (
              <div className="w-7 h-7 border-2 border-[--background] bg-[--border] flex items-center justify-center">
                <svg className="w-3 h-3 text-[--muted]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
            )}
          </Link>
        ))}
        {fans.length > 5 && (
          <div className="w-7 h-7 border-2 border-[--background] bg-[--muted]/10 flex items-center justify-center">
            <span className="text-[9px] text-[--muted] tabular-nums">+{fans.length - 5}</span>
          </div>
        )}
      </div>

      {!albumTrending && totalReviews < 100 && (
        <div className="h-0.5 bg-[--border] overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] transition-all"
            style={{ width: `${Math.min(totalReviews, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
