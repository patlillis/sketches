import { Beat } from "../types";

import params from "./index";
import tombola from "../tombola";

export const randomizeAudio = () => {
  params.audio = {
    piano: { note: tombola.item(["a", "c", "e", "f", "g"]) },
  };
};

export const updateAudioTick = () => {};

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
