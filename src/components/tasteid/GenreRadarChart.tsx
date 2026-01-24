"use client"

import { useMemo } from "react"

interface GenreRadarChartProps {
  genres: Record<string, number> // genre -> 0-1 value
  size?: number
  className?: string
  showLabels?: boolean
  accentColor?: string
}

export function GenreRadarChart({
  genres,
  size = 200,
  className = "",
  showLabels = true,
  accentColor = "#ffffff",
}: GenreRadarChartProps) {
  const entries = useMemo(() => {
    return Object.entries(genres)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6) // Max 6 for readability
  }, [genres])

  const numPoints = entries.length
  if (numPoints < 3) {
    return (
      <div
        className={`flex items-center justify-center text-muted-foreground ${className}`}
        style={{ width: size, height: size }}
      >
        Not enough data
      </div>
    )
  }

  const center = size / 2
  const maxRadius = (size / 2) * 0.75 // Leave room for labels

  // Calculate points for each data value
  const angleStep = (2 * Math.PI) / numPoints
  const dataPoints = entries.map(([genre, value], i) => {
    const angle = angleStep * i - Math.PI / 2 // Start from top
    const radius = value * maxRadius
    return {
      genre,
      value,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      labelX: center + (maxRadius + 20) * Math.cos(angle),
      labelY: center + (maxRadius + 20) * Math.sin(angle),
      axisX: center + maxRadius * Math.cos(angle),
      axisY: center + maxRadius * Math.sin(angle),
    }
  })

  // Create polygon path
  const polygonPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z"

  // Create axis lines
  const axisLines = dataPoints.map((p) => `M ${center} ${center} L ${p.axisX} ${p.axisY}`)

  // Create concentric rings (at 25%, 50%, 75%, 100%)
  const rings = [0.25, 0.5, 0.75, 1].map((scale) => {
    const ringPoints = Array.from({ length: numPoints }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2
      const radius = scale * maxRadius
      return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`
    })
    return ringPoints.join(" ")
  })

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="font-mono">
        {/* Background rings */}
        {rings.map((points, i) => (
          <polygon
            key={i}
            points={points}
            fill="none"
            className="stroke-border"
            strokeWidth="1"
            strokeDasharray={i < 3 ? "2,2" : "none"}
          />
        ))}

        {/* Axis lines */}
        {axisLines.map((d, i) => (
          <path key={i} d={d} className="stroke-border" strokeWidth="1" />
        ))}

        {/* Data polygon */}
        <path
          d={polygonPath}
          fill={accentColor}
          fillOpacity="0.15"
          stroke={accentColor}
          strokeWidth="2"
        />

        {/* Data points */}
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="4" fill={accentColor} />
        ))}

        {/* Labels */}
        {showLabels &&
          dataPoints.map((p, i) => {
            // Determine text anchor based on position
            let textAnchor: "start" | "middle" | "end" = "middle"
            if (p.labelX < center - 10) textAnchor = "end"
            if (p.labelX > center + 10) textAnchor = "start"

            return (
              <text
                key={i}
                x={p.labelX}
                y={p.labelY}
                textAnchor={textAnchor}
                dominantBaseline="middle"
                className="text-[10px] fill-foreground uppercase tracking-wider"
              >
                {formatGenreLabel(p.genre)}
              </text>
            )
          })}
      </svg>
    </div>
  )
}

function formatGenreLabel(genre: string): string {
  // Shorten long genre names
  const shortened: Record<string, string> = {
    "hip-hop": "HIP-HOP",
    "electronic": "ELECTRO",
    "alternative": "ALT",
    "experimental": "EXP",
    "contemporary": "CONTEMP",
  }
  const lower = genre.toLowerCase()
  return shortened[lower] || genre.substring(0, 8).toUpperCase()
}

export function GenreRadarChartSkeleton({ size = 200 }: { size?: number }) {
  return (
    <div
      className="bg-muted animate-pulse"
      style={{ width: size, height: size }}
    />
  )
}
