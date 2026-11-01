import { Composition } from "remotion";
import { Ad, DURATION, FPS, ads } from "./Ad";

export const Root = () => (
  <>
    {ads.map((a) => (
      <Composition key={a.id} id={a.id} component={Ad} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} defaultProps={{ adId: a.id }} />
    ))}
  </>
);
