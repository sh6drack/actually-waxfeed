import { Composition, Folder } from "remotion";
import { WaxFeedPromo } from "./WaxFeedPromo";
import { WaxFeedPromoSquare } from "./WaxFeedPromoSquare";
import { WaxFeedFrequency, WaxFeedFrequencySquare } from "./WaxFeedFrequency";
import { WaxFeedFrequency2, WaxFeedFrequency2Vertical } from "./WaxFeedFrequency2";
import { WaxFeedShowcase, WaxFeedShowcaseSquare } from "./WaxFeedShowcase";
import { WaxFeedInvestorPromo, WaxFeedInvestorPromoSquare } from "./WaxFeedInvestorPromo";

export const RemotionRoot = () => {
  return (
    <Folder name="WaxFeed">
      {/* FREQUENCY 2.0 - Gen Z Cut: 30 seconds of pure dopamine */}
      <Composition
        id="WaxFeedFrequency2"
        component={WaxFeedFrequency2}
        durationInFrames={900}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="WaxFeedFrequency2Vertical"
        component={WaxFeedFrequency2Vertical}
        durationInFrames={900}
        fps={30}
        width={1080}
        height={1920}
      />

      {/* INVESTOR PROMO - Brutalist pitch video: 35 seconds */}
      <Composition
        id="WaxFeedInvestorPromo"
        component={WaxFeedInvestorPromo}
        durationInFrames={1050}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="WaxFeedInvestorPromoSquare"
        component={WaxFeedInvestorPromoSquare}
        durationInFrames={1050}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* FREQUENCY - Cinematic 90s promo with data visualization */}
      <Composition
        id="WaxFeedFrequency"
        component={WaxFeedFrequency}
        durationInFrames={2700}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="WaxFeedFrequencySquare"
        component={WaxFeedFrequencySquare}
        durationInFrames={2700}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* SHOWCASE - Straightforward product demo */}
      <Composition
        id="WaxFeedShowcase"
        component={WaxFeedShowcase}
        durationInFrames={1800}
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="WaxFeedShowcaseSquare"
        component={WaxFeedShowcaseSquare}
        durationInFrames={1800}
        fps={30}
        width={1080}
        height={1080}
      />

      {/* Original simple promos */}
      <Composition
        id="WaxFeedPromo"
        component={WaxFeedPromo}
        durationInFrames={500}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{
          tagline: "Rate albums. Find your music people.",
        }}
      />
      <Composition
        id="WaxFeedPromoSquare"
        component={WaxFeedPromoSquare}
        durationInFrames={500}
        fps={30}
        width={1080}
        height={1080}
        defaultProps={{
          tagline: "Rate albums. Find your music people.",
        }}
      />
    </Folder>
  );
};
