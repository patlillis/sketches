import * as Tone from "tone";

import * as constants from "./constants";
import { Beat } from "./types";
import { toBeat } from "./utils";
import tombola from "./tombola";
import params, { updateParamsBeat } from "./params";

let pianoPlayers: Tone.Players;
let reverb: Tone.JCReverb;

// For testing, can do `window.playPiano('e');`.
declare global {
  interface Window {
    playPiano: (note: string) => void;
  }
}

export const initAudio = async () => {
  // This is a little weird, but this basically makes it 6/8 time in our desired
  // BPM.
  // Tone.Transport.pause();
  Tone.Transport.bpm.value = constants.BPM * 2;
  Tone.Transport.timeSignature = 6;

  const pianoSamples = {
    a: "assets/sounds/piano_a.wav",
    c: "assets/sounds/piano_c.wav",
    e: "assets/sounds/piano_e.wav",
    f: "assets/sounds/piano_f.wav",
    g: "assets/sounds/piano_g.wav",
  };
  await new Promise(
    (resolve) => (pianoPlayers = new Tone.Players(pianoSamples, resolve))
  );
  pianoPlayers.toDestination();

  // Set up instrument loops.
  const loop = new Tone.Loop(mainLoop, "4n");
  loop.start(0);

  window.playPiano = (note) => {
    pianoPlayers.player(note).start();
  };
};

export const startAudio = async () => {
  await Tone.context.resume();
  await Tone.start();
  await Tone.Transport.start();
};

export async function playAudio() {
  Tone.Transport.start();
}

export async function pauseAudio() {
  Tone.Transport.pause();
}

const mainLoop = (time: number) => {
  const beat: Beat = toBeat(Tone.Transport.position.toString());
  console.log(beat);

  // Update audio params for this beat.
  updateParamsBeat(beat);

  // Play notes for this beat.
  playPiano(beat);
};

const playPiano = (beat: Beat) => {
  if (beat.bars % 2 == 0 && beat.beats % 6 === 0) {
    pianoPlayers.player(params.audio.piano.note).start();
  }
};
