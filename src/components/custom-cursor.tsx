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

    const onMouseEnterInteractive = () => {
      cursor.classList.add("active")
    }

    const onMouseLeaveInteractive = () => {
      cursor.classList.remove("active")
    }

    document.addEventListener("mousemove", onMouseMove)

    // Add hover effect to interactive elements
    const interactiveElements = document.querySelectorAll("a, button, [role='button'], input, textarea")
    interactiveElements.forEach((el) => {
      el.addEventListener("mouseenter", onMouseEnterInteractive)
      el.addEventListener("mouseleave", onMouseLeaveInteractive)
    })

    return () => {
      document.removeEventListener("mousemove", onMouseMove)
      interactiveElements.forEach((el) => {
        el.removeEventListener("mouseenter", onMouseEnterInteractive)
        el.removeEventListener("mouseleave", onMouseLeaveInteractive)
      })
    }
  }, [])

  return <div ref={cursorRef} className="cursor" />
}
