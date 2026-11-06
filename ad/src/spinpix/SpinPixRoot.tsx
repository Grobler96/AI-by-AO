import React from "react";
import { Composition } from "remotion";
import { DURATION, FPS } from "./kit";
import { Spin360 } from "./Spin360";
import { BoothQuiz } from "./BoothQuiz";
import { PartyMontage } from "./PartyMontage";
import { QrGallery } from "./QrGallery";

/* The SpinPix UK client videos (copy and timing marks in spinpix.json). */
const COMPONENTS: Record<string, React.FC> = {
  "spinpix-360": Spin360,
  "spinpix-quiz": BoothQuiz,
  "spinpix-montage": PartyMontage,
  "spinpix-qr": QrGallery,
};

export const SpinPixFilms: React.FC = () => (
  <>
    {Object.entries(COMPONENTS).map(([id, C]) => (
      <Composition key={id} id={id} component={C} durationInFrames={DURATION} fps={FPS} width={1080} height={1920} />
    ))}
  </>
);
