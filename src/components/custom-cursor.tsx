"use client"

import { useEffect, useRef } from "react"

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const cursor = cursorRef.current
    if (!cursor) return

    // Check if device supports hover (not touch)
    const supportsHover = window.matchMedia("(hover: hover)").matches
    if (!supportsHover) return

    const onMouseMove = (e: MouseEvent) => {
      cursor.style.left = `${e.clientX}px`
      cursor.style.top = `${e.clientY}px`
    }

    // Use event delegation on document to handle all interactive elements
    // This handles dynamically added elements and prevents memory leaks
    const onMouseOver = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.matches("a, button, [role='button'], input, textarea, [data-interactive]")) {
        cursor.classList.add("active")
      }
    }

    const onMouseOut = (e: MouseEvent) => {
      const target = e.target as Element
      if (target.matches("a, button, [role='button'], input, textarea, [data-interactive]")) {
        cursor.classList.remove("active")
      }
    }

    document.addEventListener("mousemove", onMouseMove)
    document.addEventListener("mouseover", onMouseOver)
    document.addEventListener("mouseout", onMouseOut)

    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseover", onMouseOver)
      document.removeEventListener("mouseout", onMouseOut)
    }
  }, [])

  return <div ref={cursorRef} className="cursor" />
}
