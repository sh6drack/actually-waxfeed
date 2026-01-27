"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: string
  content: {
    actorId?: string
    actorName?: string
    reviewId?: string
    albumTitle?: string
    replyText?: string
    waxType?: string
  }
  isRead: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { status } = useSession()
  const router = useRouter()

  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications")
        const data = await res.json()
        if (data.success) {
          setNotifications(data.data.notifications)
          setUnreadCount(data.data.unreadCount)
        }
      } catch (error) {
        console.error("Failed to fetch notifications:", error)
      }
      setLoading(false)
    }

    if (status === "authenticated") {
      fetchNotifications()
    }
  }, [status])

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      })
      setNotifications(notifications.map(n => ({ ...n, isRead: true })))
      setUnreadCount(0)
    } catch (error) {
      console.error("Failed to mark as read:", error)
    }
  }

  const getNotificationText = (notification: Notification) => {
    const { type, content } = notification
    const actorName = content.actorName || "Someone"

    switch (type) {
      case "reply":
        return `${actorName} replied to your review of "${content.albumTitle}"`
      case "like":
        return `${actorName} liked your review of "${content.albumTitle}"`
      case "wax":
        return `${actorName} gave ${content.waxType === "premium" ? "premium " : ""}wax to your review of "${content.albumTitle}"`
      case "friend_request":
        return `${actorName} sent you a friend request`
      case "friend_accept":
        return `${actorName} accepted your friend request`
      case "friend_review":
        return `${actorName} reviewed "${content.albumTitle}"`
      case "review_trending":
        return `Your review of "${content.albumTitle}" is trending!`
      case "first_spin_badge":
        const badge = content as { badgeType?: string; position?: number; albumTitle?: string; artistName?: string; waxReward?: number }
        return `🎖️ You earned a ${badge.badgeType} Spin badge! You were #${badge.position} to rate "${badge.albumTitle}" (+${badge.waxReward} Wax)`
      case "album_trending":
        return `🔥 "${content.albumTitle}" is now trending! Check if you earned a badge.`
      default:
        return "New notification"
    }
  }

  const getNotificationLink = (notification: Notification) => {
    const { type, content } = notification
    const anyContent = content as Record<string, unknown>

    switch (type) {
      case "reply":
      case "like":
      case "wax":
        return content.reviewId ? `/review/${content.reviewId}` : "/"
      case "friend_request":
      case "friend_accept":
      case "friend_review":
        return content.actorId ? `/u/${content.actorName}` : "/"
      case "first_spin_badge":
        return anyContent.badgeId ? `/badge/${anyContent.badgeId}` : "/wallet"
      case "album_trending":
        return anyContent.albumId ? `/album/${anyContent.albumId}` : "/trending"
      default:
        return "/"
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="w-full px-4 lg:px-12 xl:px-20 max-w-4xl py-8">
        <p className="text-[#888]">Loading...</p>
      </div>
    )
  }

  return (
    <div className="w-full px-4 lg:px-12 xl:px-20 max-w-4xl py-6 sm:py-8">
      <div className="flex items-center justify-between gap-4 mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold tracking-tighter">Notifications</h1>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-xs sm:text-sm text-[#888] hover:text-white min-h-[44px] px-2"
          >
            Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="border border-[#222] p-8 text-center">
          <p className="text-[#888]">No notifications yet.</p>
        </div>
      ) : (
        <div className="divide-y divide-[#222]">
          {notifications.map((notification) => (
            <Link
              key={notification.id}
              href={getNotificationLink(notification)}
              className={`block py-3 sm:py-4 no-underline hover:bg-[#111] -mx-4 px-4 transition-colors min-h-[56px] ${
                !notification.isRead ? "bg-[#111]/50" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                {!notification.isRead && (
                  <div className="w-2 h-2 bg-white rounded-full mt-2 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm">{getNotificationText(notification)}</p>
                  <p className="text-xs text-[#666] mt-1">
                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
