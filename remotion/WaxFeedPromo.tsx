import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Sequence,
} from "remotion";

type WaxFeedPromoProps = {
  tagline: string;
};

const COLORS = {
  black: "#000000",
  white: "#ffffff",
  gray: "#666666",
  lightGray: "#999999",
};

// Apple-style easing - slow start, smooth finish
const appleEase = Easing.bezier(0.25, 0.1, 0.25, 1);
const appleEaseOut = Easing.bezier(0, 0, 0.2, 1);

const TextReveal = ({
  children,
  delay = 0,
  duration = 45,
  style = {},
}: {
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  style?: React.CSSProperties;
}) => {
  const frame = useCurrentFrame();
  const adjustedFrame = frame - delay;

  const opacity = interpolate(adjustedFrame, [0, duration * 0.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: appleEase,
  });

  const y = interpolate(adjustedFrame, [0, duration], [40, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: appleEaseOut,
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Scene 1: The Problem
const ProblemScene = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 120,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1400 }}>
        <TextReveal delay={0}>
          <h1
            style={{
              fontSize: 96,
              fontWeight: 600,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.white,
              letterSpacing: -2,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            Everyone streams music.
          </h1>
        </TextReveal>
        <TextReveal delay={30}>
          <p
            style={{
              fontSize: 48,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              marginTop: 40,
              letterSpacing: -0.5,
            }}
          >
            No one has a place to express their taste.
          </p>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

// Scene 2: The Insight
const InsightScene = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 120,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1400 }}>
        <TextReveal delay={0}>
          <p
            style={{
              fontSize: 42,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.lightGray,
              letterSpacing: -0.5,
              margin: 0,
            }}
          >
            Spotify is where you listen.
          </p>
        </TextReveal>
        <TextReveal delay={35}>
          <h1
            style={{
              fontSize: 108,
              fontWeight: 600,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.white,
              letterSpacing: -3,
              marginTop: 30,
              lineHeight: 1,
            }}
          >
            WaxFeed is where
            <br />
            you express.
          </h1>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

// Scene 3: What It Is
const WhatItIsScene = () => {
  const frame = useCurrentFrame();

  const features = [
    "Rate albums",
    "Share your taste",
    "Find your music people",
  ];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 120,
      }}
    >
      <div style={{ textAlign: "center" }}>
        {features.map((feature, i) => (
          <TextReveal key={i} delay={i * 25} style={{ marginBottom: 20 }}>
            <p
              style={{
                fontSize: 72,
                fontWeight: 500,
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                color: COLORS.white,
                letterSpacing: -1.5,
                margin: 0,
              }}
            >
              {feature}
            </p>
          </TextReveal>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// Scene 4: TASTEID
const TasteIdScene = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const bars = [0.3, 0.7, 0.5, 0.9, 0.4, 0.85, 0.6, 0.95, 0.45, 0.75, 0.55, 0.8];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 120,
      }}
    >
      <TextReveal delay={0}>
        <p
          style={{
            fontSize: 28,
            fontWeight: 500,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            color: COLORS.lightGray,
            letterSpacing: 4,
            textTransform: "uppercase",
            marginBottom: 20,
          }}
        >
          Introducing
        </p>
      </TextReveal>
      <TextReveal delay={15}>
        <h1
          style={{
            fontSize: 120,
            fontWeight: 700,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            color: COLORS.white,
            letterSpacing: -3,
            margin: 0,
          }}
        >
          TASTEID
        </h1>
      </TextReveal>
      <TextReveal delay={30}>
        <p
          style={{
            fontSize: 32,
            fontWeight: 400,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            color: COLORS.gray,
            marginTop: 20,
            marginBottom: 60,
          }}
        >
          Your unique music fingerprint
        </p>
      </TextReveal>

      <div
        style={{
          display: "flex",
          gap: 12,
          alignItems: "flex-end",
          height: 160,
        }}
      >
        {bars.map((height, i) => {
          const barDelay = 45 + i * 4;
          const barProgress = interpolate(
            frame - barDelay,
            [0, 40],
            [0, 1],
            {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: appleEaseOut,
            }
          );

          return (
            <div
              key={i}
              style={{
                width: 24,
                height: barProgress * height * 160,
                backgroundColor: COLORS.white,
                borderRadius: 4,
                opacity: 0.9,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

// Scene 5: The Gap
const GapScene = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 120,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 1200 }}>
        <TextReveal delay={0}>
          <p
            style={{
              fontSize: 36,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              letterSpacing: -0.5,
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            There's no Letterboxd for music.
          </p>
        </TextReveal>
        <TextReveal delay={25}>
          <p
            style={{
              fontSize: 36,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              letterSpacing: -0.5,
              lineHeight: 1.6,
              marginTop: 20,
            }}
          >
            RateYourMusic is stuck in 2005.
          </p>
        </TextReveal>
        <TextReveal delay={50}>
          <p
            style={{
              fontSize: 36,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              letterSpacing: -0.5,
              lineHeight: 1.6,
              marginTop: 20,
            }}
          >
            Last.fm is effectively dead.
          </p>
        </TextReveal>
        <TextReveal delay={75}>
          <h2
            style={{
              fontSize: 64,
              fontWeight: 600,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.white,
              letterSpacing: -1.5,
              marginTop: 60,
            }}
          >
            The market is ours to take.
          </h2>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

// Scene 6: Logo Reveal
const LogoScene = ({ tagline }: { tagline: string }) => {
  const frame = useCurrentFrame();

  const logoOpacity = interpolate(frame, [0, 50], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: appleEase,
  });

  const logoScale = interpolate(frame, [0, 50], [0.95, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: appleEaseOut,
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          opacity: logoOpacity,
          transform: `scale(${logoScale})`,
          textAlign: "center",
        }}
      >
        <h1
          style={{
            fontSize: 160,
            fontWeight: 700,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            color: COLORS.white,
            letterSpacing: -5,
            margin: 0,
          }}
        >
          WaxFeed
        </h1>
        <TextReveal delay={40}>
          <p
            style={{
              fontSize: 32,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              marginTop: 30,
              letterSpacing: 0.5,
            }}
          >
            Rate albums. Find your music people.
          </p>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const WaxFeedPromo: React.FC<WaxFeedPromoProps> = ({ tagline }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.black }}>
      <Sequence from={0} durationInFrames={75}>
        <ProblemScene />
      </Sequence>

      <Sequence from={75} durationInFrames={80}>
        <InsightScene />
      </Sequence>

      <Sequence from={155} durationInFrames={70}>
        <WhatItIsScene />
      </Sequence>

      <Sequence from={225} durationInFrames={85}>
        <TasteIdScene />
      </Sequence>

      <Sequence from={310} durationInFrames={90}>
        <GapScene />
      </Sequence>

      <Sequence from={400} durationInFrames={100}>
        <LogoScene tagline={tagline} />
      </Sequence>
    </AbsoluteFill>
  );
};
