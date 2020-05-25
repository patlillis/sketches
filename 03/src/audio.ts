import * as Tone from "tone";

import * as constants from "./constants";
import { Beat } from "./types";
import { toBeat } from "./utils";
import tombola from "./tombola";
import params, { updateParamsBeat } from "./params";

let pianoPlayers: { [key: string]: Tone.Player } = {};
let ereignisPlayers: Tone.Player[];

let currentPlaying: { player: Tone.Player; start: number }[] = [];

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

  // Load samples and set up players.
  const pianoNotes = ["a", "c", "e", "f", "g"];
  const pianoSamples = Object.fromEntries(
    pianoNotes.map((note) => [
      `piano_${note}`,
      `assets/sounds/piano_${note}.wav`,
    ])
  );
  const samples = {
    ...pianoSamples,
    ereignis: "assets/sounds/ereignis.wav",
  };
  let loadingPlayers: Tone.Players;
  await new Promise(
    (resolve) => (loadingPlayers = new Tone.Players(samples, resolve))
  );

  // Hook up piano notes.
  const pianoReverb = new Tone.Reverb({
    decay: 10,
    wet: 0.5,
    preDelay: 0,
  });
  const pianoVolume = new Tone.Volume(8);
  for (const note of pianoNotes) {
    const player = loadingPlayers.player(`piano_${note}`);
    player.chain(pianoReverb, pianoVolume, Tone.Destination);
    pianoPlayers[note] = player;
  }

  // Hook up ereignis effect.
  const ereignisVolume = new Tone.Volume(-7);
  const ereignisPlayer = loadingPlayers.player("ereignis");
  ereignisPlayers = [ereignisPlayer, new Tone.Player(ereignisPlayer.buffer)];
  ereignisPlayers[0].chain(ereignisVolume, Tone.Destination);
  ereignisPlayers[1].chain(ereignisVolume, Tone.Destination);

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
  Tone.Destination.mute = false;

  // Re-start all players that were previously playing, and seek to the position
  // they were stopped at.
  const currentTime = Tone.Transport.seconds;
  const currentBeat = toBeat(Tone.Transport.position.toString());
  for (const { player, start } of currentPlaying) {
    const offset = currentTime - start;
    player.start();
    player.seek(offset);
  }
}

export async function pauseAudio() {
  Tone.Transport.pause();
  Tone.Destination.mute = true;

  for (const { player } of currentPlaying) {
    player.stop();
  }
}

const startPlayer = (player: Tone.Player, time: number) => {
  currentPlaying.push({ player, start: time });
  // After player is finished, remove from currently playing list.
  Tone.Transport.scheduleOnce(() => {
    currentPlaying = currentPlaying.filter(
      (p) => !(p.player === player && p.start === time)
    );
  }, time + player.buffer.duration);
  player.start();
};

const mainLoop = () => {
  const time = Tone.Transport.seconds;
  const beat: Beat = toBeat(Tone.Transport.position.toString());

  // Update audio params for this beat.
  updateParamsBeat(beat, time);

  // Play notes for this beat.
  playPiano(beat, time);
  playEreignis(beat, time);
};

const playPiano = (beat: Beat, time: number) => {
  // Play on the first beat of every other bar.
  if (beat.bars % 2 == 0 && beat.beats % 6 === 0) {
    const { note } = params.audio.piano;
    const player = pianoPlayers[note];
    startPlayer(player, time);
  }
};

const playEreignis = (beat: Beat, time: number) => {
  if (beat.bars % 2 == 0 && beat.beats % 6 === 0) {
    const player = ereignisPlayers[(beat.bars / 2) % 2];
    startPlayer(player, time);
  }
};
