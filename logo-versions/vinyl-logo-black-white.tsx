// Black and white SVG vinyl record
export function VinylLogoBlackWhite() {
  return (
    <svg viewBox="0 0 100 100" width="48" height="48" className="w-12 h-12">
      {/* Outer vinyl ring */}
      <circle cx="50" cy="50" r="48" fill="black" />
      {/* Label */}
      <circle cx="50" cy="50" r="20" fill="white" />
    </svg>
  )
}
