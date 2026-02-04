"use client"

interface AudioFeatureBarProps {
  label: string
  value: number
  color: string
  icon?: string
}

export function AudioFeatureBar({ label, value, color, icon }: AudioFeatureBarProps) {
  const fillHeight = Math.max(8, value)

  return (
    <div className="group relative">
      <div className="relative h-16 w-full rounded-xl bg-[#030303] border border-white/[0.03] overflow-hidden">
        <div className="absolute inset-[3px] rounded-lg overflow-hidden bg-[#0a0a0a]">
          <div
            className="absolute bottom-0 left-0 right-0 transition-all duration-700 ease-out"
            style={{
              height: `${fillHeight}%`,
              background: `linear-gradient(to top, ${color}15, ${color}35 40%, ${color}50 80%, ${color}70)`,
              boxShadow: `0 0 20px ${color}30, inset 0 0 15px ${color}20`,
            }}
          >
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
                boxShadow: `0 0 8px ${color}80`,
              }}
            />
            <div className="absolute inset-0 opacity-30">
              <div
                className="absolute w-1 h-1 rounded-full animate-pulse"
                style={{ backgroundColor: color, left: '20%', bottom: '30%', animationDelay: '0s' }}
              />
              <div
                className="absolute w-0.5 h-0.5 rounded-full animate-pulse"
                style={{ backgroundColor: color, left: '60%', bottom: '50%', animationDelay: '0.5s' }}
              />
              <div
                className="absolute w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ backgroundColor: color, left: '40%', bottom: '15%', animationDelay: '1s' }}
              />
            </div>
          </div>

          <div className="absolute inset-0 flex flex-col justify-between py-1 px-0.5 pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center">
                <div className="w-1 h-[1px] bg-white/10" />
              </div>
            ))}
          </div>

          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 bg-black/70 backdrop-blur-sm">
            <span
              className="text-lg font-bold tabular-nums tracking-tight"
              style={{ color, textShadow: `0 0 20px ${color}` }}
            >
              {value}
            </span>
          </div>
        </div>

        <div className="absolute top-[3px] left-[3px] right-[60%] bottom-[60%] rounded-tl-lg bg-gradient-to-br from-white/[0.03] to-transparent pointer-events-none" />
      </div>

      <div className="flex items-center justify-center gap-1.5 mt-2">
        {icon && (
          <span
            className="text-[9px] transition-all duration-300 group-hover:scale-110"
            style={{ color: `${color}60` }}
          >
            {icon}
          </span>
        )}
        <span
          className="text-[9px] uppercase tracking-[0.15em] transition-colors duration-300"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          {label}
        </span>
      </div>
    </div>
  )
}
