"use client"

import { useState, useRef, useEffect, ReactNode } from "react"
import { createPortal } from "react-dom"

interface TooltipProps {
  content: string
  children: ReactNode
  position?: "top" | "bottom"
  delay?: number
}

export function Tooltip({ 
  content, 
  children, 
  position = "bottom",
  delay = 400 
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    return () => setMounted(false)
  }, [])

  const updatePosition = () => {
    if (!triggerRef.current) return
    
    const rect = triggerRef.current.getBoundingClientRect()
    const tooltipWidth = 280
    
    let left = rect.left + rect.width / 2 - tooltipWidth / 2
    let top = position === "bottom" 
      ? rect.bottom + 8 
      : rect.top - 8
    
    // Keep tooltip within viewport horizontally
    if (left < 10) left = 10
    if (left + tooltipWidth > window.innerWidth - 10) {
      left = window.innerWidth - tooltipWidth - 10
    }
    
    setCoords({ top, left })
  }

  const handleMouseEnter = () => {
    updatePosition()
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const tooltipElement = isVisible && mounted ? createPortal(
    <div
      role="tooltip"
      style={{
        position: "fixed",
        top: coords.top,
        left: coords.left,
        zIndex: 99999,
        pointerEvents: "none",
        animation: "tooltip-fade 0.15s ease-out",
      }}
    >
      <div 
        className="tooltip-content"
        style={{
          backgroundColor: "#1a1a1a",
          color: "#fff",
          padding: "10px 14px",
          fontSize: "13px",
          lineHeight: "1.5",
          width: "280px",
          boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {content}
      </div>
    </div>,
    document.body
  ) : null

  return (
    <>
      <span 
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: "inline-flex", alignItems: "center" }}
      >
        {children}
      </span>
      {tooltipElement}
    </>
  )
}

// Simple inline help icon with tooltip
export function HelpTooltip({ content }: { content: string }) {
  return (
    <Tooltip content={content}>
      <span 
        className="tooltip-trigger-icon"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "16px",
          height: "16px",
          backgroundColor: "rgba(255, 215, 0, 0.2)",
          cursor: "help",
        }}
      >
        <svg 
          style={{ width: "10px", height: "10px", color: "var(--accent-primary)" }}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </span>
    </Tooltip>
  )
}

// Info icon variant (subtle)
export function InfoTooltip({ content }: { content: string }) {
  return (
    <Tooltip content={content}>
      <span style={{ display: "inline-flex", cursor: "help", opacity: 0.6 }}>
        <svg 
          style={{ width: "14px", height: "14px" }}
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
          strokeWidth={2}
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </span>
    </Tooltip>
  )
}
