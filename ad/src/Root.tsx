import { Composition } from "remotion";
import { Ad, DURATION, FPS } from "./Ad";

export const Root = () => (
  <Composition id="Ad" component={Ad} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
);
