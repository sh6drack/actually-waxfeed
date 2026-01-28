"use client"

import { createContext, useContext, useEffect, useState, useCallback } from "react"

// Accent color presets
export const ACCENT_COLORS = {
  gold: { name: "Gold", primary: "#ffd700", hover: "#ffed4a", muted: "#ffd700" },
  purple: { name: "Purple", primary: "#9b7bbd", hover: "#b794d4", muted: "#9b7bbd" },
  blue: { name: "Blue", primary: "#3b82f6", hover: "#60a5fa", muted: "#3b82f6" },
  pink: { name: "Pink", primary: "#ec4899", hover: "#f472b6", muted: "#ec4899" },
  green: { name: "Green", primary: "#22c55e", hover: "#4ade80", muted: "#22c55e" },
  red: { name: "Red", primary: "#ef4444", hover: "#f87171", muted: "#ef4444" },
  orange: { name: "Orange", primary: "#f97316", hover: "#fb923c", muted: "#f97316" },
  cyan: { name: "Cyan", primary: "#06b6d4", hover: "#22d3ee", muted: "#06b6d4" },
  custom: { name: "Custom", primary: "#ffd700", hover: "#ffed4a", muted: "#ffd700" },
} as const

export type AccentColor = keyof typeof ACCENT_COLORS

// Helper to generate hover/muted variants from a hex color
function generateColorVariants(hex: string) {
  // Lighten for hover (add 20% white)
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  const hover = `#${Math.min(255, Math.round(r + (255 - r) * 0.25)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(g + (255 - g) * 0.25)).toString(16).padStart(2, '0')}${Math.min(255, Math.round(b + (255 - b) * 0.25)).toString(16).padStart(2, '0')}`
  return { primary: hex, hover, muted: hex }
}

// Font presets
export const FONT_FAMILIES = {
  sans: { name: "Sans Serif", value: '"Helvetica Neue", Helvetica, Arial, sans-serif', style: "Modern & Clean" },
  serif: { name: "Serif", value: '"Georgia", "Times New Roman", serif', style: "Classic Magazine" },
  mono: { name: "Monospace", value: '"SF Mono", Monaco, monospace', style: "Technical" },
} as const

export type FontFamily = keyof typeof FONT_FAMILIES

// Layout density
export const LAYOUT_DENSITIES = {
  compact: { name: "Compact", scale: 0.9, description: "More content, less space" },
  comfortable: { name: "Comfortable", scale: 1, description: "Balanced spacing" },
  spacious: { name: "Spacious", scale: 1.15, description: "Breathing room" },
} as const

export type LayoutDensity = keyof typeof LAYOUT_DENSITIES

// Card styles
export const CARD_STYLES = {
  minimal: { name: "Minimal", description: "Clean borders, no shadows" },
  elevated: { name: "Elevated", description: "Subtle shadows and depth" },
  outlined: { name: "Outlined", description: "Bold borders" },
} as const

export type CardStyle = keyof typeof CARD_STYLES

// Background texture options for magazine feel
export const BACKGROUND_TEXTURES = {
  none: { name: "None", description: "Clean solid colors" },
  paper: { name: "Paper", description: "Subtle paper texture" },
  grain: { name: "Film Grain", description: "Vintage film grain" },
  noise: { name: "Noise", description: "Digital noise texture" },
} as const

export type BackgroundTexture = keyof typeof BACKGROUND_TEXTURES

// Grid column options for album displays
export const GRID_COLUMNS = {
  auto: { name: "Auto", description: "Responsive columns", cols: "auto" },
  two: { name: "2 Columns", description: "Large album art", cols: "2" },
  three: { name: "3 Columns", description: "Balanced view", cols: "3" },
  four: { name: "4 Columns", description: "More albums", cols: "4" },
  five: { name: "5 Columns", description: "Compact grid", cols: "5" },
} as const

export type GridColumns = keyof typeof GRID_COLUMNS

// Cover art display styles
export const COVER_STYLES = {
  square: { name: "Square", description: "Classic album look" },
  rounded: { name: "Rounded", description: "Soft corners" },
  shadow: { name: "Shadow", description: "Elevated depth" },
} as const

export type CoverStyle = keyof typeof COVER_STYLES

// Review display modes - magazine-style options
export const REVIEW_DISPLAYS = {
  cards: { name: "Cards", description: "Modern card layout" },
  list: { name: "List", description: "Compact list view" },
  magazine: { name: "Magazine", description: "Editorial spread" },
} as const

export type ReviewDisplay = keyof typeof REVIEW_DISPLAYS

// Font size preferences
export const FONT_SIZES = {
  small: { name: "Small", scale: 0.9, description: "Compact reading" },
  medium: { name: "Medium", scale: 1, description: "Default size" },
  large: { name: "Large", scale: 1.1, description: "Easier reading" },
} as const

