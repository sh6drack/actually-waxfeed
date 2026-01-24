import { interpolate, useCurrentFrame, Easing } from "remotion";

interface HolographicDiscProps {
  size?: number;
  spinning?: boolean;
  spinSpeed?: number; // degrees per frame
  revealDelay?: number;
  revealDuration?: number;
  labelText?: string;
}

export function HolographicDisc({
  size = 500,
  spinning = true,
  spinSpeed = 0.8,
  revealDelay = 0,
  revealDuration = 50,
  labelText = "88",
}: HolographicDiscProps) {
  const frame = useCurrentFrame();

  // Reveal animation
  const revealProgress = interpolate(
    frame - revealDelay,
    [0, revealDuration],
    [0, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    }
  );

  const scale = interpolate(
    frame - revealDelay,
    [0, revealDuration],
    [0.9, 1],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.bezier(0, 0, 0.2, 1),
    }
  );

  // Spin rotation
  const rotation = spinning ? frame * spinSpeed : 0;

  // Light streak animation
  const streakOffset = (frame * 1.5) % 360;

  return (
    <div
      style={{
        width: size,
        height: size,
        opacity: revealProgress,
        transform: `scale(${scale})`,
      }}
    >
      <svg width={size} height={size} viewBox="0 0 500 500">
        <defs>
          {/* Holographic base gradient */}
          <linearGradient id="holoBase" x1="20%" y1="80%" x2="80%" y2="20%">
            <stop offset="0%" stopColor="#e4a8c8" />
            <stop offset="12%" stopColor="#f0b8d8" />
            <stop offset="24%" stopColor="#d898c8" />
            <stop offset="36%" stopColor="#98d8b8" />
            <stop offset="48%" stopColor="#88c8d8" />
            <stop offset="60%" stopColor="#b898d8" />
            <stop offset="72%" stopColor="#d8a8c8" />
            <stop offset="84%" stopColor="#c8e8a8" />
            <stop offset="100%" stopColor="#e8c8d8" />
          </linearGradient>

          {/* Iridescent sweep */}
          <radialGradient id="iridescentSweep" cx="30%" cy="30%" r="80%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.5" />
            <stop offset="15%" stopColor="#ffb8e0" stopOpacity="0.6" />
            <stop offset="30%" stopColor="#b8ffb8" stopOpacity="0.4" />
            <stop offset="45%" stopColor="#b8d8ff" stopOpacity="0.35" />
            <stop offset="60%" stopColor="#e8b8ff" stopOpacity="0.4" />
            <stop offset="75%" stopColor="#ffe8b8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#ffb8c8" stopOpacity="0.2" />
          </radialGradient>

          {/* Animated light streak */}
          <linearGradient
            id="lightStreak"
            gradientTransform={`rotate(${streakOffset} 250 250)`}
          >
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="40%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="48%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="50%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="52%" stopColor="#ffffff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>

          {/* Edge depth */}
          <radialGradient id="discEdgeDepth" cx="50%" cy="50%" r="50%">
            <stop offset="88%" stopColor="#000000" stopOpacity="0" />
            <stop offset="94%" stopColor="#000000" stopOpacity="0.1" />
            <stop offset="97%" stopColor="#000000" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.35" />
          </radialGradient>

          {/* Hub metal gradient */}
          <radialGradient id="hubMetal" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f8f8f8" />
            <stop offset="15%" stopColor="#e8e8e8" />
            <stop offset="35%" stopColor="#d0d0d0" />
            <stop offset="55%" stopColor="#a8a8a8" />
            <stop offset="75%" stopColor="#888888" />
            <stop offset="100%" stopColor="#686868" />
          </radialGradient>

          {/* Glow filter */}
          <filter id="discGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Spinning disc group */}
        <g
          style={{
            transformOrigin: "250px 250px",
            transform: `rotate(${rotation}deg)`,
          }}
        >
          {/* Disc base with holographic surface */}
          <circle cx="250" cy="250" r="220" fill="url(#holoBase)" />

          {/* Iridescent overlay */}
          <circle cx="250" cy="250" r="220" fill="url(#iridescentSweep)" />

          {/* Data track rings */}
          <g fill="none" strokeOpacity="0.08">
            <circle cx="250" cy="250" r="210" stroke="#000" strokeWidth="12" />
            <circle cx="250" cy="250" r="195" stroke="#fff" strokeWidth="1" />
            <circle cx="250" cy="250" r="185" stroke="#000" strokeWidth="8" />
            <circle cx="250" cy="250" r="170" stroke="#fff" strokeWidth="0.5" />
            <circle cx="250" cy="250" r="160" stroke="#000" strokeWidth="6" />
            <circle cx="250" cy="250" r="145" stroke="#fff" strokeWidth="0.5" />
            <circle cx="250" cy="250" r="135" stroke="#000" strokeWidth="5" />
            <circle cx="250" cy="250" r="120" stroke="#fff" strokeWidth="0.5" />
            <circle cx="250" cy="250" r="110" stroke="#000" strokeWidth="4" />
            <circle cx="250" cy="250" r="95" stroke="#fff" strokeWidth="0.5" />
            <circle cx="250" cy="250" r="85" stroke="#000" strokeWidth="3" />
          </g>

          {/* Light streak */}
          <circle cx="250" cy="250" r="220" fill="url(#lightStreak)" />

          {/* Edge depth */}
          <circle cx="250" cy="250" r="220" fill="url(#discEdgeDepth)" />

          {/* Rim highlights */}
          <circle
            cx="250"
            cy="250"
            r="218"
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            opacity="0.5"
            strokeDasharray="300 250"
            strokeDashoffset="50"
          />

          {/* Center hub */}
          <circle cx="250" cy="250" r="65" fill="url(#hubMetal)" />
          <circle
            cx="250"
            cy="250"
            r="65"
            fill="none"
            stroke="#888"
            strokeWidth="0.5"
          />

          {/* Inner hub rings */}
          <circle cx="250" cy="250" r="55" fill="#a8a8a8" />
          <circle
            cx="250"
            cy="250"
            r="55"
            fill="none"
            stroke="#666"
            strokeWidth="2"
          />
          <circle cx="250" cy="250" r="45" fill="#909090" />
          <circle
            cx="250"
            cy="250"
            r="45"
            fill="none"
            stroke="#555"
            strokeWidth="1.5"
          />
          <circle cx="250" cy="250" r="35" fill="#787878" />

          {/* Center hole */}
          <circle cx="250" cy="250" r="8" fill="#1c1c1c" />
          <circle cx="250" cy="250" r="5" fill="#101010" />

          {/* Hub specular highlight */}
          <ellipse
            cx="235"
            cy="232"
            rx="20"
            ry="10"
            fill="#ffffff"
            opacity="0.6"
            transform="rotate(-50 235 232)"
          />

          {/* Label text on disc */}
          <text
            x="330"
            y="260"
            fontFamily="Helvetica Neue, Helvetica, Arial, sans-serif"
            fontSize="40"
            fontWeight="700"
            fill="#1a1a1a"
            opacity="0.8"
            textAnchor="middle"
          >
            {labelText}
          </text>
        </g>
      </svg>
    </div>
  );
}
