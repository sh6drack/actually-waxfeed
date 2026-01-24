'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { MessageThread } from '@/components/messaging/MessageThread'

export default function ConversationPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const conversationId = params.conversationId as string

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?callbackUrl=/messages')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[--muted]">Loading...</div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back link */}
      <div className="p-4 border-b border-[--border]">
        <Link 
          href="/messages"
          className="text-sm text-[--muted] hover:text-[--foreground] flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All Messages
        </Link>
      </div>

      {/* Message Thread */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto w-full">
        <MessageThread conversationId={conversationId} />
      </div>
    </div>
  )
}
