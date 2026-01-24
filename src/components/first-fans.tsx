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
  GOLD: { bg: "bg-[#ffd700]/20", border: "border-[#ffd700]/50", text: "text-[#ffd700]" },
  SILVER: { bg: "bg-[#c0c0c0]/20", border: "border-[#c0c0c0]/50", text: "text-[#c0c0c0]" },
  BRONZE: { bg: "bg-[#cd7f32]/20", border: "border-[#cd7f32]/50", text: "text-[#cd7f32]" },
}

export function FirstFans({ fans, albumTrending, totalReviews, className = "" }: FirstFansProps) {
  if (fans.length === 0) return null

  // Group fans by badge tier
  const goldFans = fans.filter(f => f.position <= 10)
  const silverFans = fans.filter(f => f.position > 10 && f.position <= 50)
  const bronzeFans = fans.filter(f => f.position > 50 && f.position <= 100)

  return (
    <div className={`border border-[--border] ${className}`}>
      <div className="px-4 py-3 border-b border-[--border] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            First Fans
          </h3>
          <p className="text-xs text-[--muted] mt-0.5">
            {albumTrending 
              ? "These people believed first"
              : `${100 - totalReviews > 0 ? `${100 - totalReviews} more reviews until badges unlock` : "Approaching trend"}`
            }
          </p>
        </div>
        {albumTrending && (
          <span className="text-[9px] uppercase tracking-wider px-2 py-1 bg-[#ffd700]/20 text-[#ffd700] border border-[#ffd700]/30">
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
          />
        )}

        {/* If not trending yet, show progress */}
        {!albumTrending && totalReviews < 100 && (
          <div className="pt-2 border-t border-[--border]">
            <div className="flex items-center justify-between text-xs text-[--muted] mb-2">
              <span>Progress to trending</span>
              <span className="tabular-nums">{totalReviews}/100</span>
            </div>
            <div className="h-1.5 bg-[--border] rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#ffd700] transition-all duration-500"
                style={{ width: `${Math.min(totalReviews, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-[--muted] mt-2">
              When this album hits 100 reviews, early fans get their badges.
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
  showBadges 
}: { 
  title: string
  subtitle: string
  fans: FirstFan[]
  badgeType: "GOLD" | "SILVER" | "BRONZE"
  showBadges: boolean
}) {
  const colors = BADGE_COLORS[badgeType]
  
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-[10px] uppercase tracking-wider font-bold ${colors.text}`}>
          {title}
        </span>
        <span className="text-[10px] text-[--muted]">
          ({subtitle})
        </span>
        {showBadges && (
          <span className={`ml-auto text-[9px] px-1.5 py-0.5 ${colors.bg} ${colors.text} border ${colors.border}`}>
            {badgeType === "GOLD" ? "🥇" : badgeType === "SILVER" ? "🥈" : "🥉"} Earned
          </span>
        )}
      </div>
      
      <div className="flex flex-wrap gap-1">
        {fans.map((fan) => (
          <Link
            key={fan.user.id}
            href={`/u/${fan.user.username}`}
            className="group flex items-center gap-1.5 px-2 py-1 border border-[--border] hover:border-white/50 transition-colors"
            title={`#${fan.position} - Rated ${fan.rating}/10`}
          >
            {fan.user.image ? (
              <img 
                src={fan.user.image} 
                alt="" 
                className="w-4 h-4 rounded-full"
              />
            ) : (
              <DefaultAvatar size="xs" />
            )}
            <span className="text-[11px] group-hover:text-[--muted] transition-colors">
              @{fan.user.username}
            </span>
            <span className={`text-[9px] tabular-nums ${colors.text}`}>
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
    <div className="border border-[--border] p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[--muted] font-bold">
          First Fans
        </span>
        {albumTrending && (
          <span className="text-[9px] px-1.5 py-0.5 bg-[#ffd700]/20 text-[#ffd700]">
            🏆
          </span>
        )}
      </div>

      <div className="flex -space-x-2 mb-2">
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
                className="w-7 h-7 rounded-full border-2 border-[--background]"
              />
            ) : (
              <div className="w-7 h-7 rounded-full border-2 border-[--background] bg-[--border] flex items-center justify-center">
                <span className="text-[9px]">👤</span>
              </div>
            )}
          </Link>
        ))}
        {fans.length > 5 && (
          <div className="w-7 h-7 rounded-full border-2 border-[--background] bg-[--border] flex items-center justify-center">
            <span className="text-[9px] text-[--muted]">+{fans.length - 5}</span>
          </div>
        )}
      </div>

      {!albumTrending && totalReviews < 100 && (
        <div className="h-1 bg-[--border] rounded-full overflow-hidden">
          <div 
            className="h-full bg-[#ffd700]"
            style={{ width: `${Math.min(totalReviews, 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}
