import { AbsoluteFill, Img, interpolate, useCurrentFrame, Easing } from "remotion";
import { COLORS } from "../lib/colors";
import { noise2D, getFlowVelocity } from "../lib/noise";
import { SAMPLE_ALBUMS } from "../data/sampleAlbums";

// Scene 2: THE FLOOD
// Dots resolve into album covers. Hundreds streaming in murmurations.

interface FloodSceneProps {
  width?: number;
  height?: number;
}

interface Particle {
  id: number;
  startX: number;
  startY: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  coverUrl: string;
  spawnFrame: number;
}

export function FloodScene({ width = 1920, height = 1080 }: FloodSceneProps) {
  const frame = useCurrentFrame();

  // Generate particles
  const particleCount = 100;

  const particles: Particle[] = Array.from({ length: particleCount }, (_, i) => {
    // Staggered spawn
    const spawnFrame = i * 2;

    // Random edge spawn
    const edge = i % 4;
    const rand = noise2D(i * 0.5, 0) * 0.5 + 0.5;

    let startX: number, startY: number;
    switch (edge) {
      case 0: // Top
        startX = rand * width;
        startY = -80;
        break;
      case 1: // Right
        startX = width + 80;
        startY = rand * height;
        break;
      case 2: // Bottom
        startX = rand * width;
        startY = height + 80;
        break;
      default: // Left
        startX = -80;
        startY = rand * height;
        break;
    }

    // Get album cover
    const albumIndex = i % SAMPLE_ALBUMS.length;
    const coverUrl = SAMPLE_ALBUMS[albumIndex].coverSmall;

    return {
      id: i,
      startX,
      startY,
      x: startX,
      y: startY,
      vx: 0,
      vy: 0,
      size: 48 + (noise2D(i, 0) * 0.5 + 0.5) * 32, // 48-80px
      coverUrl,
      spawnFrame,
    };
  });

  // Calculate positions for each particle
  const animatedParticles = particles.map((p) => {
    const adjustedFrame = frame - p.spawnFrame;

    if (adjustedFrame < 0) return null;

    // Flow field simulation
    let x = p.startX;
    let y = p.startY;
    const centerX = width / 2;
    const centerY = height / 2;

    // Simulate movement frame by frame (simplified)
    const steps = Math.min(adjustedFrame, 150);
    for (let step = 0; step < steps; step++) {
      // Flow field velocity
      const { vx, vy } = getFlowVelocity(x, y, step, 2, 0.002);

      // Add attraction toward center
      const dx = centerX - x;
      const dy = centerY - y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const attractionStrength = 0.3;

      // Combine flow field and attraction
      const ax = (dx / dist) * attractionStrength;
      const ay = (dy / dist) * attractionStrength;

      x += vx + ax;
      y += vy + ay;

      // Slow down as we approach center
      if (dist < 300) {
        x = x * 0.98 + centerX * 0.02;
        y = y * 0.98 + centerY * 0.02;
      }
    }

    // Add subtle organic drift
    const driftX = noise2D(p.id * 0.3, frame * 0.01) * 20;
    const driftY = noise2D(p.id * 0.3 + 100, frame * 0.01) * 20;

    x += driftX;
    y += driftY;

    // Opacity animation
    const opacity = interpolate(adjustedFrame, [0, 30], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });

    // Scale animation
    const scale = interpolate(adjustedFrame, [0, 40], [0.3, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0, 0, 0.2, 1),
    });

    // 3D rotation based on velocity
    const rotateY = noise2D(p.id, frame * 0.02) * 15;
    const rotateX = noise2D(p.id + 50, frame * 0.02) * 10;

    return {
      ...p,
      x,
      y,
      opacity,
      scale,
      rotateX,
      rotateY,
    };
  }).filter(Boolean);

  // Color clustering phase (after frame 150)
  const clusterPhase = interpolate(frame, [180, 250], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.25, 0.1, 0.25, 1),
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      {animatedParticles.map((p) => {
        if (!p) return null;

        return (
          <div
            key={p.id}
            style={{
              position: "absolute",
              left: p.x - p.size / 2,
              top: p.y - p.size / 2,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              transform: `
                scale(${p.scale})
                perspective(500px)
                rotateX(${p.rotateX}deg)
                rotateY(${p.rotateY}deg)
              `,
              transformStyle: "preserve-3d",
            }}
          >
            <Img
              src={p.coverUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>
        );
      })}

      {/* Subtle vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, transparent 40%, ${COLORS.black} 100%)`,
          pointerEvents: "none",
          opacity: 0.6,
        }}
      />
    </AbsoluteFill>
  );
}
