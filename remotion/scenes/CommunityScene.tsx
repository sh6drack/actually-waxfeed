import { AbsoluteFill, interpolate, useCurrentFrame, Easing, spring, useVideoConfig } from "remotion";
import { COLORS } from "../lib/colors";

// Scene: THE COMMUNITY
// Visualizes the network of taste connections
// Shows how users connect based on musical compatibility

interface CommunitySceneProps {
  width?: number;
  height?: number;
}

// Sample community members
const COMMUNITY_MEMBERS = [
  { id: "you", username: "you", x: 0.5, y: 0.5, archetype: "Hip-Hop Head", icon: "🎤", isYou: true, color: "#ffd700" },
  { id: "1", username: "jazzcat", x: 0.25, y: 0.35, archetype: "Jazz Explorer", icon: "🎷", compatibility: 85, color: "#00ff88" },
  { id: "2", username: "soulsister", x: 0.72, y: 0.3, archetype: "Soul Searcher", icon: "💜", compatibility: 78, color: "#c44dff" },
  { id: "3", username: "indiekid", x: 0.3, y: 0.68, archetype: "Indie Devotee", icon: "🎧", compatibility: 72, color: "#4ecdc4" },
  { id: "4", username: "beatmaker", x: 0.7, y: 0.65, archetype: "Electronic Pioneer", icon: "🎹", compatibility: 68, color: "#45b7d1" },
  { id: "5", username: "rockstar", x: 0.15, y: 0.5, archetype: "Rock Purist", icon: "🎸", compatibility: 55, color: "#ff9f43" },
  { id: "6", username: "popking", x: 0.85, y: 0.48, archetype: "Pop Connoisseur", icon: "⭐", compatibility: 52, color: "#ffe66d" },
];

// Connection types with colors
const CONNECTION_TYPES = {
  taste_twin: { name: "Taste Twin", color: "#ffd700", minScore: 80 },
  genre_buddy: { name: "Genre Buddy", color: "#00ff88", minScore: 60 },
  explorer: { name: "Explorer", color: "#c44dff", minScore: 40 },
};

function getConnectionType(compatibility: number) {
  if (compatibility >= 80) return CONNECTION_TYPES.taste_twin;
  if (compatibility >= 60) return CONNECTION_TYPES.genre_buddy;
  return CONNECTION_TYPES.explorer;
}

