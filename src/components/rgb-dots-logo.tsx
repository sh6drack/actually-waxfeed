export function RGBDotsLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`relative w-6 h-6 ${className}`}>
      {/* Tight overlapping cluster */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#ff3b30] opacity-90" />
      <div className="absolute bottom-0 left-0.5 w-2.5 h-2.5 rounded-full bg-[#30d158] opacity-90" />
      <div className="absolute bottom-0 right-0.5 w-2.5 h-2.5 rounded-full bg-[#007aff] opacity-90" />
    </div>
  )
}
