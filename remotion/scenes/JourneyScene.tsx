import { AbsoluteFill, interpolate, useCurrentFrame, Easing, spring, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";

// Scene: THE JOURNEY
// Visualizes taste evolution over time - how your musical identity grows
// Time-lapse of reviews, genre expansion, archetype evolution

interface JourneySceneProps {
  width?: number;
  height?: number;
}

// Sample journey milestones
const JOURNEY_MILESTONES = [
  { month: "JAN", reviews: 5, genres: 2, archetype: null, color: COLORS.gray[600] },
  { month: "FEB", reviews: 15, genres: 4, archetype: null, color: COLORS.gray[500] },
  { month: "MAR", reviews: 25, genres: 6, archetype: "Hip-Hop Head", color: "#00ff88" },
  { month: "APR", reviews: 40, genres: 8, archetype: "Hip-Hop Head", color: "#00ff88" },
  { month: "MAY", reviews: 60, genres: 10, archetype: "Genre Fluid", color: "#c44dff" },
  { month: "JUN", reviews: 85, genres: 12, archetype: "Genre Fluid", color: "#c44dff" },
];

// Genre discovery timeline
const GENRE_DISCOVERIES = [
  { name: "Hip-Hop", frame: 60, color: "#ff6b6b" },
  { name: "R&B", frame: 90, color: "#4ecdc4" },
  { name: "Jazz", frame: 130, color: "#ffe66d" },
  { name: "Soul", frame: 160, color: "#c44dff" },
  { name: "Electronic", frame: 200, color: "#45b7d1" },
  { name: "Indie", frame: 240, color: "#ff9f43" },
];

export function JourneyScene({ width = 1920, height = 1080 }: JourneySceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Phase 1: Title (frames 0-50)
  const titleOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Timeline reveals (frames 40-200)
  const timelineProgress = interpolate(frame, [40, 200], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Phase 3: Stats count up (frames 150-280)
  const statsProgress = interpolate(frame, [150, 280], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Phase 4: Archetype transformation (frames 280-360)
  const transformProgress = interpolate(frame, [280, 360], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Current milestone based on progress
  const currentMilestoneIndex = Math.floor(timelineProgress * (JOURNEY_MILESTONES.length - 1));
  const currentMilestone = JOURNEY_MILESTONES[currentMilestoneIndex];

  // Animated values
  const displayReviews = Math.round(85 * statsProgress);
  const displayGenres = Math.round(12 * statsProgress);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Title */}
      <div
        style={{
          position: "absolute",
          top: 50,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: titleOpacity,
        }}
      >
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 12,
            fontWeight: 500,
            color: COLORS.gray[500],
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          YOUR TASTE EVOLUTION
        </p>
        <h2
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.white,
            margin: "12px 0",
            letterSpacing: "-0.02em",
          }}
        >
          The Journey
        </h2>
      </div>

      {/* Main timeline */}
      <div
        style={{
          position: "absolute",
          left: "10%",
          right: "10%",
          top: "40%",
        }}
      >
        {/* Timeline base line */}
        <div
          style={{
            position: "relative",
            height: 4,
            backgroundColor: COLORS.gray[800],
            borderRadius: 2,
          }}
        >
          {/* Progress fill */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              height: "100%",
              width: `${timelineProgress * 100}%`,
              background: `linear-gradient(90deg, ${COLORS.gray[600]}, ${currentMilestone?.color || COLORS.white})`,
              borderRadius: 2,
            }}
          />

          {/* Milestone markers */}
          {JOURNEY_MILESTONES.map((milestone, i) => {
            const position = (i / (JOURNEY_MILESTONES.length - 1)) * 100;
            const isReached = position / 100 <= timelineProgress;
            const isActive = i === currentMilestoneIndex;

            return (
              <div
                key={milestone.month}
                style={{
                  position: "absolute",
                  left: `${position}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              >
                {/* Marker dot */}
                <div
                  style={{
                    width: isActive ? 20 : 12,
                    height: isActive ? 20 : 12,
                    borderRadius: "50%",
                    backgroundColor: isReached ? milestone.color : COLORS.gray[700],
                    border: `2px solid ${isReached ? milestone.color : COLORS.gray[600]}`,
                    boxShadow: isActive ? `0 0 20px ${milestone.color}80` : "none",
                    transition: "all 0.2s ease-out",
                  }}
                />

                {/* Month label */}
                <p
                  style={{
                    position: "absolute",
                    top: -30,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontSize: 10,
                    fontWeight: 600,
                    color: isReached ? COLORS.white : COLORS.gray[600],
                    letterSpacing: "0.1em",
                    whiteSpace: "nowrap",
                    margin: 0,
                  }}
                >
                  {milestone.month}
                </p>

                {/* Reviews count */}
                <p
                  style={{
                    position: "absolute",
                    top: 24,
                    left: "50%",
                    transform: "translateX(-50%)",
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontSize: 12,
                    fontWeight: 500,
                    color: isReached ? COLORS.gray[400] : COLORS.gray[700],
                    whiteSpace: "nowrap",
                    margin: 0,
                  }}
                >
                  {isReached ? `${milestone.reviews} reviews` : ""}
                </p>

                {/* Archetype reveal */}
                {milestone.archetype && isReached && (
                  <div
                    style={{
                      position: "absolute",
                      top: 50,
                      left: "50%",
                      transform: "translateX(-50%)",
                      padding: "4px 8px",
                      border: `1px solid ${milestone.color}`,
                      backgroundColor: `${milestone.color}20`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                        fontSize: 10,
                        fontWeight: 600,
                        color: milestone.color,
                        letterSpacing: "0.05em",
                        textTransform: "uppercase",
                      }}
                    >
                      {milestone.archetype}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Genre discovery bubbles */}
      <div
        style={{
          position: "absolute",
          bottom: "25%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 20,
          flexWrap: "wrap",
          padding: "0 10%",
        }}
      >
        {GENRE_DISCOVERIES.map((genre) => {
          const genreOpacity = interpolate(frame, [genre.frame, genre.frame + 30], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          const genreScale = spring({
            frame: frame - genre.frame,
            fps,
            config: { damping: 12, stiffness: 100 },
          });

          return (
            <div
              key={genre.name}
              style={{
                padding: "8px 16px",
                borderRadius: 20,
                border: `1px solid ${genre.color}`,
                backgroundColor: `${genre.color}20`,
                opacity: genreOpacity,
                transform: `scale(${genreScale})`,
              }}
            >
              <span
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: genre.color,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {genre.name}
              </span>
            </div>
          );
        })}
      </div>

      {/* Stats summary */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 60,
        }}
      >
        <StatBox
          label="REVIEWS"
          value={displayReviews}
          suffix=""
          color={COLORS.white}
          opacity={statsProgress}
        />
        <StatBox
          label="GENRES"
          value={displayGenres}
          suffix=""
          color="#c44dff"
          opacity={statsProgress}
        />
        <StatBox
          label="MONTHS"
          value={6}
          suffix=""
          color="#00ff88"
          opacity={statsProgress}
        />
      </div>

      {/* Archetype transformation animation */}
      {transformProgress > 0 && (
        <div
          style={{
            position: "absolute",
            right: "10%",
            top: "50%",
            transform: "translateY(-50%)",
            textAlign: "center",
            opacity: transformProgress,
          }}
        >
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 10,
              fontWeight: 500,
              color: COLORS.gray[500],
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              margin: 0,
            }}
          >
            CURRENT ARCHETYPE
          </p>
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 28,
              fontWeight: 700,
              color: "#c44dff",
              margin: "12px 0 0",
            }}
          >
            🌊 Genre Fluid
          </p>
        </div>
      )}
    </AbsoluteFill>
  );
}

function StatBox({
  label,
  value,
  suffix,
  color,
  opacity,
}: {
  label: string;
  value: number;
  suffix: string;
  color: string;
  opacity: number;
}) {
  return (
    <div style={{ textAlign: "center", opacity }}>
      <p
        style={{
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          fontSize: 10,
          fontWeight: 500,
          color: COLORS.gray[500],
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          margin: 0,
        }}
      >
        {label}
      </p>
      <p
        style={{
          fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
          fontSize: 48,
          fontWeight: 700,
          color,
          margin: "8px 0 0",
        }}
      >
        {value}
        {suffix}
      </p>
    </div>
  );
}
