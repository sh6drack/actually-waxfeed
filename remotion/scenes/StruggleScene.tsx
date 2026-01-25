import { AbsoluteFill, useCurrentFrame, interpolate } from "remotion";

interface Props {
  width?: number;
  height?: number;
}

export const StruggleScene: React.FC<Props> = ({ width = 1920, height = 1080 }) => {
  const frame = useCurrentFrame();
  const isVertical = height > width;

  // Rapid cuts - each panel ~22 frames
  const panel1 = frame < 22;
  const panel2 = frame >= 22 && frame < 44;
  const panel3 = frame >= 44 && frame < 66;
  const panel4 = frame >= 66;

  const fontSize = isVertical ? 28 : 22;

  return (
    <AbsoluteFill style={{ backgroundColor: "#0a0a0a" }}>
      {/* Panel 1: "I listen to everything" */}
      {panel1 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              backgroundColor: "#1a1a1a",
              border: "1px solid #333",
              padding: "24px 36px",
            }}
          >
            <p
              style={{
                color: "#888",
                fontSize: fontSize + 2,
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                margin: 0,
                fontStyle: "italic",
              }}
            >
              "I listen to everything lol"
            </p>
          </div>
        </AbsoluteFill>
      )}

      {/* Panel 2: Generic playlist names */}
      {panel2 && (
        <AbsoluteFill
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          {["Chill Vibes", "Sad Hours", "Workout", "idk"].map((name, i) => (
            <div
              key={name}
              style={{
                backgroundColor: "#111",
                border: "1px solid #222",
                padding: "10px 24px",
                opacity: interpolate(frame - 22, [i * 4, i * 4 + 6], [0, 1], {
                  extrapolateRight: "clamp",
                }),
              }}
            >
              <p
                style={{
                  color: "#666",
                  fontSize: fontSize - 4,
                  fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                  margin: 0,
                  textTransform: "lowercase",
                }}
              >
                {name}
              </p>
            </div>
          ))}
        </AbsoluteFill>
      )}

      {/* Panel 3: Awkward silence */}
      {panel3 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <p
            style={{
              color: "#333",
              fontSize: fontSize * 4,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              letterSpacing: "0.5em",
            }}
          >
            . . .
          </p>
        </AbsoluteFill>
      )}

      {/* Panel 4: The truth */}
      {panel4 && (
        <AbsoluteFill
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <h2
            style={{
              color: "#ededed",
              fontSize: isVertical ? 36 : 28,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              fontWeight: 400,
              textAlign: "center",
              padding: "0 40px",
              opacity: interpolate(frame - 66, [0, 10], [0, 1]),
              textTransform: "lowercase",
            }}
          >
            you can't explain your taste
          </h2>
        </AbsoluteFill>
      )}

      {/* Scan lines */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0,0,0,0.03) 2px,
            rgba(0,0,0,0.03) 4px
          )`,
          pointerEvents: "none",
        }}
      />
    </AbsoluteFill>
  );
};
