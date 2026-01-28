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
  const [isFocused, setIsFocused] = useState(false)
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
  const hasContent = content.trim().length > 0

  return (
    <div className={`p-5 border-t transition-all duration-200 ${
      isFocused
        ? 'border-[var(--accent-primary)]/40 bg-gradient-to-t from-[var(--accent-primary)]/5 to-transparent'
        : 'border-[--border]'
    }`}>
      <div className="flex items-end gap-3">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, maxLength))}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className="w-full p-4 pr-14 bg-[--muted]/5 border border-[--border] resize-none focus:outline-none focus:border-[var(--accent-primary)]/40 disabled:opacity-50 transition-colors text-sm leading-relaxed placeholder:text-[--muted]/50"
            style={{ minHeight: '56px', maxHeight: '150px' }}
          />
          {remaining < 100 && (
            <span className={`absolute bottom-4 right-4 text-[10px] font-semibold tabular-nums transition-all ${
              remaining < 20
                ? 'text-red-400 animate-pulse'
                : 'text-[--muted]/40'
            }`}>
              {remaining}
            </span>
          )}
        </div>
        <button
          onClick={handleSubmit}
          disabled={!hasContent || disabled}
          className={`px-6 py-4 font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
            hasContent && !disabled
              ? 'bg-[var(--accent-primary)] text-black hover:bg-[#ffed4a] active:scale-[0.98]'
              : 'bg-[--muted]/10 text-[--muted]/50 cursor-not-allowed'
          }`}
        >
          {disabled ? (
            <span className="w-4 h-4 border-2 border-current border-t-transparent animate-spin" />
          ) : (
            <>
              <span className="tracking-wide">Send</span>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </>
          )}
        </button>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-[10px] text-[--muted]/40 tracking-wide">
          <kbd className="px-1.5 py-0.5 bg-[--muted]/10 text-[--muted]/60 font-mono">Enter</kbd>
          <span className="mx-2 opacity-50">send</span>
          <kbd className="px-1.5 py-0.5 bg-[--muted]/10 text-[--muted]/60 font-mono">Shift+Enter</kbd>
          <span className="ml-2 opacity-50">new line</span>
        </p>
        {hasContent && (
          <p className="text-[10px] text-[--muted]/40 tabular-nums animate-fade-in">
            {content.trim().split(/\s+/).length} words
          </p>
        )}
      </div>
    </div>
  )
}
