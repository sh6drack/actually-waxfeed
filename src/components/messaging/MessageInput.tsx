'use client'

import { useState, useRef, useEffect, KeyboardEvent } from 'react'

interface MessageInputProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
  maxLength?: number
}

export function MessageInput({ 
  onSend, 
  disabled = false,
  placeholder = 'Type a message...',
  maxLength = 2000,
}: MessageInputProps) {
  const [content, setContent] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`
    }
  }, [content])

  const handleSubmit = () => {
    if (content.trim() && !disabled) {
      onSend(content.trim())
      setContent('')
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const remaining = maxLength - content.length

  return (
    <div className="p-4 border-t border-[--border]">
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full p-3 pr-12 bg-[--muted]/10 resize-none focus:outline-none focus:ring-1 focus:ring-[#ffd700] disabled:opacity-50"
            style={{ minHeight: '48px', maxHeight: '150px' }}
          />
          {remaining < 100 && (
            <span className={`absolute bottom-2 right-2 text-[10px] ${
              remaining < 20 ? 'text-red-500' : 'text-[--muted]'
            }`}>
              {remaining}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || disabled}
          className="px-4 py-3 bg-[#ffd700] text-black font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#ffed4a] transition-colors"
        >
          {disabled ? '...' : 'Send'}
        </button>
      </div>
      <p className="text-[10px] text-[--muted] mt-2">
        Press Enter to send, Shift+Enter for new line
      </p>
    </div>
  )
}
