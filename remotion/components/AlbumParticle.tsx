import { Img, interpolate, useCurrentFrame, Easing } from "remotion";
import { noise2D } from "../lib/noise";

interface AlbumParticleProps {
  coverUrl: string;
  initialX: number;
  initialY: number;
  targetX?: number;
  targetY?: number;
  size?: number;
  index: number;
  revealDelay?: number;
  useFlowField?: boolean;
  flowScale?: number;
  flowSpeed?: number;
  opacity?: number;
}

export function AlbumParticle({
  coverUrl,
  initialX,
  initialY,
  targetX,
  targetY,
  size = 64,
  index,
  revealDelay = 0,
  useFlowField = true,
  flowScale = 0.003,
  flowSpeed = 1.5,
  opacity = 1,
}: AlbumParticleProps) {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - revealDelay;

  // Reveal animation
  const revealProgress = interpolate(adjustedFrame, [0, 30], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  const scale = interpolate(adjustedFrame, [0, 40], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0, 0, 0.2, 1),
  });

  // Calculate position
  let x = initialX;
  let y = initialY;

  if (useFlowField && adjustedFrame > 0) {
    // Flow field movement using Perlin noise
    const time = adjustedFrame * 0.02;
    const noiseX = noise2D(initialX * flowScale + index * 0.1, time);
    const noiseY = noise2D(initialY * flowScale + index * 0.1 + 100, time);

    x = initialX + noiseX * flowSpeed * adjustedFrame * 0.5;
    y = initialY + noiseY * flowSpeed * adjustedFrame * 0.5;
  }

  // If we have a target, interpolate toward it
  if (targetX !== undefined && targetY !== undefined) {
    const targetProgress = interpolate(adjustedFrame, [60, 120], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    x = x + (targetX - x) * targetProgress;
    y = y + (targetY - y) * targetProgress;
  }

  // Subtle rotation based on movement
  const rotateZ = noise2D(index * 0.5, adjustedFrame * 0.01) * 8;

  // 3D tilt based on velocity direction
  const velocityX = noise2D(initialX * flowScale, adjustedFrame * 0.02) * 10;
  const velocityY =
    noise2D(initialY * flowScale + 100, adjustedFrame * 0.02) * 10;
  const rotateY = velocityX;
  const rotateX = -velocityY;

  if (adjustedFrame < 0) return null;

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        opacity: revealProgress * opacity,
        transform: `
          scale(${scale})
          perspective(500px)
          rotateX(${rotateX}deg)
          rotateY(${rotateY}deg)
          rotateZ(${rotateZ}deg)
        `,
        transformStyle: "preserve-3d",
      }}
    >
      <Img
        src={coverUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
}

// Batch component for performance
interface AlbumParticleFieldProps {
  covers: string[];
  width: number;
  height: number;
  particleSize?: number;
  startDelay?: number;
  staggerDelay?: number;
}

export function AlbumParticleField({
  covers,
  width,
  height,
  particleSize = 64,
  startDelay = 0,
  staggerDelay = 2,
}: AlbumParticleFieldProps) {
  // Generate initial positions around the edges
  const particles = covers.map((cover, i) => {
    const edge = i % 4;
    let x: number, y: number;

    switch (edge) {
      case 0: // Top edge
        x = Math.random() * width;
        y = -particleSize;
        break;
      case 1: // Right edge
        x = width + particleSize;
        y = Math.random() * height;
        break;
      case 2: // Bottom edge
        x = Math.random() * width;
        y = height + particleSize;
        break;
      default: // Left edge
        x = -particleSize;
        y = Math.random() * height;
        break;
    }

    return {
      cover,
      x,
      y,
      delay: startDelay + i * staggerDelay,
    };
  });

  return (
    <>
      {particles.map((p, i) => (
        <AlbumParticle
          key={i}
          coverUrl={p.cover}
          initialX={p.x}
          initialY={p.y}
          targetX={width / 2 + (Math.random() - 0.5) * 400}
          targetY={height / 2 + (Math.random() - 0.5) * 400}
          size={particleSize}
          index={i}
          revealDelay={p.delay}
        />
      ))}
    </>
  );
}
