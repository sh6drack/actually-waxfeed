import { Composition, Folder } from "remotion";
import { WaxFeedPromo } from "./WaxFeedPromo";
import { WaxFeedPromoSquare } from "./WaxFeedPromoSquare";
import { WaxFeedFrequency, WaxFeedFrequencySquare } from "./WaxFeedFrequency";
import { WaxFeedShowcase, WaxFeedShowcaseSquare } from "./WaxFeedShowcase";

export const RemotionRoot = () => {
  return (
    <Folder name="WaxFeed">
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