export function CommunityScene({ width = 1920, height = 1080 }: CommunitySceneProps) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const contentWidth = width * 0.8;
  const contentHeight = height * 0.6;
  const offsetX = width * 0.1;
  const offsetY = height * 0.2;

  // Phase 1: Title (frames 0-50)
  const titleOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Central "you" node appears (frames 30-80)
  const youOpacity = interpolate(frame, [30, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 3: Other nodes appear radially (frames 60-150)
  const nodesProgress = interpolate(frame, [60, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Phase 4: Connection lines draw (frames 120-220)
  const connectionProgress = interpolate(frame, [120, 220], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Phase 5: Stats appear (frames 220-280)
  const statsOpacity = interpolate(frame, [220, 270], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 6: Pulse animation (frames 280+)
  const pulsePhase = (frame - 280) * 0.03;
  const isPulsing = frame > 280;

  // Get "you" position
  const youMember = COMMUNITY_MEMBERS.find((m) => m.isYou)!;
  const youX = offsetX + youMember.x * contentWidth;
  const youY = offsetY + youMember.y * contentHeight;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
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
          TASTE CONNECTIONS
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
          Your Community
        </h2>
      </div>

      {/* Connection lines SVG */}
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
        {/* Draw connections from "you" to others */}
        {COMMUNITY_MEMBERS.filter((m) => !m.isYou).map((member, i) => {
          const memberX = offsetX + member.x * contentWidth;
          const memberY = offsetY + member.y * contentHeight;
          const connectionType = getConnectionType(member.compatibility || 0);

          // Stagger connection appearance
          const connectionDelay = i * 15;
          const lineProgress = interpolate(
            frame,
            [120 + connectionDelay, 200 + connectionDelay],
            [0, 1],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );

          const lineLength = Math.sqrt(
            Math.pow(memberX - youX, 2) + Math.pow(memberY - youY, 2)
          );
          const dashLength = lineLength * lineProgress;

          // Pulse effect
          const pulseWidth = isPulsing ? 2 + Math.sin(pulsePhase + i) * 0.5 : 2;

          return (
            <g key={member.id}>
              {/* Connection line */}
              <line
                x1={youX}
                y1={youY}
                x2={memberX}
                y2={memberY}
                stroke={connectionType.color}
                strokeWidth={pulseWidth}
                strokeDasharray={`${dashLength} ${lineLength}`}
                opacity={0.4 + lineProgress * 0.3}
              />
            </g>
          );
        })}
      </svg>

      {/* Community member nodes */}
      {COMMUNITY_MEMBERS.map((member, i) => {
        const memberX = offsetX + member.x * contentWidth;
        const memberY = offsetY + member.y * contentHeight;

        // For "you", use youOpacity; for others, stagger based on index
        const nodeDelay = member.isYou ? 0 : (i - 1) * 15;
        const nodeOpacity = member.isYou
          ? youOpacity
          : interpolate(frame, [60 + nodeDelay, 100 + nodeDelay], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            });

        const nodeScale = spring({
          frame: frame - (member.isYou ? 30 : 60 + nodeDelay),
          fps,
          config: { damping: 12, stiffness: 100 },
        });

        // Pulse for "you" node
        const youPulse = isPulsing && member.isYou ? 1 + Math.sin(pulsePhase * 2) * 0.05 : 1;

        return (
          <div
            key={member.id}
            style={{
              position: "absolute",
              left: memberX,
              top: memberY,
              transform: `translate(-50%, -50%) scale(${nodeScale * youPulse})`,
              opacity: nodeOpacity,
            }}
          >
            {/* Node circle */}
            <div
              style={{
                width: member.isYou ? 80 : 60,
                height: member.isYou ? 80 : 60,
                borderRadius: "50%",
                background: member.isYou
                  ? `radial-gradient(circle at 30% 30%, ${member.color}, ${member.color}80)`
                  : `radial-gradient(circle at 30% 30%, ${member.color}40, ${member.color}10)`,
                border: `2px solid ${member.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: member.isYou
                  ? `0 0 30px ${member.color}60`
                  : `0 0 15px ${member.color}30`,
              }}
            >
              <span style={{ fontSize: member.isYou ? 32 : 24 }}>{member.icon}</span>
            </div>

            {/* Username label */}
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginTop: 8,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: member.isYou ? member.color : COLORS.white,
                  margin: 0,
                }}
              >
                @{member.username}
              </p>
              {!member.isYou && (
                <p
                  style={{
                    fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                    fontSize: 10,
                    fontWeight: 500,
                    color: getConnectionType(member.compatibility || 0).color,
                    margin: "4px 0 0",
                  }}
                >
                  {member.compatibility}% match
                </p>
              )}
            </div>
          </div>
        );
      })}

      {/* Stats bar at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 60,
          opacity: statsOpacity,
        }}
      >
        <StatBadge
          icon="👯"
          label="Taste Twins"
          count={2}
          color={CONNECTION_TYPES.taste_twin.color}
        />
        <StatBadge
          icon="🎵"
          label="Genre Buddies"
          count={4}
          color={CONNECTION_TYPES.genre_buddy.color}
        />
        <StatBadge
          icon="🧭"
          label="Explorers"
          count={12}
          color={CONNECTION_TYPES.explorer.color}
        />
      </div>

      {/* Legend */}
      <div
        style={{
          position: "absolute",
          bottom: 130,
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          gap: 30,
          opacity: statsOpacity,
        }}
      >
        {Object.entries(CONNECTION_TYPES).map(([key, type]) => (
          <div key={key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 12,
                height: 3,
                backgroundColor: type.color,
                borderRadius: 1,
              }}
            />
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 10,
                fontWeight: 500,
                color: COLORS.gray[500],
                letterSpacing: "0.05em",
              }}
            >
              {type.name} ({type.minScore}%+)
            </span>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
}

function StatBadge({
  icon,
  label,
  count,
  color,
}: {
  icon: string;
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "10px 16px",
        border: `1px solid ${color}40`,
        backgroundColor: `${color}10`,
      }}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div>
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 10,
            fontWeight: 500,
            color: COLORS.gray[500],
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            margin: 0,
          }}
        >
          {label}
        </p>
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 24,
            fontWeight: 700,
            color,
            margin: "4px 0 0",
          }}
        >
          {count}
        </p>
      </div>
    </div>
  );
}