export type FontSize = keyof typeof FONT_SIZES

// Homepage layout styles
export const HOMEPAGE_LAYOUTS = {
  editorial: { name: "Editorial", description: "Magazine-style featured content" },
  grid: { name: "Grid", description: "Album-focused grid layout" },
  stream: { name: "Stream", description: "Activity feed style" },
} as const

export type HomepageLayout = keyof typeof HOMEPAGE_LAYOUTS

interface CustomizationSettings {
  accentColor: AccentColor
  customAccentHex: string // Custom hex color when accentColor is 'custom'
  fontFamily: FontFamily
  fontSize: FontSize
  layoutDensity: LayoutDensity
  cardStyle: CardStyle
  backgroundTexture: BackgroundTexture
  gridColumns: GridColumns
  coverStyle: CoverStyle
  reviewDisplay: ReviewDisplay
  homepageLayout: HomepageLayout
  showAnimations: boolean
  showRatings: boolean
  showCursor: boolean // Custom cursor toggle
  compactMode: boolean // Hide secondary UI elements
}

const DEFAULT_SETTINGS: CustomizationSettings = {
  accentColor: "gold",
  customAccentHex: "#ffd700",
  fontFamily: "sans",
  fontSize: "medium",
  layoutDensity: "comfortable",
  cardStyle: "minimal",
  backgroundTexture: "none",
  gridColumns: "auto",
  coverStyle: "square",
  reviewDisplay: "cards",
  homepageLayout: "editorial",
  showAnimations: true,
  showRatings: true,
  showCursor: true,
  compactMode: false,
}

interface CustomizationContextType {
  settings: CustomizationSettings
  updateSetting: <K extends keyof CustomizationSettings>(key: K, value: CustomizationSettings[K]) => void
  resetSettings: () => void
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined)

const STORAGE_KEY = "waxfeed-customization"

export function CustomizationProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<CustomizationSettings>(DEFAULT_SETTINGS)
  const [mounted, setMounted] = useState(false)

  // Load settings from localStorage on mount
  useEffect(() => {
    setMounted(true)
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        setSettings({ ...DEFAULT_SETTINGS, ...parsed })
      }
    } catch {
      // Invalid saved data, use defaults
    }
  }, [])

  // Apply CSS variables when settings change
  useEffect(() => {
    if (!mounted) return

    const root = document.documentElement

    // Handle accent color - use custom hex if 'custom' is selected
    const accent = settings.accentColor === 'custom'
      ? generateColorVariants(settings.customAccentHex)
      : ACCENT_COLORS[settings.accentColor]
    const font = FONT_FAMILIES[settings.fontFamily]
    const density = LAYOUT_DENSITIES[settings.layoutDensity]

    // Set accent color CSS variables
    root.style.setProperty("--accent-primary", accent.primary)
    root.style.setProperty("--accent-hover", accent.hover)
    root.style.setProperty("--accent-muted", accent.muted)

    // Set font family
    root.style.setProperty("--font-custom", font.value)

    // Set density scale
    root.style.setProperty("--density-scale", String(density.scale))

    // Set card style class
    root.dataset.cardStyle = settings.cardStyle

    // Set background texture class
    root.dataset.bgTexture = settings.backgroundTexture

    // Set animation preference
    if (!settings.showAnimations) {
      root.classList.add("reduce-motion")
    } else {
      root.classList.remove("reduce-motion")
    }

    // Set cursor preference
    if (!settings.showCursor) {
      root.classList.add("no-custom-cursor")
    } else {
      root.classList.remove("no-custom-cursor")
    }

    // Set grid columns
    root.dataset.gridCols = settings.gridColumns

    // Set cover style
    root.dataset.coverStyle = settings.coverStyle

    // Set review display mode
    root.dataset.reviewDisplay = settings.reviewDisplay

    // Set homepage layout
    root.dataset.homepageLayout = settings.homepageLayout

    // Set font size scale
    const fontSizeScale = FONT_SIZES[settings.fontSize].scale
    root.style.setProperty("--font-size-scale", String(fontSizeScale))

    // Set compact mode
    if (settings.compactMode) {
      root.classList.add("compact-mode")
    } else {
      root.classList.remove("compact-mode")
    }

    // Save to localStorage
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings, mounted])

  const updateSetting = useCallback(<K extends keyof CustomizationSettings>(
    key: K,
    value: CustomizationSettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }, [])

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  return (
    <CustomizationContext.Provider value={{ settings, updateSetting, resetSettings }}>
      {children}
    </CustomizationContext.Provider>
  )
}

export function useCustomization() {
  const context = useContext(CustomizationContext)
  if (!context) {
    return {
      settings: DEFAULT_SETTINGS,
      updateSetting: () => {},
      resetSettings: () => {},
    }
  }
  return context
}
