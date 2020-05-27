import { Beat, Scene } from "../types";

import params from "./index";
import tombola from "../tombola";
import { pianoArpVolume } from "../audio";
import { lerp } from "../utils";
import { Ease } from "@createjs/tweenjs";

export const randomizeAudio = () => {
  params.audio = {
    piano: { note: tombola.item(["a", "c", "e", "f", "g"]) },
  };
};

export const updateAudioTick = () => {
  // Update volumes while transitioning.
  switch (params.scene.current) {
    case Scene.Main:
      if (params.scene.previous === Scene.Video0) {
        const volume = lerp(10, -100, params.scene.transition, Ease.getPowOut(2));
        pianoArpVolume.volume.value = volume;
      }
      break;
    case Scene.Video0:
      if (params.scene.previous === Scene.Main) {
        const volume = lerp(-100, 10, params.scene.transition, Ease.getPowOut(2));
        pianoArpVolume.volume.value = volume;
      }
      break;

  }
};

export const updateAudioBeat = (beat: Beat) => {
  updatePianoBeat(beat);
};

const updatePianoBeat = (beat: Beat) => {
  const prevNote = params.audio.piano.note;

  let newNote: string;

  if (beat.bars % 2 == 0 && beat.beats % 6 === 0) {
    // E should always be played in 4th measure.
    if (beat.bars % 8 === 6) {
      newNote = "e";
    } else {
      const possibleNotes = ["a", "c", "f", "g"].filter((n) => n !== prevNote);
      newNote = tombola.item(possibleNotes);
    }

    params.audio.piano.note = newNote;
  }
};
