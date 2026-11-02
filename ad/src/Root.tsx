import { Composition } from "remotion";
import { Ad, DURATION, FPS, ads } from "./Ad";
import { PhoneStory, STORY_DURATION, STORY_FPS, stories } from "./PhoneStory";

export const Root = () => (
  <>
    {ads.map((a) => (
      <Composition key={a.id} id={a.id} component={Ad} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ adId: a.id }} />
    ))}
    {stories.map((s) => (
      <Composition key={s.id} id={s.id} component={PhoneStory} durationInFrames={STORY_DURATION} fps={STORY_FPS} width={1080} height={1920} defaultProps={{ storyId: s.id }} />
    ))}
  </>
);
