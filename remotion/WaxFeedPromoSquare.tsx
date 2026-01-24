import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
  Easing,
  Sequence,
} from "remotion";

type WaxFeedPromoSquareProps = {
  tagline: string;
};

const COLORS = {
  black: "#000000",
  white: "#ffffff",
  gray: "#666666",
  lightGray: "#999999",
};

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

  const y = interpolate(adjustedFrame, [0, duration], [30, 0], {
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

const ProblemScene = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 900 }}>
        <TextReveal delay={0}>
          <h1
            style={{
              fontSize: 64,
              fontWeight: 600,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.white,
              letterSpacing: -1.5,
              lineHeight: 1.15,
              margin: 0,
            }}
          >
            Everyone streams music.
          </h1>
        </TextReveal>
        <TextReveal delay={30}>
          <p
            style={{
              fontSize: 32,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              marginTop: 30,
              letterSpacing: -0.3,
            }}
          >
            No one has a place to express their taste.
          </p>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

const InsightScene = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 900 }}>
        <TextReveal delay={0}>
          <p
            style={{
              fontSize: 28,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.lightGray,
              letterSpacing: -0.3,
              margin: 0,
            }}
          >
            Spotify is where you listen.
          </p>
        </TextReveal>
        <TextReveal delay={35}>
          <h1
            style={{
              fontSize: 72,
              fontWeight: 600,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.white,
              letterSpacing: -2,
              marginTop: 25,
              lineHeight: 1.05,
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

const WhatItIsScene = () => {
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
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center" }}>
        {features.map((feature, i) => (
          <TextReveal key={i} delay={i * 25} style={{ marginBottom: 15 }}>
            <p
              style={{
                fontSize: 52,
                fontWeight: 500,
                fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
                color: COLORS.white,
                letterSpacing: -1,
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

const TasteIdScene = () => {
  const frame = useCurrentFrame();

  const bars = [0.3, 0.7, 0.5, 0.9, 0.4, 0.85, 0.6, 0.95, 0.45, 0.75];

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        padding: 80,
      }}
    >
      <TextReveal delay={0}>
        <p
          style={{
            fontSize: 20,
            fontWeight: 500,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            color: COLORS.lightGray,
            letterSpacing: 3,
            textTransform: "uppercase",
            marginBottom: 15,
          }}
        >
          Introducing
        </p>
      </TextReveal>
      <TextReveal delay={15}>
        <h1
          style={{
            fontSize: 88,
            fontWeight: 700,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            color: COLORS.white,
            letterSpacing: -2,
            margin: 0,
          }}
        >
          TASTEID
        </h1>
      </TextReveal>
      <TextReveal delay={30}>
        <p
          style={{
            fontSize: 24,
            fontWeight: 400,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            color: COLORS.gray,
            marginTop: 15,
            marginBottom: 50,
          }}
        >
          Your unique music fingerprint
        </p>
      </TextReveal>

      <div
        style={{
          display: "flex",
          gap: 10,
          alignItems: "flex-end",
          height: 140,
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
                width: 20,
                height: barProgress * height * 140,
                backgroundColor: COLORS.white,
                borderRadius: 3,
                opacity: 0.9,
              }}
            />
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const GapScene = () => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 80,
      }}
    >
      <div style={{ textAlign: "center", maxWidth: 800 }}>
        <TextReveal delay={0}>
          <p
            style={{
              fontSize: 26,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              letterSpacing: -0.3,
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
              fontSize: 26,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              letterSpacing: -0.3,
              lineHeight: 1.6,
              marginTop: 15,
            }}
          >
            RateYourMusic is stuck in 2005.
          </p>
        </TextReveal>
        <TextReveal delay={50}>
          <p
            style={{
              fontSize: 26,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              letterSpacing: -0.3,
              lineHeight: 1.6,
              marginTop: 15,
            }}
          >
            Last.fm is effectively dead.
          </p>
        </TextReveal>
        <TextReveal delay={75}>
          <h2
            style={{
              fontSize: 44,
              fontWeight: 600,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.white,
              letterSpacing: -1,
              marginTop: 50,
            }}
          >
            The market is ours to take.
          </h2>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

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
            fontSize: 110,
            fontWeight: 700,
            fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
            color: COLORS.white,
            letterSpacing: -3,
            margin: 0,
          }}
        >
          WaxFeed
        </h1>
        <TextReveal delay={40}>
          <p
            style={{
              fontSize: 24,
              fontWeight: 400,
              fontFamily: "Helvetica Neue, Helvetica, Arial, sans-serif",
              color: COLORS.gray,
              marginTop: 25,
              letterSpacing: 0.3,
            }}
          >
            Rate albums. Find your music people.
          </p>
        </TextReveal>
      </div>
    </AbsoluteFill>
  );
};

export const WaxFeedPromoSquare: React.FC<WaxFeedPromoSquareProps> = ({ tagline }) => {
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
