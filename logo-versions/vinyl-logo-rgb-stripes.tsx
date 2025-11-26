// Square vinyl with RGB vertical stripes
export function VinylLogoRGBStripes() {
  return (
    <svg viewBox="0 0 100 100" width="48" height="48" className="w-12 h-12">
      <rect x="0" y="0" width="33" height="100" fill="#FF0000" />
      <rect x="33" y="0" width="34" height="100" fill="#00FF00" />
      <rect x="67" y="0" width="33" height="100" fill="#0000FF" />
      {/* Center label */}
      <rect x="35" y="35" width="30" height="30" fill="black" />
    </svg>
  )
}
