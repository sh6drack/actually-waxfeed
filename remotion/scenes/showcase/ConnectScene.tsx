import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../../lib/colors";
import { SAMPLE_PROFILES, COMPATIBILITY_PAIR } from "../../data/sampleProfiles";

interface ConnectSceneProps {
  width?: number;
  height?: number;
}

export function ConnectScene({ width = 1920, height = 1080 }: ConnectSceneProps) {
  const frame = useCurrentFrame();

  const user1 = COMPATIBILITY_PAIR.user1;
  const user2 = COMPATIBILITY_PAIR.user2;

  // Scene label
  const labelOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const labelFadeOut = interpolate(frame, [60, 80], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Left profile entrance
  const leftX = interpolate(frame, [20, 60], [-100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const leftOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Right profile entrance
  const rightX = interpolate(frame, [40, 80], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const rightOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Connection line drawing
  const lineProgress = interpolate(frame, [100, 160], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Compatibility meter
  const meterProgress = interpolate(frame, [140, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const displayScore = Math.round(COMPATIBILITY_PAIR.overallScore * meterProgress);

  // Match label
  const matchLabelOpacity = interpolate(frame, [200, 230], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Shared interests reveal
  const sharedOpacity = interpolate(frame, [220, 250], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Holographic gradient for connection
  const holoRotation = frame * 0.5;

  // Radar chart for each profile (simplified mini version)
  const genres1 = Object.entries(user1.genreVector);
  const genres2 = Object.entries(user2.genreVector);
  const radarSize = 120;

  function getMiniRadarPath(genres: [string, number][], progress: number = 1) {
    const count = genres.length;
    const angleStep = (Math.PI * 2) / count;
    const center = radarSize / 2;
    const maxRadius = (radarSize / 2) - 10;

    const points = genres.map(([_, value], i) => {
      const angle = i * angleStep - Math.PI / 2;
      const radius = maxRadius * value * progress;
      return {
        x: center + Math.cos(angle) * radius,
        y: center + Math.sin(angle) * radius,
      };
    });

    return points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ") + " Z";
  }

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
          04 / Connect
        </span>
      </div>

      {/* Profiles container */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 200,
        }}
      >
        {/* Left profile */}
        <div
          style={{
            opacity: leftOpacity,
            transform: `translateX(${leftX}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Mini radar */}
          <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
            <defs>
              <linearGradient id="leftRadarGradient" gradientTransform={`rotate(${holoRotation})`}>
                <stop offset="0%" stopColor={COLORS.holographic.pink} />
                <stop offset="50%" stopColor={COLORS.holographic.lavender} />
                <stop offset="100%" stopColor={COLORS.holographic.pink} />
              </linearGradient>
            </defs>
            {/* Grid */}
            <circle cx={radarSize/2} cy={radarSize/2} r={(radarSize/2)-10} fill="none" stroke={COLORS.gray[800]} strokeWidth="1" />
            {/* Data */}
            <path
              d={getMiniRadarPath(genres1)}
              fill="url(#leftRadarGradient)"
              fillOpacity="0.3"
              stroke="url(#leftRadarGradient)"
              strokeWidth="2"
            />
          </svg>

          {/* Username */}
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.white,
                margin: 0,
              }}
            >
              @{user1.username}
            </h3>
            <p
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: COLORS.gray[500],
                margin: 0,
                marginTop: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {user1.archetype.name}
            </p>
          </div>
        </div>

        {/* Connection visualization */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Connection line */}
          <svg width="200" height="40" viewBox="0 0 200 40">
            <defs>
              <linearGradient id="connectionGradient" gradientTransform={`rotate(${holoRotation})`}>
                <stop offset="0%" stopColor={COLORS.holographic.pink} />
                <stop offset="50%" stopColor={COLORS.holographic.sky} />
                <stop offset="100%" stopColor={COLORS.holographic.mint} />
              </linearGradient>
            </defs>
            <line
              x1="0"
              y1="20"
              x2={200 * lineProgress}
              y2="20"
              stroke="url(#connectionGradient)"
              strokeWidth="2"
              strokeDasharray="8 4"
            />
          </svg>

          {/* Compatibility score */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 72,
                fontWeight: 700,
                color: COLORS.white,
                lineHeight: 1,
              }}
            >
              {displayScore}%
            </span>
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.gray[400],
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginTop: 8,
                opacity: matchLabelOpacity,
              }}
            >
              Taste Match
            </span>
          </div>

          {/* Shared genres */}
          <div
            style={{
              display: "flex",
              gap: 8,
              opacity: sharedOpacity,
              flexWrap: "wrap",
              justifyContent: "center",
              maxWidth: 300,
            }}
          >
            {COMPATIBILITY_PAIR.sharedGenres.slice(0, 4).map((genre) => (
              <span
                key={genre}
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: COLORS.white,
                  padding: "4px 10px",
                  border: `1px solid ${COLORS.gray[600]}`,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                {genre}
              </span>
            ))}
          </div>
        </div>

        {/* Right profile */}
        <div
          style={{
            opacity: rightOpacity,
            transform: `translateX(${rightX}px)`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 20,
          }}
        >
          {/* Mini radar */}
          <svg width={radarSize} height={radarSize} viewBox={`0 0 ${radarSize} ${radarSize}`}>
            <defs>
              <linearGradient id="rightRadarGradient" gradientTransform={`rotate(${holoRotation + 60})`}>
                <stop offset="0%" stopColor={COLORS.holographic.sky} />
                <stop offset="50%" stopColor={COLORS.holographic.mint} />
                <stop offset="100%" stopColor={COLORS.holographic.sky} />
              </linearGradient>
            </defs>
            {/* Grid */}
            <circle cx={radarSize/2} cy={radarSize/2} r={(radarSize/2)-10} fill="none" stroke={COLORS.gray[800]} strokeWidth="1" />
            {/* Data */}
            <path
              d={getMiniRadarPath(genres2)}
              fill="url(#rightRadarGradient)"
              fillOpacity="0.3"
              stroke="url(#rightRadarGradient)"
              strokeWidth="2"
            />
          </svg>

          {/* Username */}
          <div style={{ textAlign: "center" }}>
            <h3
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 24,
                fontWeight: 700,
                color: COLORS.white,
                margin: 0,
              }}
            >
              @{user2.username}
            </h3>
            <p
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: COLORS.gray[500],
                margin: 0,
                marginTop: 6,
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              {user2.archetype.name}
            </p>
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
          opacity: interpolate(frame, [260, 290], [0, 1], {
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
          Find people who hear music like you do
        </p>
      </div>
    </AbsoluteFill>
  );
}
