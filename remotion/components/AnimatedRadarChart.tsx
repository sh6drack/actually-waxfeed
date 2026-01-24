import { interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS, getHolographicColor } from "../lib/colors";

interface AnimatedRadarChartProps {
  genres: Record<string, number>; // genre -> 0-1 value
  size?: number;
  showLabels?: boolean;
  pulseEnabled?: boolean;
  holographicFill?: boolean;
  revealDelay?: number; // frame to start revealing
  revealDuration?: number; // frames to fully reveal
}

export function AnimatedRadarChart({
  genres,
  size = 400,
  showLabels = true,
  pulseEnabled = true,
  holographicFill = true,
  revealDelay = 0,
  revealDuration = 60,
}: AnimatedRadarChartProps) {
  const frame = useCurrentFrame();

  const entries = Object.entries(genres)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const numPoints = entries.length;
  if (numPoints < 3) return null;

  const center = size / 2;
  const maxRadius = (size / 2) * 0.7;
  const angleStep = (2 * Math.PI) / numPoints;

  // Reveal animation
  const revealProgress = interpolate(
    frame - revealDelay,
    [0, revealDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  // Calculate animated data points
  const dataPoints = entries.map(([genre, value], i) => {
    const angle = angleStep * i - Math.PI / 2;

    // Pulsing effect
    const pulseOffset = pulseEnabled
      ? Math.sin((frame + i * 15) * 0.08) * 0.03
      : 0;

    const animatedValue = value * revealProgress * (1 + pulseOffset);
    const radius = animatedValue * maxRadius;

    return {
      genre,
      value: animatedValue,
      x: center + radius * Math.cos(angle),
      y: center + radius * Math.sin(angle),
      labelX: center + (maxRadius + 30) * Math.cos(angle),
      labelY: center + (maxRadius + 30) * Math.sin(angle),
      axisX: center + maxRadius * Math.cos(angle),
      axisY: center + maxRadius * Math.sin(angle),
      angle,
    };
  });

  // Create polygon path
  const polygonPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") +
    " Z";

  // Axis lines
  const axisLines = dataPoints.map(
    (p) => `M ${center} ${center} L ${p.axisX} ${p.axisY}`
  );

  // Concentric rings
  const rings = [0.25, 0.5, 0.75, 1].map((scale) => {
    const ringPoints = Array.from({ length: numPoints }, (_, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const radius = scale * maxRadius;
      return `${center + radius * Math.cos(angle)},${center + radius * Math.sin(angle)}`;
    });
    return ringPoints.join(" ");
  });

  // Holographic gradient rotation
  const gradientRotation = frame * 0.3;

  // Label opacity (staggered reveal)
  const labelOpacities = dataPoints.map((_, i) => {
    const labelDelay = revealDelay + revealDuration * 0.5 + i * 8;
    return interpolate(frame - labelDelay, [0, 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });

  return (
    <svg width={size} height={size}>
      <defs>
        {/* Holographic gradient */}
        <linearGradient
          id="holoFill"
          gradientTransform={`rotate(${gradientRotation} ${center} ${center})`}
        >
          <stop offset="0%" stopColor="#e4a8c8" stopOpacity="0.3" />
          <stop offset="25%" stopColor="#88c8d8" stopOpacity="0.25" />
          <stop offset="50%" stopColor="#b898d8" stopOpacity="0.3" />
          <stop offset="75%" stopColor="#98d8b8" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#e4a8c8" stopOpacity="0.3" />
        </linearGradient>

        {/* Glow filter */}
        <filter id="radarGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background rings */}
      {rings.map((points, i) => (
        <polygon
          key={i}
          points={points}
          fill="none"
          stroke={COLORS.gray[700]}
          strokeWidth="1"
          strokeDasharray={i < 3 ? "4,4" : "none"}
          opacity={revealProgress * 0.6}
        />
      ))}

      {/* Axis lines */}
      {axisLines.map((d, i) => (
        <path
          key={i}
          d={d}
          stroke={COLORS.gray[700]}
          strokeWidth="1"
          opacity={revealProgress * 0.5}
        />
      ))}

      {/* Data polygon with holographic fill */}
      <path
        d={polygonPath}
        fill={holographicFill ? "url(#holoFill)" : COLORS.white}
        fillOpacity={holographicFill ? 1 : 0.15}
        stroke={COLORS.white}
        strokeWidth="2"
        filter="url(#radarGlow)"
        opacity={revealProgress}
      />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={5}
          fill={COLORS.white}
          opacity={revealProgress}
        />
      ))}

      {/* Labels */}
      {showLabels &&
        dataPoints.map((p, i) => {
          let textAnchor: "start" | "middle" | "end" = "middle";
          if (p.labelX < center - 10) textAnchor = "end";
          if (p.labelX > center + 10) textAnchor = "start";

          return (
            <text
              key={i}
              x={p.labelX}
              y={p.labelY}
              textAnchor={textAnchor}
              dominantBaseline="middle"
              fill={COLORS.gray[400]}
              fontSize="12"
              fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
              fontWeight="500"
              letterSpacing="0.1em"
              opacity={labelOpacities[i]}
              style={{ textTransform: "uppercase" }}
            >
              {formatGenreLabel(p.genre)}
            </text>
          );
        })}
    </svg>
  );
}

function formatGenreLabel(genre: string): string {
  const shortened: Record<string, string> = {
    "hip-hop": "HIP-HOP",
    electronic: "ELECTRO",
    alternative: "ALT",
    experimental: "EXP",
    contemporary: "CONTEMP",
  };
  const lower = genre.toLowerCase();
  return shortened[lower] || genre.substring(0, 8).toUpperCase();
}
