import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS, getCompatibilityColor } from "../lib/colors";
import { AnimatedRadarChart } from "../components/AnimatedRadarChart";
import { COMPATIBILITY_PAIR, SAMPLE_PROFILES } from "../data/sampleProfiles";

// Scene 5: THE MATCH
// Two radar charts approach, connection lines draw, compatibility reveals

interface MatchSceneProps {
  width?: number;
  height?: number;
}

export function MatchScene({ width = 1920, height = 1080 }: MatchSceneProps) {
  const frame = useCurrentFrame();

  const user1 = COMPATIBILITY_PAIR.user1;
  const user2 = COMPATIBILITY_PAIR.user2;
  const score = COMPATIBILITY_PAIR.overallScore;

  // Phase 1: Charts appear on opposite sides (frames 0-60)
  const chart1Opacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const chart2Opacity = interpolate(frame, [20, 60], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Charts move toward center (frames 60-150)
  const approachProgress = interpolate(frame, [60, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const chart1X = interpolate(approachProgress, [0, 1], [-300, -180]);
  const chart2X = interpolate(approachProgress, [0, 1], [300, 180]);

  // Phase 3: Connection lines draw (frames 150-200)
  const lineProgress = interpolate(frame, [150, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Phase 4: Score counts up (frames 180-250)
  const scoreProgress = interpolate(frame, [180, 250], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  const displayScore = Math.round(score * scoreProgress);

  // Phase 5: Match type reveals (frames 260-300)
  const matchTypeOpacity = interpolate(frame, [260, 290], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 6: Breakdown bars (frames 300-360)
  const breakdownOpacity = interpolate(frame, [300, 330], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Compatibility ring animation
  const ringProgress = interpolate(frame, [180, 260], [0, score / 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  const circumference = 2 * Math.PI * 80;
  const strokeDashoffset = circumference - ringProgress * circumference;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* User 1 chart */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${chart1X}px), -50%)`,
          opacity: chart1Opacity,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.gray[500],
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            YOU
          </p>
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: COLORS.white,
              margin: "8px 0",
            }}
          >
            @{user1.username}
          </p>
        </div>
        <AnimatedRadarChart
          genres={user1.genreVector}
          size={250}
          showLabels={false}
          pulseEnabled={true}
          holographicFill={true}
          revealDelay={0}
          revealDuration={40}
        />
      </div>

      {/* User 2 chart */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(calc(-50% + ${chart2X}px), -50%)`,
          opacity: chart2Opacity,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: COLORS.gray[500],
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            THEM
          </p>
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 18,
              fontWeight: 600,
              color: COLORS.white,
              margin: "8px 0",
            }}
          >
            @{user2.username}
          </p>
        </div>
        <AnimatedRadarChart
          genres={user2.genreVector}
          size={250}
          showLabels={false}
          pulseEnabled={true}
          holographicFill={true}
          revealDelay={20}
          revealDuration={40}
        />
      </div>

      {/* Connection lines */}
      {lineProgress > 0 && (
        <svg
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          {/* Draw connecting lines between charts */}
          {[0, 1, 2].map((i) => {
            const y = height / 2 + (i - 1) * 60;
            const x1 = width / 2 - 60;
            const x2 = width / 2 + 60;
            const lineLength = x2 - x1;
            const dashLength = lineLength * lineProgress;

            return (
              <line
                key={i}
                x1={x1}
                y1={y}
                x2={x2}
                y2={y}
                stroke={COLORS.white}
                strokeWidth="1"
                strokeDasharray={`${dashLength} ${lineLength}`}
                opacity={0.3}
              />
            );
          })}
        </svg>
      )}

      {/* Center compatibility meter */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Circular progress ring */}
        <div style={{ position: "relative", width: 180, height: 180 }}>
          <svg
            width="180"
            height="180"
            style={{ transform: "rotate(-90deg)" }}
          >
            {/* Background ring */}
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke={COLORS.gray[800]}
              strokeWidth="8"
            />
            {/* Progress ring */}
            <circle
              cx="90"
              cy="90"
              r="80"
              fill="none"
              stroke={getCompatibilityColor(displayScore)}
              strokeWidth="8"
              strokeLinecap="butt"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          {/* Score number */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 56,
                fontWeight: 700,
                color: COLORS.white,
              }}
            >
              {displayScore}
            </span>
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 12,
                fontWeight: 500,
                color: COLORS.gray[500],
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              MATCH
            </span>
          </div>
        </div>

        {/* Match type label */}
        <div
          style={{
            marginTop: 20,
            padding: "8px 16px",
            border: `2px solid ${getCompatibilityColor(score)}`,
            backgroundColor: COLORS.black,
            opacity: matchTypeOpacity,
          }}
        >
          <span
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 14,
              fontWeight: 700,
              color: getCompatibilityColor(score),
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            TASTE TWIN
          </span>
        </div>

        {/* Breakdown bars */}
        <div
          style={{
            marginTop: 40,
            display: "flex",
            gap: 40,
            opacity: breakdownOpacity,
          }}
        >
          <BreakdownBar
            label="GENRE"
            value={COMPATIBILITY_PAIR.genreOverlap}
            delay={300}
          />
          <BreakdownBar
            label="ARTIST"
            value={COMPATIBILITY_PAIR.artistOverlap}
            delay={320}
          />
          <BreakdownBar
            label="RATING"
            value={COMPATIBILITY_PAIR.ratingAlignment}
            delay={340}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
}

function BreakdownBar({
  label,
  value,
  delay,
}: {
  label: string;
  value: number;
  delay: number;
}) {
  const frame = useCurrentFrame();

  const barProgress = interpolate(frame, [delay, delay + 40], [0, value / 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  return (
    <div style={{ textAlign: "center", width: 80 }}>
      <p
        style={{
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          fontSize: 10,
          fontWeight: 500,
          color: COLORS.gray[600],
          letterSpacing: "0.1em",
          margin: 0,
          marginBottom: 8,
        }}
      >
        {label}
      </p>
      <div
        style={{
          width: "100%",
          height: 4,
          backgroundColor: COLORS.gray[800],
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${barProgress * 100}%`,
            backgroundColor: COLORS.white,
          }}
        />
      </div>
      <p
        style={{
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          fontSize: 16,
          fontWeight: 600,
          color: COLORS.white,
          margin: "8px 0 0",
        }}
      >
        {Math.round(barProgress * 100)}%
      </p>
    </div>
  );
}
