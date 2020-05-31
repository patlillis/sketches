import { Beat, Scene } from "../types";

import params from "./index";
import tombola from "../tombola";
import { pianoArpVolume, periodischVolume } from "../audio";
import { lerp } from "../utils";
import { Ease } from "@createjs/tweenjs";

export const randomizeAudio = () => {
  params.audio = {
    piano: { note: tombola.item(["a", "c", "e", "f", "g"]) },
  };
};

// TODO: better transition curves (gets screwed up because
// "params.scene.previous" is actually eased from 0-1, instead of being linear).
export const updateAudioTick = () => {
  // Update volumes while transitioning.
  switch (params.scene.current) {
    case Scene.Main:
      if (params.scene.previous === Scene.Video0) {
        // Set piano arp volume.
        const newPianoArpVolume = lerp(
          10,
          -100,
          params.scene.transition,
          Ease.getPowIn(4)
        );
        pianoArpVolume.volume.value = newPianoArpVolume;
        // Set periodisch volume.
        const newPeriodischVolume = lerp(
          -5,
          -100,
          params.scene.transition,
          Ease.getPowIn(4)
        );
        periodischVolume.volume.value = newPeriodischVolume;
      }
      break;
    case Scene.Video0:
      if (params.scene.previous === Scene.Main) {
        // Set piano arp volume.
        const newPianoArpVolume = lerp(
          -100,
          10,
          params.scene.transition,
          Ease.getPowOut(4)
        );
        pianoArpVolume.volume.value = newPianoArpVolume;
        // Set periodisch volume.
        const newPeriodischVolume = lerp(
          -100,
          -5,
          params.scene.transition,
          Ease.getPowOut(4)
        );
        periodischVolume.volume.value = newPeriodischVolume;
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
