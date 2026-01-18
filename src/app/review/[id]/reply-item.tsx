"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"
import { DefaultAvatar } from "@/components/default-avatar"

interface ReplyItemProps {
  reply: {
    id: string
    text: string
    createdAt: Date
    user: {
      id: string
      username: string | null
      image: string | null
      isVerified: boolean
    }
  }
  currentUserId?: string
}

export function ReplyItem({ reply, currentUserId }: ReplyItemProps) {
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const isOwner = currentUserId === reply.user.id

  const handleDelete = async () => {
    if (isDeleting) return
    setIsDeleting(true)

    try {
      const res = await fetch(`/api/replies/${reply.id}`, {
        method: "DELETE",
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error("Failed to delete reply:", error)
    } finally {
      setIsDeleting(false)
      setShowConfirm(false)
    }
  }

  return (
    <div className="p-4">
      <div className="flex items-start gap-3">
        <Link href={`/u/${reply.user.username}`} className="flex-shrink-0">
          {reply.user.image ? (
            <img
              src={reply.user.image}
              alt={reply.user.username || ""}
              className="w-8 h-8 object-cover border border-[#333]"
            />
          ) : (
            <DefaultAvatar size="sm" />
          )}
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/u/${reply.user.username}`}
              className="font-bold text-sm hover:underline no-underline"
            >
              {reply.user.username}
            </Link>
            {reply.user.isVerified && (
              <span className="text-blue-400 text-xs">✓</span>
            )}
            <span className="text-[#666] text-xs">
              {formatDistanceToNow(new Date(reply.createdAt), { addSuffix: true })}
            </span>
            {isOwner && (
              <>
                <span className="text-[#666]">·</span>
                {showConfirm ? (
                  <span className="flex items-center gap-2">
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="text-xs text-red-500 hover:underline disabled:opacity-50"
                    >
                      {isDeleting ? "Deleting..." : "Confirm"}
                    </button>
                    <button
                      onClick={() => setShowConfirm(false)}
                      className="text-xs text-[#666] hover:underline"
                    >
                      Cancel
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="text-xs text-[#666] hover:text-red-500 transition-colors"
                  >
                    Delete
                  </button>
                )}
              </>
            )}
          </div>
          <p className="text-sm mt-1 whitespace-pre-wrap break-words">{reply.text}</p>
        </div>
      </div>
    </div>
  )
}
