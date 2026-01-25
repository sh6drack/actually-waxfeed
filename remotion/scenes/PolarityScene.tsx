import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../lib/colors";

// Scene: THE POLARITY
// Visualizes the 7 Music Networks from Polarity 1.2
// Shows how different listening modes activate like brain networks

interface PolaritySceneProps {
  width?: number;
  height?: number;
}

const MUSIC_NETWORKS = [
  { id: "discovery", name: "Discovery", icon: "🔍", color: "#00ff88", description: "Seeking new sounds" },
  { id: "comfort", name: "Comfort", icon: "🏠", color: "#ff6b6b", description: "Returning to favorites" },
  { id: "deep_dive", name: "Deep Dive", icon: "🎯", color: "#4ecdc4", description: "Album obsession" },
  { id: "reactive", name: "Reactive", icon: "📡", color: "#ffe66d", description: "Trend-aware" },
  { id: "emotional", name: "Emotional", icon: "💜", color: "#c44dff", description: "Feeling the music" },
  { id: "social", name: "Social", icon: "👥", color: "#45b7d1", description: "Shared listening" },
  { id: "aesthetic", name: "Aesthetic", icon: "🎨", color: "#ff9f43", description: "Visual discovery" },
];

// Sample network activation pattern
const NETWORK_ACTIVATIONS = {
  discovery: 0.85,
  comfort: 0.45,
  deep_dive: 0.72,
  reactive: 0.35,
  emotional: 0.68,
  social: 0.52,
  aesthetic: 0.61,
};

