import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../lib/colors";
import { noise2D } from "../lib/noise";
import { SAMPLE_PROFILES, SAMPLE_REVIEWS } from "../data/sampleProfiles";

// Scene 6: THE ECOSYSTEM
// Zoom out to social graph. Archetype badges. Review snippets float by.

interface EcosystemSceneProps {
  width?: number;
  height?: number;
}

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  username: string;
  archetype: string;
  connections: string[];
}

export function EcosystemScene({
  width = 1920,
  height = 1080,
}: EcosystemSceneProps) {
  const frame = useCurrentFrame();

  // Generate network nodes from sample profiles
  const nodes: NetworkNode[] = SAMPLE_PROFILES.map((profile, i) => {
    // Arrange in organic cluster
    const angle = (i / SAMPLE_PROFILES.length) * Math.PI * 2;
    const radius = 200 + Math.sin(i * 2.5) * 100;

    return {
      id: profile.id,
      x: width / 2 + Math.cos(angle) * radius,
      y: height / 2 + Math.sin(angle) * radius,
      username: profile.username,
      archetype: profile.archetype.name,
      connections: SAMPLE_PROFILES.filter((_, j) => {
        // Connect to 2-3 nearby nodes
        const distance = Math.abs(i - j);
        return distance > 0 && distance <= 2;
      }).map((p) => p.id),
    };
  });

  // Camera pan animation
  const cameraX = interpolate(frame, [0, 450], [0, 200], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const cameraY = interpolate(frame, [0, 450], [0, -100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Zoom out effect
  const zoom = interpolate(frame, [0, 100], [1.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Node reveal stagger
  const nodeOpacities = nodes.map((_, i) => {
    const delay = i * 15;
    return interpolate(frame, [delay, delay + 40], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });

  // Connection line drawing
  const lineProgress = interpolate(frame, [60, 150], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.4, 0, 0.2, 1),
  });

  // Archetype badge reveals
  const badgeOpacities = nodes.map((_, i) => {
    const delay = 100 + i * 20;
    return interpolate(frame, [delay, delay + 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });

  // Review card animations
  const reviewOpacities = SAMPLE_REVIEWS.map((_, i) => {
    const delay = 200 + i * 40;
    return interpolate(frame, [delay, delay + 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  });

  const reviewPositions = SAMPLE_REVIEWS.map((_, i) => {
    const baseX = 100 + (i % 2) * (width - 500);
    const baseY = 150 + Math.floor(i / 2) * 200;
    // Subtle float animation
    const floatY = Math.sin((frame + i * 30) * 0.03) * 10;
    return { x: baseX, y: baseY + floatY };
  });

  // Activity pulses
  const pulseCount = 5;
  const pulses = Array.from({ length: pulseCount }, (_, i) => {
    const pulseFrame = 150 + i * 60;
    const nodeIndex = i % nodes.length;
    const node = nodes[nodeIndex];

    if (frame < pulseFrame) return null;

    const adjustedFrame = frame - pulseFrame;
    const scale = interpolate(adjustedFrame, [0, 40], [0, 3], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const opacity = interpolate(adjustedFrame, [0, 40], [0.6, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return { x: node.x, y: node.y, scale, opacity };
  }).filter(Boolean);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          transform: `translate(-50%, -50%) translate(${-cameraX}px, ${-cameraY}px) scale(${zoom})`,
          transformOrigin: "center center",
        }}
      >
        {/* Connection lines */}
        <svg
          style={{
            position: "absolute",
            left: -width / 2,
            top: -height / 2,
            width: width * 2,
            height: height * 2,
            pointerEvents: "none",
          }}
        >
          {nodes.map((node) =>
            node.connections.map((targetId) => {
              const target = nodes.find((n) => n.id === targetId);
              if (!target) return null;

              const dx = target.x - node.x;
              const dy = target.y - node.y;
              const length = Math.sqrt(dx * dx + dy * dy);
              const dashLength = length * lineProgress;

              return (
                <line
                  key={`${node.id}-${targetId}`}
                  x1={node.x + width / 2}
                  y1={node.y + height / 2}
                  x2={target.x + width / 2}
                  y2={target.y + height / 2}
                  stroke={COLORS.gray[700]}
                  strokeWidth="1"
                  strokeDasharray={`${dashLength} ${length}`}
                />
              );
            })
          )}
        </svg>

        {/* Activity pulses */}
        {pulses.map((pulse, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: pulse!.x - 20,
              top: pulse!.y - 20,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: `2px solid ${COLORS.white}`,
              transform: `scale(${pulse!.scale})`,
              opacity: pulse!.opacity,
            }}
          />
        ))}

        {/* Network nodes */}
        {nodes.map((node, i) => (
          <div
            key={node.id}
            style={{
              position: "absolute",
              left: node.x - 30,
              top: node.y - 30,
              opacity: nodeOpacities[i],
            }}
          >
            {/* Node circle (mini radar representation) */}
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                border: `2px solid ${COLORS.white}`,
                backgroundColor: COLORS.black,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width="40" height="40" viewBox="0 0 40 40">
                <polygon
                  points="20,5 35,15 35,30 20,38 5,30 5,15"
                  fill={COLORS.white}
                  fillOpacity="0.2"
                  stroke={COLORS.white}
                  strokeWidth="1"
                />
              </svg>
            </div>

            {/* Username */}
            <p
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 11,
                fontWeight: 500,
                color: COLORS.white,
                textAlign: "center",
                marginTop: 8,
              }}
            >
              @{node.username}
            </p>

            {/* Archetype badge */}
            <div
              style={{
                marginTop: 4,
                padding: "4px 8px",
                border: `1px solid ${COLORS.gray[600]}`,
                backgroundColor: COLORS.black,
                opacity: badgeOpacities[i],
              }}
            >
              <span
                style={{
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  fontSize: 8,
                  fontWeight: 600,
                  color: COLORS.gray[400],
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                {node.archetype}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Floating review cards */}
      {SAMPLE_REVIEWS.map((review, i) => (
        <div
          key={review.id}
          style={{
            position: "absolute",
            left: reviewPositions[i].x,
            top: reviewPositions[i].y,
            width: 300,
            padding: 16,
            backgroundColor: COLORS.gray[900],
            border: `1px solid ${COLORS.gray[800]}`,
            opacity: reviewOpacities[i],
          }}
        >
          <p
            style={{
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontSize: 13,
              fontWeight: 400,
              color: COLORS.gray[300],
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            "{review.text}"
          </p>
          <div
            style={{
              marginTop: 12,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 11,
                color: COLORS.gray[500],
              }}
            >
              @{review.username}
            </span>
            <span
              style={{
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                fontSize: 14,
                fontWeight: 700,
                padding: "2px 8px",
                backgroundColor: COLORS.white,
                color: COLORS.black,
              }}
            >
              {review.rating}
            </span>
          </div>
        </div>
      ))}

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 30%, ${COLORS.black} 100%)`,
          pointerEvents: "none",
          opacity: 0.7,
        }}
      />
    </AbsoluteFill>
  );
}
