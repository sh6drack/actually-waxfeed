import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../lib/colors";
import { noise2D } from "../lib/noise";

// Scene 1: THE VOID
// Pure black. A pulsing border. Tiny dots drift in from edges.

interface VoidSceneProps {
  width?: number;
  height?: number;
}

export function VoidScene({ width = 1920, height = 1080 }: VoidSceneProps) {
  const frame = useCurrentFrame();

  // Border rectangle dimensions and animation
  const borderWidth = 600;
  const borderHeight = 400;

  // Breathing pulse effect
  const breatheScale =
    1 + Math.sin(frame * 0.04) * 0.008;

  // Border reveal animation
  const borderOpacity = interpolate(frame, [0, 40], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  // Generate particles that appear after frame 60
  const particleCount = 80;
  const particles = Array.from({ length: particleCount }, (_, i) => {
    const spawnFrame = 60 + i * 1.5;

    if (frame < spawnFrame) return null;

    const adjustedFrame = frame - spawnFrame;

    // Start from random edge
    const edge = i % 4;
    let startX: number, startY: number;

    const rand1 = noise2D(i * 0.1, 0) * 0.5 + 0.5;
    const rand2 = noise2D(i * 0.1, 100) * 0.5 + 0.5;

    switch (edge) {
      case 0: // Top
        startX = rand1 * width;
        startY = -10;
        break;
      case 1: // Right
        startX = width + 10;
        startY = rand1 * height;
        break;
      case 2: // Bottom
        startX = rand1 * width;
        startY = height + 10;
        break;
      default: // Left
        startX = -10;
        startY = rand1 * height;
        break;
    }

    // Target is center with some randomness
    const targetX = width / 2 + (rand2 - 0.5) * 200;
    const targetY = height / 2 + (noise2D(i * 0.1, 200) * 0.5) * 200;

    // Progress toward center
    const progress = interpolate(adjustedFrame, [0, 120], [0, 0.7], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.1, 0.3, 0.3, 1),
    });

    // Add organic drift
    const driftX = noise2D(i * 0.3, adjustedFrame * 0.01) * 30;
    const driftY = noise2D(i * 0.3 + 100, adjustedFrame * 0.01) * 30;

    const x = startX + (targetX - startX) * progress + driftX;
    const y = startY + (targetY - startY) * progress + driftY;

    // Size grows slightly as it approaches
    const size = interpolate(adjustedFrame, [0, 60], [1, 2], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    // Opacity
    const opacity = interpolate(adjustedFrame, [0, 20], [0, 0.8], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return { x, y, size, opacity };
  }).filter(Boolean);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Pulsing border rectangle */}
      <div
        style={{
          width: borderWidth,
          height: borderHeight,
          border: `2px solid ${COLORS.white}`,
          opacity: borderOpacity,
          transform: `scale(${breatheScale})`,
          position: "relative",
        }}
      />

      {/* Particle field */}
      {particles.map((p, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: p!.x,
            top: p!.y,
            width: p!.size,
            height: p!.size,
            borderRadius: "50%",
            backgroundColor: COLORS.white,
            opacity: p!.opacity,
          }}
        />
      ))}
    </AbsoluteFill>
  );
}
