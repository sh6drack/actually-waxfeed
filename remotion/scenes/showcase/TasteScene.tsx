import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../../lib/colors";
import { SAMPLE_PROFILES } from "../../data/sampleProfiles";

interface TasteSceneProps {
  width?: number;
  height?: number;
}

export function TasteScene({ width = 1920, height = 1080 }: TasteSceneProps) {
  const frame = useCurrentFrame();
  const profile = SAMPLE_PROFILES[0]; // vinylhead

  // Scene label
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelFadeOut = interpolate(frame, [60, 80], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Card entrance
  const cardScale = interpolate(frame, [20, 60], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const cardOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Radar chart animation
  const radarProgress = interpolate(frame, [80, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Genre values from profile
  const genres = Object.entries(profile.genreVector);
  const genreCount = genres.length;
  const angleStep = (Math.PI * 2) / genreCount;
  const radarSize = 200;
  const radarCenter = { x: radarSize / 2, y: radarSize / 2 };

  // Calculate radar points
  const radarPoints = genres.map(([genre, value], i) => {
    const angle = i * angleStep - Math.PI / 2;
    const animatedValue = value * radarProgress;
    const radius = (radarSize / 2 - 20) * animatedValue;
    return {
      genre,
      value,
      animatedValue,
      x: radarCenter.x + Math.cos(angle) * radius,
      y: radarCenter.y + Math.sin(angle) * radius,
    };
  });

  // Polygon path
  const polygonPath = radarPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ") + " Z";

  // Archetype reveal
  const archetypeOpacity = interpolate(frame, [200, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const archetypeScale = interpolate(frame, [200, 230], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Stats reveal
  const statsOpacity = interpolate(frame, [250, 280], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Top genres list reveal (staggered)
  const genreListOpacities = profile.topGenres.map((_, i) => {
    const delay = 180 + i * 15;
    return interpolate(frame, [delay, delay + 20], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });

  // Holographic gradient rotation for radar fill
  const holoRotation = frame * 0.3;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Scene label */}
      <div
        style={{
          position: "absolute",
          top: 60,
          left: 80,
          opacity: labelOpacity * labelFadeOut,
        }}
      >
        <span
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 12,
            fontWeight: 600,
            color: COLORS.gray[500],
            letterSpacing: "0.15em",
            textTransform: "uppercase",
          }}
        >
          02 / Your Taste
        </span>
      </div>

      {/* TasteID Card */}
      <div
        style={{
          display: "flex",
          gap: 80,
          alignItems: "center",
          opacity: cardOpacity,
          transform: `scale(${cardScale})`,
        }}
      >
        {/* Left side - Radar chart */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
            <defs>
              <linearGradient
                id="radarHoloGradient"
                gradientTransform={`rotate(${holoRotation})`}
              >
                <stop offset="0%" stopColor={COLORS.holographic.pink} />
                <stop offset="25%" stopColor={COLORS.holographic.sky} />
                <stop offset="50%" stopColor={COLORS.holographic.lavender} />
                <stop offset="75%" stopColor={COLORS.holographic.mint} />
                <stop offset="100%" stopColor={COLORS.holographic.pink} />
              </linearGradient>
            </defs>

            {/* Background grid lines */}
            {[0.25, 0.5, 0.75, 1].map((scale, i) => (
              <polygon
                key={i}
                points={genres.map(([_, __], j) => {
                  const angle = j * angleStep - Math.PI / 2;
                  const radius = (radarSize / 2 - 20) * scale;
                  return `${radarCenter.x + Math.cos(angle) * radius},${radarCenter.y + Math.sin(angle) * radius}`;
                }).join(" ")}
                fill="none"
                stroke={COLORS.gray[800]}
                strokeWidth="1"
              />
            ))}

            {/* Axis lines */}
            {genres.map(([_, __], i) => {
              const angle = i * angleStep - Math.PI / 2;
              const endX = radarCenter.x + Math.cos(angle) * (radarSize / 2 - 20);
              const endY = radarCenter.y + Math.sin(angle) * (radarSize / 2 - 20);
              return (
                <line
                  key={i}
                  x1={radarCenter.x}
                  y1={radarCenter.y}
                  x2={endX}
                  y2={endY}
                  stroke={COLORS.gray[800]}
                  strokeWidth="1"
                />
              );
            })}

            {/* Data polygon */}
            <path
              d={polygonPath}
              fill="url(#radarHoloGradient)"
              fillOpacity="0.3"
              stroke="url(#radarHoloGradient)"
              strokeWidth="2"
            />

            {/* Data points */}
            {radarPoints.map((point, i) => (
              <circle
                key={i}
                cx={point.x}
                cy={point.y}
                r={4}
                fill={COLORS.white}
              />
            ))}
          </svg>

          {/* Genre labels around radar */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", maxWidth: 300 }}>
            {genres.map(([genre], i) => (
              <span
                key={genre}
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: COLORS.gray[400],
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  opacity: radarProgress,
                }}
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Right side - Profile info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 32,
          }}
        >
          {/* Username */}
          <div>
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.gray[500],
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              TasteID
            </span>
            <h2
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 48,
                fontWeight: 700,
                color: COLORS.white,
                letterSpacing: "-0.02em",
                margin: 0,
                marginTop: 8,
              }}
            >
              @{profile.username}
            </h2>
          </div>

          {/* Archetype badge */}
          <div
            style={{
              opacity: archetypeOpacity,
              transform: `scale(${archetypeScale})`,
            }}
          >
            <div
              style={{
                display: "inline-block",
                padding: "12px 24px",
                border: `2px solid ${COLORS.white}`,
                backgroundColor: COLORS.black,
              }}
            >
              <span
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 18,
                  fontWeight: 700,
                  color: COLORS.white,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {profile.archetype.name}
              </span>
            </div>
          </div>

          {/* Top Genres */}
          <div style={{ opacity: statsOpacity }}>
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: COLORS.gray[500],
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Top Genres
            </span>
            <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap", maxWidth: 350 }}>
              {profile.topGenres.slice(0, 5).map((genre, i) => (
                <span
                  key={genre}
                  style={{
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontSize: 14,
                    fontWeight: 500,
                    color: COLORS.white,
                    padding: "6px 12px",
                    backgroundColor: COLORS.gray[900],
                    border: `1px solid ${COLORS.gray[700]}`,
                    opacity: genreListOpacities[i],
                  }}
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>

          {/* Stats row */}
          <div
            style={{
              display: "flex",
              gap: 40,
              opacity: statsOpacity,
            }}
          >
            <div>
              <span
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: COLORS.white,
                }}
              >
                {profile.reviewCount}
              </span>
              <span
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: COLORS.gray[500],
                  display: "block",
                  marginTop: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Reviews
              </span>
            </div>
            <div>
              <span
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 32,
                  fontWeight: 700,
                  color: COLORS.white,
                }}
              >
                {profile.averageRating}
              </span>
              <span
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: COLORS.gray[500],
                  display: "block",
                  marginTop: 4,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Avg Rating
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Caption */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          left: "50%",
          transform: "translateX(-50%)",
          opacity: interpolate(frame, [280, 310], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 20,
            fontWeight: 400,
            color: COLORS.gray[400],
            textAlign: "center",
          }}
        >
          Your unique music fingerprint
        </p>
      </div>
    </AbsoluteFill>
  );
}
