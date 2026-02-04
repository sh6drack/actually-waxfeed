'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Tooltip } from '@/components/ui/tooltip'

interface MessageButtonProps {
  targetUserId: string
  className?: string
}

interface CanMessageResponse {
  canMessage: boolean
  score: number | null
  threshold: number
  reason?: string
  existingConversationId: string | null
  targetUser: {
    id: string
    username: string | null
    name: string | null
    image: string | null
  }
}

export function MessageButton({ targetUserId, className = '' }: MessageButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [canMsg, setCanMsg] = useState<CanMessageResponse | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (session?.user?.id && targetUserId !== session.user.id) {
      checkCanMessage()
    } else {
      setLoading(false)
    }
  }, [session, targetUserId])

  const checkCanMessage = async () => {
    try {
      setChecking(true)
      const res = await fetch(`/api/messages/can-message/${targetUserId}`)
      const data = await res.json()
      if (data.success) {
        setCanMsg(data.data)
      }
    } catch {
      // Silent fail
    } finally {
      setLoading(false)
      setChecking(false)
    }
  }

  const handleClick = () => {
    if (!session) {
      router.push(`/login?callbackUrl=/u/${canMsg?.targetUser?.username}`)
      return
    }

    if (canMsg?.existingConversationId) {
      router.push(`/messages/${canMsg.existingConversationId}`)
      return
    }

    if (canMsg?.canMessage) {
      setShowModal(true)
    }
  }

  const handleSend = async () => {
    if (!message.trim() || sending) return

    setSending(true)
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId, message: message.trim() }),
      })
      const data = await res.json()
      if (data.success) {
        router.push(`/messages/${data.data.conversation.id}`)
      } else {
        alert(data.error || 'Failed to send message')
      }
    } catch {
      alert('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Don't show for own profile
  if (!session || targetUserId === session.user?.id) {
    return null
  }

  if (loading || checking) {
    return (
      <button 
        disabled 
        className={`px-4 py-2 bg-[--muted]/20 text-[--muted] text-sm ${className}`}
      >
        ...
      </button>
    )
  }

  // Can't message - show locked state
  if (!canMsg?.canMessage) {
    return (
      <Tooltip content={canMsg?.reason || `Need ${canMsg?.threshold || 60}%+ taste match to message`}>
        <button
          disabled
          className={`px-4 py-2 bg-[--muted]/10 text-[--muted] text-sm cursor-not-allowed ${className}`}
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            {canMsg && canMsg.score !== null ? `${canMsg.score}% match` : 'Message'}
          </span>
        </button>
      </Tooltip>
    )
  }

  return (
    <>
      <button
        onClick={handleClick}
        className={`px-4 py-2 bg-[var(--accent-primary)] text-black text-sm font-medium hover:bg-[#ffed4a] transition-colors ${className}`}
      >
        <span className="flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {canMsg.existingConversationId ? 'Continue Chat' : `Message (${canMsg.score}%)`}
        </span>
      </button>

      {/* New Message Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-[--background] border border-[--border] max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Start Conversation</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="text-[--muted] hover:text-[--foreground]"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-3 bg-[--muted]/10 mb-4">
              <p className="text-sm text-[--muted]">
                You have a <span className="text-[var(--accent-primary)] font-bold">{canMsg.score}%</span> taste match with @{canMsg.targetUser?.username}
              </p>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              placeholder="Write your first message..."
              className="w-full p-3 bg-[--muted]/10 resize-none focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]"
              rows={4}
            />
            <p className="text-[10px] text-[--muted] mt-1 text-right">
              {message.length}/500
            </p>

            <div className="flex gap-3 mt-4">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 border border-[--border] text-[--foreground] text-sm hover:bg-[--muted]/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={!message.trim() || sending}
                className="flex-1 px-4 py-2 bg-[var(--accent-primary)] text-black text-sm font-medium disabled:opacity-50"
              >
                {sending ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
