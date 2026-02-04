interface TrackWaveformProps {
  trackId: string
  isPlaying: boolean
  waveform?: number[] | null
}

export function TrackWaveform({ trackId, isPlaying, waveform }: TrackWaveformProps) {
  const bars = waveform && waveform.length === 40
    ? waveform
    : Array.from({ length: 40 }, (_, i) => {
        const hash = trackId.split('').reduce((a, c, idx) => a + c.charCodeAt(0) * (idx + 1 + i), 0)
        return 0.2 + (hash % 80) / 100
      })

  const hasRealWaveform = waveform && waveform.length === 40

  return (
    <div className="flex items-center gap-[1px] h-5 flex-1">
      {bars.map((height, i) => (
        <div
          key={i}
          className={`w-[1.5px] rounded-full transition-colors ${
            isPlaying
              ? 'bg-[#ffd700]'
              : hasRealWaveform
                ? 'bg-cyan-400/50'
                : 'bg-white/20'
          }`}
          style={{
            height: `${height * 100}%`,
            opacity: isPlaying ? 1 : hasRealWaveform ? 0.7 : 0.4,
            animation: isPlaying ? `waveform 0.5s ease-in-out infinite ${i * 0.02}s` : 'none',
          }}
        />
      ))}
    </div>
  )
}
