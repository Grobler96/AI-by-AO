import { Composition } from "remotion";
import { Ad, DURATION, FPS, ads } from "./Ad";
import { PhoneStory, STORY_DURATION, STORY_FPS, stories } from "./PhoneStory";
import { BrandFilm, BRAND_DURATION, BRAND_FPS } from "./BrandFilm";
import { SpinPixFilms } from "./spinpix/SpinPixRoot";

export const Root = () => (
  <>
    {ads.map((a) => (
      <Composition key={a.id} id={a.id} component={Ad} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ adId: a.id }} />
    ))}
    {stories.map((s) =>
      s.id === "brand-film" ? (
        <Composition key={s.id} id={s.id} component={BrandFilm} durationInFrames={BRAND_DURATION} fps={BRAND_FPS} width={1080} height={1920} defaultProps={{ storyId: s.id }} />
      ) : (
        <Composition key={s.id} id={s.id} component={PhoneStory} durationInFrames={STORY_DURATION} fps={STORY_FPS} width={1080} height={1920} defaultProps={{ storyId: s.id }} />
      )
    )}
    <SpinPixFilms />
  </>
);
