// Perlin noise implementation for flow field animations
// Used in FloodScene for organic particle movement

// Simple seeded random for reproducibility
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

// Fade function for smooth interpolation
function fade(t: number): number {
  return t * t * t * (t * (t * 6 - 15) + 10);
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
  return a + t * (b - a);
}

// Gradient function
function grad(hash: number, x: number, y: number): number {
  const h = hash & 3;
  const u = h < 2 ? x : y;
  const v = h < 2 ? y : x;
  return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
}

// Permutation table
const p: number[] = [];
for (let i = 0; i < 256; i++) {
  p[i] = Math.floor(seededRandom(i * 137.5) * 256);
}
const perm = [...p, ...p];

/**
 * 2D Perlin noise function
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Noise value between -1 and 1
 */
export function noise2D(x: number, y: number): number {
  const X = Math.floor(x) & 255;
  const Y = Math.floor(y) & 255;

  x -= Math.floor(x);
  y -= Math.floor(y);

  const u = fade(x);
  const v = fade(y);

  const a = perm[X] + Y;
  const aa = perm[a];
  const ab = perm[a + 1];
  const b = perm[X + 1] + Y;
  const ba = perm[b];
  const bb = perm[b + 1];

  return lerp(
    lerp(grad(perm[aa], x, y), grad(perm[ba], x - 1, y), u),
    lerp(grad(perm[ab], x, y - 1), grad(perm[bb], x - 1, y - 1), u),
    v
  );
}

/**
 * Seeded 2D noise for reproducible animations
 * @param seed - String seed for this noise channel
 * @param x - X coordinate
 * @param y - Y coordinate
 * @returns Noise value between -1 and 1
 */
export function seededNoise2D(seed: string, x: number, y: number): number {
  // Create offset based on seed string
  let offset = 0;
  for (let i = 0; i < seed.length; i++) {
    offset += seed.charCodeAt(i) * (i + 1);
  }
  return noise2D(x + offset * 0.01, y + offset * 0.01);
}

/**
 * Fractal Brownian Motion (fBm) for more complex noise patterns
 * @param x - X coordinate
 * @param y - Y coordinate
 * @param octaves - Number of octaves (detail levels)
 * @param persistence - Amplitude decay per octave
 * @returns Noise value
 */
export function fbm(x: number, y: number, octaves: number = 4, persistence: number = 0.5): number {
  let total = 0;
  let frequency = 1;
  let amplitude = 1;
  let maxValue = 0;

  for (let i = 0; i < octaves; i++) {
    total += noise2D(x * frequency, y * frequency) * amplitude;
    maxValue += amplitude;
    amplitude *= persistence;
    frequency *= 2;
  }

  return total / maxValue;
}

/**
 * Get flow field angle at a point
 * @param x - X position
 * @param y - Y position
 * @param frame - Current frame for animation
 * @param scale - Noise scale (smaller = larger features)
 * @returns Angle in radians
 */
export function getFlowAngle(x: number, y: number, frame: number, scale: number = 0.003): number {
  const noiseValue = noise2D(x * scale, y * scale + frame * 0.005);
  return noiseValue * Math.PI * 2;
}

/**
 * Get velocity vector from flow field
 * @param x - X position
 * @param y - Y position
 * @param frame - Current frame
 * @param speed - Base speed
 * @param scale - Noise scale
 * @returns Velocity as {vx, vy}
 */
export function getFlowVelocity(
  x: number,
  y: number,
  frame: number,
  speed: number = 2,
  scale: number = 0.003
): { vx: number; vy: number } {
  const angle = getFlowAngle(x, y, frame, scale);
  return {
    vx: Math.cos(angle) * speed,
    vy: Math.sin(angle) * speed,
  };
}
