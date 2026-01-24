import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../lib/colors";
import { AnimatedRadarChart } from "../components/AnimatedRadarChart";
import { SAMPLE_PROFILES } from "../data/sampleProfiles";

// Scene 4: THE FINGERPRINT
// TASTEID radar chart pulses with holographic fill. "Your unique music fingerprint"

interface FingerprintSceneProps {
  width?: number;
  height?: number;
}

export function FingerprintScene({
  width = 1920,
  height = 1080,
}: FingerprintSceneProps) {
  const frame = useCurrentFrame();

  // Use first profile's genre vector
  const profile = SAMPLE_PROFILES[0];
  const genreVector = profile.genreVector;

  // Chart reveal animation
  const chartScale = interpolate(frame, [0, 60], [0.8, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // "Introducing" text
  const introOpacity = interpolate(frame, [20, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const introY = interpolate(frame, [20, 60], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // "TASTEID" title
  const titleOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const titleY = interpolate(frame, [40, 80], [30, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Subtitle
  const subtitleOpacity = interpolate(frame, [80, 110], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const subtitleY = interpolate(frame, [80, 120], [20, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Archetype badge
  const badgeOpacity = interpolate(frame, [150, 180], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const badgeScale = interpolate(frame, [150, 190], [0.9, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Stats reveal
  const statsOpacity = interpolate(frame, [200, 240], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* Introducing text */}
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 18,
            fontWeight: 500,
            color: COLORS.gray[500],
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            opacity: introOpacity,
            transform: `translateY(${introY}px)`,
            margin: 0,
          }}
        >
          Introducing
        </p>

        {/* TASTEID title */}
        <h1
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 96,
            fontWeight: 700,
            color: COLORS.white,
            letterSpacing: "-0.03em",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
          }}
        >
          TASTEID
        </h1>

        {/* Subtitle */}
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 24,
            fontWeight: 400,
            color: COLORS.gray[500],
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            margin: 0,
            marginBottom: 20,
          }}
        >
          Your unique music fingerprint
        </p>

        {/* Radar chart */}
        <div
          style={{
            transform: `scale(${chartScale})`,
          }}
        >
          <AnimatedRadarChart
            genres={genreVector}
            size={350}
            showLabels={true}
            pulseEnabled={true}
            holographicFill={true}
            revealDelay={60}
            revealDuration={80}
          />
        </div>

        {/* Archetype badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 30,
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
          }}
        >
          <div
            style={{
              padding: "10px 20px",
              border: `2px solid ${COLORS.white}`,
              backgroundColor: COLORS.black,
            }}
          >
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 14,
                fontWeight: 600,
                color: COLORS.white,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {profile.archetype.name}
            </span>
          </div>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 60,
            marginTop: 40,
            opacity: statsOpacity,
          }}
        >
          <StatItem
            label="ADVENTURENESS"
            value={`${Math.round(profile.adventurenessScore * 100)}%`}
          />
          <StatItem label="POLARITY" value={profile.polarityScore.toFixed(2)} />
          <StatItem label="RATING STYLE" value={profile.ratingSkew.toUpperCase()} />
          <StatItem label="AVG RATING" value={profile.averageRating.toFixed(1)} />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function StatItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <p
        style={{
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          fontSize: 10,
          fontWeight: 500,
          color: COLORS.gray[600],
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          margin: 0,
          marginBottom: 6,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          fontSize: 24,
          fontWeight: 600,
          color: COLORS.white,
          margin: 0,
        }}
      >
        {value}
      </p>
    </div>
  );
}
