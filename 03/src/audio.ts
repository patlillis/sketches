import * as Tone from "tone";

import * as constants from "./constants";
import { Beat } from "./types";
import { toBeat } from "./utils";
import tombola from "./tombola";
import params, { updateParamsBeat } from "./params";

let pianoPlayers: { [key: string]: Tone.Player } = {};
let currentlyPlayingPianos: { note: string; start: number }[] = [];

let reverb: Tone.JCReverb;

// For testing, can do `window.playPiano('e');`.
declare global {
  interface Window {
    playPiano: (note: string) => void;
  }
}

export const initAudio = async () => {
  // This is a little weird, but this basically makes it 6/8 time in our desired
  // BPM (it's actually 6/4 at twice our BPM).
  Tone.Transport.bpm.value = constants.BPM * 2;
  Tone.Transport.timeSignature = 6;

  const pianoSamples = {
    a: "assets/sounds/piano_a.wav",
    c: "assets/sounds/piano_c.wav",
    e: "assets/sounds/piano_e.wav",
    f: "assets/sounds/piano_f.wav",
    g: "assets/sounds/piano_g.wav",
  };
  let players: Tone.Players;
  await new Promise(
    (resolve) => (players = new Tone.Players(pianoSamples, resolve))
  );
  for (const note of Object.keys(pianoSamples)) {
    const player = players.player(note);
    player.toDestination();
    pianoPlayers[note] = player;
  }

  // Set up instrument loops.
  const loop = new Tone.Loop(mainLoop, "4n");
  loop.start(0);

  window.playPiano = (note) => {
    pianoPlayers[note].start();
  };
};

export const startAudio = async () => {
  await Tone.context.resume();
  await Tone.start();
  await Tone.Transport.start();
};

export async function playAudio() {
  Tone.Transport.start();

  // Re-start all piano parts that were previously playing, and seek to the
  // position they were stopped at.
  const currentTime = Tone.Transport.seconds;
  for (const playing of currentlyPlayingPianos) {
    const player = pianoPlayers[playing.note];
    const offset = currentTime - playing.start;
    player.start();
    player.seek(offset);
  }
}

export async function pauseAudio() {
  Tone.Transport.pause();

  for (const playing of currentlyPlayingPianos) {
    pianoPlayers[playing.note].stop();
  }
}

const mainLoop = () => {
  const time = Tone.Transport.seconds;
  const beat: Beat = toBeat(Tone.Transport.position.toString());

  // Update audio params for this beat.
  updateParamsBeat(beat, time);

  // Play notes for this beat.
  playPiano(beat, time);
};

const playPiano = (beat: Beat, time: number) => {
  if (beat.bars % 2 == 0 && beat.beats % 6 === 0) {
    const { note } = params.audio.piano;
    const player = pianoPlayers[note];

    // Keep track of when each note is played so we can properly pause/restart.
    currentlyPlayingPianos.push({ note, start: time });
    Tone.Transport.scheduleOnce(() => {
      // After player is finished, remove from currently playing list.
      currentlyPlayingPianos = currentlyPlayingPianos.filter(
        (p) => !(p.note === note && p.start === time)
      );
    }, time + player.buffer.duration);

    pianoPlayers[params.audio.piano.note].start();
  }
};
