import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface Props {
  width?: number;
  height?: number;
}

const GENRES = [
  { name: "Hip-Hop", value: 0.9, angle: 0 },
  { name: "R&B", value: 0.85, angle: 51 },
  { name: "Pop", value: 0.6, angle: 102 },
  { name: "Rock", value: 0.4, angle: 153 },
  { name: "Electronic", value: 0.7, angle: 204 },
  { name: "Jazz", value: 0.5, angle: 255 },
  { name: "Soul", value: 0.75, angle: 306 },
];

export const MapScene: React.FC<Props> = ({ width = 1920, height = 1080 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = height > width;

  // Radar chart builds up
  const radarProgress = interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" });

  // Archetype reveal
  const showArchetype = frame > 70;
  const archetypeOpacity = interpolate(frame, [70, 85], [0, 1], { extrapolateRight: "clamp" });
  const archetypeScale = spring({ frame: frame - 70, fps, from: 0.5, to: 1, durationInFrames: 20 });

  // "your taste. mapped." text
  const textOpacity = interpolate(frame, [90, 100], [0, 1], { extrapolateRight: "clamp" });

  const centerX = 0;
  const centerY = isVertical ? -80 : -40;
  const radius = isVertical ? 140 : 120;

  // Generate radar chart path
  const generatePath = (progress: number) => {
    const points = GENRES.map((genre, i) => {
      const angleRad = (genre.angle - 90) * (Math.PI / 180);
      const r = radius * genre.value * progress;
      const x = centerX + Math.cos(angleRad) * r;
      const y = centerY + Math.sin(angleRad) * r;
      return `${i === 0 ? "M" : "L"} ${x} ${y}`;
    });
    return points.join(" ") + " Z";
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Radar Chart */}
      <svg
        width={isVertical ? 400 : 350}
        height={isVertical ? 400 : 350}
        viewBox="-200 -200 400 400"
        style={{ marginTop: isVertical ? -100 : -60 }}
      >
        {/* Grid circles */}
        {[0.25, 0.5, 0.75, 1].map((r) => (
          <circle
            key={r}
            cx={centerX}
            cy={centerY}
            r={radius * r}
            fill="none"
            stroke="#222"
            strokeWidth={1}
          />
        ))}

        {/* Axis lines */}
        {GENRES.map((genre) => {
          const angleRad = (genre.angle - 90) * (Math.PI / 180);
          const x2 = centerX + Math.cos(angleRad) * radius;
          const y2 = centerY + Math.sin(angleRad) * radius;
          return (
            <line
              key={genre.name}
              x1={centerX}
              y1={centerY}
              x2={x2}
              y2={y2}
              stroke="#333"
              strokeWidth={1}
            />
          );
        })}

        {/* Data polygon */}
        <path
          d={generatePath(radarProgress)}
          fill="rgba(255, 215, 0, 0.2)"
          stroke="#ffd700"
          strokeWidth={2}
        />

        {/* Genre labels */}
        {GENRES.map((genre) => {
          const angleRad = (genre.angle - 90) * (Math.PI / 180);
          const labelRadius = radius + 30;
          const x = centerX + Math.cos(angleRad) * labelRadius;
          const y = centerY + Math.sin(angleRad) * labelRadius;
          return (
            <text
              key={genre.name}
              x={x}
              y={y}
              fill="#888"
              fontSize={isVertical ? 14 : 12}
              fontFamily="system-ui"
              textAnchor="middle"
              dominantBaseline="middle"
              opacity={interpolate(frame, [20, 40], [0, 1], { extrapolateRight: "clamp" })}
            >
              {genre.name}
            </text>
          );
        })}
      </svg>

      {/* Archetype reveal */}
      {showArchetype && (
        <div
          style={{
            position: "absolute",
            top: isVertical ? "65%" : "68%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 8,
            opacity: archetypeOpacity,
            transform: `scale(${archetypeScale})`,
          }}
        >
          <span
            style={{
              color: "#666",
              fontSize: isVertical ? 14 : 12,
              fontFamily: "system-ui",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            Your archetype
          </span>
          <h2
            style={{
              color: "#ffd700",
              fontSize: isVertical ? 42 : 32,
              fontFamily: "system-ui",
              fontWeight: 900,
              margin: 0,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            THE CURATOR
          </h2>
        </div>
      )}

      {/* "your taste. mapped." text */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? "8%" : "10%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: textOpacity,
        }}
      >
        <h3
          style={{
            color: "#fff",
            fontSize: isVertical ? 28 : 22,
            fontFamily: "system-ui",
            fontWeight: 500,
            margin: 0,
          }}
        >
          your taste. mapped.
        </h3>
      </div>
    </AbsoluteFill>
  );
};
