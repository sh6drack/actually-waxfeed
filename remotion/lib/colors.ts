// Color utilities for FREQUENCY promo
// Holographic gradients, color extraction, and palette management

export const COLORS = {
  black: "#000000",
  white: "#ffffff",
  gray: {
    100: "#f5f5f5",
    200: "#e5e5e5",
    300: "#d4d4d4",
    400: "#a3a3a3",
    500: "#737373",
    600: "#525252",
    700: "#404040",
    800: "#262626",
    900: "#171717",
  },
  // Holographic spectrum from WaxFeed logo
  holographic: {
    pink: "#e4a8c8",
    mint: "#98d8b8",
    sky: "#88c8d8",
    lavender: "#b898d8",
    lime: "#c8e8a8",
    peach: "#e8c8d8",
    coral: "#ffb8e0",
    aqua: "#b8ffb8",
    periwinkle: "#b8d8ff",
  },
  // Compatibility meter colors
  compatibility: {
    excellent: "#22c55e", // 80%+
    good: "#eab308", // 60-80%
    moderate: "#f97316", // 40-60%
    low: "#ef4444", // <40%
  },
};

/**
 * Get holographic gradient stops for SVG
 * @param rotation - Rotation angle in degrees
 * @returns Array of gradient stop objects
 */
export function getHolographicStops(rotation: number = 0): Array<{ offset: string; color: string }> {
  return [
    { offset: "0%", color: COLORS.holographic.pink },
    { offset: "20%", color: COLORS.holographic.mint },
    { offset: "40%", color: COLORS.holographic.sky },
    { offset: "60%", color: COLORS.holographic.lavender },
    { offset: "80%", color: COLORS.holographic.lime },
    { offset: "100%", color: COLORS.holographic.peach },
  ];
}

/**
 * Generate animated holographic gradient for a given frame
 * @param frame - Current frame number
 * @param speed - Animation speed (degrees per frame)
 * @returns CSS gradient string
 */
export function getAnimatedHolographicGradient(frame: number, speed: number = 0.5): string {
  const rotation = frame * speed;
  return `linear-gradient(${rotation}deg,
    ${COLORS.holographic.pink},
    ${COLORS.holographic.sky},
    ${COLORS.holographic.lavender},
    ${COLORS.holographic.mint},
    ${COLORS.holographic.pink}
  )`;
}

/**
 * Get compatibility color based on score
 * @param score - Compatibility score (0-100)
 * @returns Hex color string
 */
export function getCompatibilityColor(score: number): string {
  if (score >= 80) return COLORS.compatibility.excellent;
  if (score >= 60) return COLORS.compatibility.good;
  if (score >= 40) return COLORS.compatibility.moderate;
  return COLORS.compatibility.low;
}

/**
 * Interpolate between two colors
 * @param color1 - Start color (hex)
 * @param color2 - End color (hex)
 * @param t - Interpolation factor (0-1)
 * @returns Interpolated hex color
 */
export function lerpColor(color1: string, color2: string, t: number): string {
  const hex = (c: string) => parseInt(c.slice(1), 16);
  const r = (c: number) => (c >> 16) & 255;
  const g = (c: number) => (c >> 8) & 255;
  const b = (c: number) => c & 255;

  const c1 = hex(color1);
  const c2 = hex(color2);

  const nr = Math.round(r(c1) + (r(c2) - r(c1)) * t);
  const ng = Math.round(g(c1) + (g(c2) - g(c1)) * t);
  const nb = Math.round(b(c1) + (b(c2) - b(c1)) * t);

  return `#${((1 << 24) + (nr << 16) + (ng << 8) + nb).toString(16).slice(1)}`;
}

/**
 * Get a color from the holographic palette based on index
 * @param index - Index for color selection
 * @returns Hex color from holographic palette
 */
export function getHolographicColor(index: number): string {
  const colors = Object.values(COLORS.holographic);
  return colors[index % colors.length];
}

/**
 * Generate genre-based color
 * Maps genres to consistent colors for visualization
 * @param genre - Genre name
 * @returns Hex color
 */
export function getGenreColor(genre: string): string {
  const genreColors: Record<string, string> = {
    "hip-hop": COLORS.holographic.pink,
    "r&b": COLORS.holographic.lavender,
    "jazz": COLORS.holographic.sky,
    "electronic": COLORS.holographic.mint,
    "rock": COLORS.holographic.lime,
    "pop": COLORS.holographic.peach,
    "soul": COLORS.holographic.coral,
    "alternative": COLORS.holographic.aqua,
    "classical": COLORS.holographic.periwinkle,
  };

  const lower = genre.toLowerCase();
  for (const [key, color] of Object.entries(genreColors)) {
    if (lower.includes(key)) return color;
  }

  // Default: hash the genre name to a consistent color
  let hash = 0;
  for (let i = 0; i < genre.length; i++) {
    hash = genre.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = Object.values(COLORS.holographic);
  return colors[Math.abs(hash) % colors.length];
}