export function PolarityScene({ width = 1920, height = 1080 }: PolaritySceneProps) {
  const frame = useCurrentFrame();
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(width, height) * 0.32;

  // Phase 1: Title appears (frames 0-60)
  const titleOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 2: Networks emerge from center (frames 40-150)
  const networkProgress = interpolate(frame, [40, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Phase 3: Connections draw between networks (frames 150-250)
  const connectionProgress = interpolate(frame, [150, 250], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Phase 4: Activation levels animate (frames 200-350)
  const activationProgress = interpolate(frame, [200, 350], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Phase 5: Signature label appears (frames 350-400)
  const signatureOpacity = interpolate(frame, [350, 390], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Phase 6: Pulse animation (frames 380+)
  const pulsePhase = (frame - 380) * 0.05;
  const pulseScale = frame > 380 ? 1 + Math.sin(pulsePhase) * 0.02 : 1;

  // Calculate network positions in a circle
  const getNetworkPosition = (index: number, total: number) => {
    const angle = (index / total) * Math.PI * 2 - Math.PI / 2;
    const currentRadius = radius * networkProgress;
    return {
      x: centerX + Math.cos(angle) * currentRadius,
      y: centerY + Math.sin(angle) * currentRadius,
    };
  };

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
          top: 60,
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
          POLARITY 1.2
        </p>
        <h2
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 48,
            fontWeight: 700,
            color: COLORS.white,
            margin: "16px 0 8px",
            letterSpacing: "-0.02em",
          }}
        >
          Music Networks
        </h2>
        <p
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: 16,
            fontWeight: 400,
            color: COLORS.gray[400],
            margin: 0,
          }}
        >
          How you engage with music
        </p>
      </div>

      {/* Connection lines */}
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          transform: `scale(${pulseScale})`,
          transformOrigin: "center",
        }}
      >
        {/* Draw connections between adjacent networks */}
        {MUSIC_NETWORKS.map((network, i) => {
          const pos1 = getNetworkPosition(i, MUSIC_NETWORKS.length);
          const nextIndex = (i + 1) % MUSIC_NETWORKS.length;
          const pos2 = getNetworkPosition(nextIndex, MUSIC_NETWORKS.length);

          const lineLength = Math.sqrt(
            Math.pow(pos2.x - pos1.x, 2) + Math.pow(pos2.y - pos1.y, 2)
          );
          const dashLength = lineLength * connectionProgress;

          return (
            <line
              key={`connection-${i}`}
              x1={pos1.x}
              y1={pos1.y}
              x2={pos2.x}
              y2={pos2.y}
              stroke={COLORS.gray[700]}
              strokeWidth="1"
              strokeDasharray={`${dashLength} ${lineLength}`}
              opacity={0.5}
            />
          );
        })}

        {/* Draw connections to center */}
        {MUSIC_NETWORKS.map((network, i) => {
          const pos = getNetworkPosition(i, MUSIC_NETWORKS.length);
          const activation = NETWORK_ACTIVATIONS[network.id as keyof typeof NETWORK_ACTIVATIONS] || 0;
          const animatedActivation = activation * activationProgress;

          return (
            <line
              key={`center-${i}`}
              x1={centerX}
              y1={centerY}
              x2={pos.x}
              y2={pos.y}
              stroke={network.color}
              strokeWidth={2 + animatedActivation * 3}
              opacity={0.3 + animatedActivation * 0.4}
            />
          );
        })}
      </svg>

      {/* Center brain node */}
      <div
        style={{
          position: "absolute",
          left: centerX,
          top: centerY,
          transform: `translate(-50%, -50%) scale(${pulseScale})`,
          opacity: networkProgress,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            background: `radial-gradient(circle at 30% 30%, ${COLORS.gray[700]}, ${COLORS.gray[900]})`,
            border: `2px solid ${COLORS.gray[600]}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px rgba(255, 255, 255, 0.1)",
          }}
        >
          <span style={{ fontSize: 32 }}>🧠</span>
        </div>
      </div>

      {/* Network nodes */}
      {MUSIC_NETWORKS.map((network, i) => {
        const pos = getNetworkPosition(i, MUSIC_NETWORKS.length);
        const activation = NETWORK_ACTIVATIONS[network.id as keyof typeof NETWORK_ACTIVATIONS] || 0;
        const animatedActivation = activation * activationProgress;
        const nodeDelay = i * 10;
        const nodeOpacity = interpolate(frame, [40 + nodeDelay, 80 + nodeDelay], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        });

        return (
          <div
            key={network.id}
            style={{
              position: "absolute",
              left: pos.x,
              top: pos.y,
              transform: `translate(-50%, -50%) scale(${0.8 + animatedActivation * 0.4})`,
              opacity: nodeOpacity,
            }}
          >
            {/* Node circle */}
            <div
              style={{
                width: 60 + animatedActivation * 20,
                height: 60 + animatedActivation * 20,
                borderRadius: "50%",
                background: `radial-gradient(circle at 30% 30%, ${network.color}40, ${network.color}10)`,
                border: `2px solid ${network.color}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 ${20 + animatedActivation * 30}px ${network.color}40`,
                transition: "all 0.1s ease-out",
              }}
            >
              <span style={{ fontSize: 24 + animatedActivation * 8 }}>{network.icon}</span>
            </div>

            {/* Network label */}
            <div
              style={{
                position: "absolute",
                top: "100%",
                left: "50%",
                transform: "translateX(-50%)",
                marginTop: 12,
                textAlign: "center",
                whiteSpace: "nowrap",
              }}
            >
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 12,
                  fontWeight: 600,
                  color: network.color,
                  letterSpacing: "0.05em",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                {network.name}
              </p>
              <p
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 10,
                  fontWeight: 400,
                  color: COLORS.gray[500],
                  margin: "4px 0 0",
                }}
              >
                {Math.round(animatedActivation * 100)}%
              </p>
            </div>
          </div>
        );
      })}

      {/* Signature summary */}
      <div
        style={{
          position: "absolute",
          bottom: 60,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: signatureOpacity,
        }}
      >
        <div
          style={{
            display: "inline-block",
            padding: "12px 24px",
            border: `1px solid ${COLORS.gray[700]}`,
            backgroundColor: COLORS.gray[900],
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
            YOUR LISTENING SIGNATURE
          </p>
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 20,
              fontWeight: 700,
              color: COLORS.white,
              margin: "8px 0 0",
            }}
          >
            🔍 Discovery Mode × 🎯 Deep Dive
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
}
