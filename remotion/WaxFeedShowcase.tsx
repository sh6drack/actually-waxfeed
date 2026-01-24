import { AbsoluteFill, Sequence } from "remotion";
import { IntroScene } from "./scenes/showcase/IntroScene";
import { RateShowScene } from "./scenes/showcase/RateShowScene";
import { TasteScene } from "./scenes/showcase/TasteScene";
import { DiscoverScene } from "./scenes/showcase/DiscoverScene";
import { ConnectScene } from "./scenes/showcase/ConnectScene";
import { CTAScene } from "./scenes/showcase/CTAScene";

/**
 * WaxFeed "SHOWCASE" Promo
 *
 * 60-second straightforward product demo (1800 frames @ 30fps)
 * Clearly demonstrates WaxFeed's core features with sleek execution.
 *
 * Scene Structure:
 * 1. INTRO (0:00-0:05) - 150 frames - Logo + "Rate albums. Find your people."
 * 2. RATE (0:05-0:18) - 390 frames - Album rating demo with review
 * 3. YOUR TASTE (0:18-0:30) - 360 frames - TasteID card builds, archetype reveals
 * 4. DISCOVER (0:30-0:42) - 360 frames - Personalized recommendations
 * 5. CONNECT (0:42-0:52) - 300 frames - Friends + compatibility matching
 * 6. CTA (0:52-1:00) - 240 frames - "Join the discourse." + waxfeed.com
 */

export const WaxFeedShowcase: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      {/* Scene 1: INTRO - 0:00-0:05 */}
      <Sequence from={0} durationInFrames={150}>
        <IntroScene />
      </Sequence>

      {/* Scene 2: RATE - 0:05-0:18 */}
      <Sequence from={150} durationInFrames={390}>
        <RateShowScene />
      </Sequence>

      {/* Scene 3: YOUR TASTE - 0:18-0:30 */}
      <Sequence from={540} durationInFrames={360}>
        <TasteScene />
      </Sequence>

      {/* Scene 4: DISCOVER - 0:30-0:42 */}
      <Sequence from={900} durationInFrames={360}>
        <DiscoverScene />
      </Sequence>

      {/* Scene 5: CONNECT - 0:42-0:52 */}
      <Sequence from={1260} durationInFrames={300}>
        <ConnectScene />
      </Sequence>

      {/* Scene 6: CTA - 0:52-1:00 */}
      <Sequence from={1560} durationInFrames={240}>
        <CTAScene />
      </Sequence>
    </AbsoluteFill>
  );
};

// Square variant for social media (1:1)
export const WaxFeedShowcaseSquare: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000000" }}>
      <Sequence from={0} durationInFrames={150}>
        <IntroScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={150} durationInFrames={390}>
        <RateShowScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={540} durationInFrames={360}>
        <TasteScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={900} durationInFrames={360}>
        <DiscoverScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={1260} durationInFrames={300}>
        <ConnectScene width={1080} height={1080} />
      </Sequence>

      <Sequence from={1560} durationInFrames={240}>
        <CTAScene width={1080} height={1080} />
      </Sequence>
    </AbsoluteFill>
  );
};
