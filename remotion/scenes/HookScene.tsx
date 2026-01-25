import { AbsoluteFill, useCurrentFrame, interpolate, spring, useVideoConfig } from "remotion";

interface Props {
  width?: number;
  height?: number;
}

export const HookScene: React.FC<Props> = ({ width = 1920, height = 1080 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const isVertical = height > width;

  // Message animations
  const message1Opacity = interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" });
  const message1Y = spring({ frame, fps, from: 20, to: 0, durationInFrames: 12 });

  const message2Opacity = interpolate(frame, [25, 33], [0, 1], { extrapolateRight: "clamp" });
  const message2Y = spring({ frame: frame - 25, fps, from: 20, to: 0, durationInFrames: 12 });

  // Title appears
  const titleOpacity = interpolate(frame, [50, 60], [0, 1], { extrapolateRight: "clamp" });

  // Glitch effect
  const glitchX = frame > 55 ? Math.sin(frame * 3) * 2 : 0;

  const fontSize = isVertical ? 24 : 18;
  const titleFontSize = isVertical ? 42 : 32;

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0a",
        transform: `translateX(${glitchX}px)`,
      }}
    >
      {/* Chat bubbles - brutalist style */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "column",
          gap: 20,
          width: isVertical ? "85%" : "45%",
        }}
      >
        {/* Incoming message - sharp edges */}
        <div
          style={{
            opacity: message1Opacity,
            transform: `translateY(${message1Y}px)`,
            alignSelf: "flex-start",
          }}
        >
          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              padding: "16px 20px",
            }}
          >
            <p style={{
              color: "#ededed",
              fontSize,
              margin: 0,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 400,
            }}>
              so what music are you into?
            </p>
          </div>
        </div>

        {/* Typing indicator */}
        <div
          style={{
            opacity: message2Opacity,
            transform: `translateY(${message2Y}px)`,
            alignSelf: "flex-end",
          }}
        >
          <div
            style={{
              backgroundColor: "#222",
              border: "1px solid #444",
              padding: "16px 24px",
              display: "flex",
              gap: 8,
            }}
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: "#666",
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* THE DREADED QUESTION - brutalist typography */}
      <div
        style={{
          position: "absolute",
          bottom: isVertical ? "18%" : "14%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          opacity: titleOpacity,
        }}
      >
        <h1
          style={{
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            fontSize: titleFontSize,
            fontWeight: 700,
            color: "#ededed",
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            margin: 0,
            borderBottom: "2px solid #ffd700",
            paddingBottom: 8,
          }}
        >
          THE DREADED QUESTION
        </h1>
      </div>
    </AbsoluteFill>
  );
};
