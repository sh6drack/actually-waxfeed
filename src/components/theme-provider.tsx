"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  mounted: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // Check localStorage for saved preference - default to "dark" (white body) if no preference
    const saved = localStorage.getItem("waxfeed-theme") as Theme | null
    if (saved) {
      setTheme(saved)
    }
    // No system preference check - always default to white body ("dark" theme)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Update document class
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(theme)

    // Save preference
    localStorage.setItem("waxfeed-theme", theme)
  }, [theme, mounted])

  const toggleTheme = () => {
    setTheme(prev => prev === "light" ? "dark" : "light")
  }

  // Always render the provider to maintain consistent tree structure
  // This prevents hydration mismatches
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  // Return default values for SSR/static generation (e.g., /_not-found page)
  if (!context) {
    return { theme: "dark" as Theme, toggleTheme: () => {}, mounted: false }
  }
  return context
}
