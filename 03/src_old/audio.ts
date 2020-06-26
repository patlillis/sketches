import * as Tone from "tone";

import * as constants from "./constants";
import { Beat, Scene } from "./types";
import { toBeat } from "./utils";
import params, { updateParamsBeat } from "./params";

let pianoPlayers: { [note: string]: Tone.Player } = {};
let pianoArpPlayer: Tone.Player;
let ereignisPlayers: Tone.Player[];
let periodischPlayer: Tone.Player;
let obertonreichPlayers: {
  [note: string]: {
    player: Tone.Player;
    envelope: Tone.Envelope;
  };
} = {};

let currentlyPlaying: {
  player: Tone.Player;
  start: number;
  afterStopEvent: Tone.ToneEvent;
}[] = [];

const master = new Tone.Volume(0);
const meter = new Tone.Meter({ smoothing: 0.7 });
master.chain(meter, Tone.Destination);

/** These are the controls exposed to other components to tweak/tween. */
export const periodischVolume = new Tone.Volume(-100);
export const pianoArpVolume = new Tone.Volume(-100);
export const videoVolumes: Tone.Volume[] = [];
export const startPlayingObertonreich = (note: string) => {
  const { envelope } = obertonreichPlayers[note];
  envelope.triggerAttack();
};
export const stopPlayingObertonreich = (note: string) => {
  const { envelope } = obertonreichPlayers[note];
  envelope.triggerRelease();
};
export { meter };

// For testing, can do `window.playPiano('e');`.
declare global {
  interface Window {
    playPiano: (note: string) => void;
  }
}

export const initAudio = async (videoElements: HTMLVideoElement[]) => {
  // This is a little weird, but this basically makes it 6/8 time in our desired
  // BPM (it's actually 6/4 at twice our BPM).
  Tone.Transport.bpm.value = constants.BPM * 2;
  Tone.Transport.timeSignature = 6;

  // Load samples and set up players.
  const pianoNotes = ["a", "c", "e", "f", "g"];
  const pianoSamples = Object.fromEntries(
    pianoNotes.map((note) => [
      `piano_${note}`,
      `assets/sounds/piano/${note}.wav`,
    ])
  );
  const obertonreichNotes = [
    "d4",
    "e4",
    "g4",
    "a4",
    "b4",
    "c5",
    "d5",
    "e5",
    "g5",
  ];
  const obertonreichSamples = Object.fromEntries(
    obertonreichNotes.map((note) => [
      `obertonreich_${note}`,
      `assets/sounds/obertonreich/${note}.wav`,
    ])
  );
  const samples = {
    ...pianoSamples,
    ...obertonreichSamples,
    piano_arp: "assets/sounds/piano_arp.wav",
    ereignis: "assets/sounds/ereignis.wav",
    periodisch: "assets/sounds/periodisch.wav",
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
    player.chain(pianoReverb, pianoVolume, master);
    pianoPlayers[note] = player;
  }

  // Hooke up piano arp.
  pianoArpPlayer = loadingPlayers.player("piano_arp");
  const pianoArpReverb = new Tone.Reverb({
    decay: 10,
    wet: 0.5,
    preDelay: 0,
  });
  pianoArpPlayer.chain(pianoArpReverb, pianoArpVolume, master);

  // Hook up ereignis effect.
  const ereignisVolume = new Tone.Volume(-7);
  const ereignisPlayer = loadingPlayers.player("ereignis");
  ereignisPlayers = [ereignisPlayer, new Tone.Player(ereignisPlayer.buffer)];
  ereignisPlayers[0].chain(ereignisVolume, master);
  ereignisPlayers[1].chain(ereignisVolume, master);

  // Hook up periodisch effect.
  periodischPlayer = loadingPlayers.player("periodisch");
  periodischPlayer.loop = true;
  periodischPlayer.chain(periodischVolume, master);

  // Hook up obertonreich samples.
  const obertonreichLimiter = new Tone.Limiter(0);
  obertonreichLimiter.chain(master);
  for (const note of obertonreichNotes) {
    const player = loadingPlayers.player(`obertonreich_${note}`);
    player.loop = true;
    const reverb = new Tone.Reverb({
      decay: 20,
      wet: 0.7,
      preDelay: 0,
    });
    const volume = new Tone.Volume(-6);
    const envelope = new Tone.AmplitudeEnvelope({
      attack: 0.1,
      decay: 0,
      sustain: 1,
      release: 10,
    });
    obertonreichPlayers[note] = { player, envelope };
    player.chain(reverb, volume, envelope, obertonreichLimiter);
  }

  // Hook up video audio through Tone.js
  for (const video of videoElements) {
    const videoVolume = new Tone.Volume(-100);
    videoVolume.connect(master);
    videoVolumes.push(videoVolume);
    const context = Tone.context.rawContext as AudioContext;
    const videoSource = context.createMediaElementSource(video);
    Tone.connect(videoSource, videoVolume);
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
  Tone.Destination.mute = false;

  // Re-start all players that were previously playing, and seek to the position
  // they were stopped at.
  const currentTime = Tone.Transport.seconds;
  for (const { player, start } of currentlyPlaying) {
    const offset = currentTime - start;
    player.start();
    player.seek(offset);
  }
}

export async function pauseAudio() {
  Tone.Transport.pause();
  Tone.Destination.mute = true;

  for (const { player } of currentlyPlaying) {
    player.stop();
  }
}

const startPlayer = (player: Tone.Player) => {
  const start = Tone.Transport.seconds;

  // Remove current playing record for this player.
  currentlyPlaying = currentlyPlaying.filter((p) => p.player !== player);

  // After player is finished, remove from currently playing list.
  let afterStopEvent: Tone.ToneEvent;
  if (!player.loop) {
    afterStopEvent = new Tone.ToneEvent(() => {
      currentlyPlaying = currentlyPlaying.filter(
        (p) => !(p.player === player && p.start === start)
      );
    });
    afterStopEvent.start(start + player.buffer.duration);
  }
  currentlyPlaying.push({ player, start, afterStopEvent });
  player.start(start, 0);
};

const stopPlayer = (player: Tone.Player) => {
  player.stop();
  const currentlyPlayingRecords = currentlyPlaying.filter(
    (p) => p.player === player
  );
  for (const { afterStopEvent } of currentlyPlayingRecords) {
    if (afterStopEvent != null) afterStopEvent.cancel();
  }

  // Remove current playing record for this player.
  currentlyPlaying = currentlyPlaying.filter((p) => p.player !== player);
};

const mainLoop = () => {
  const beat: Beat = toBeat(Tone.Transport.position.toString());

  // Update audio params for this beat.
  updateParamsBeat(beat);

  // Play notes for this beat.
  playPiano(beat);
  playPianoArp(beat);
  playEreignis(beat);
  playPeriodisch(beat);
  playObertonreich(beat);
};

const playPiano = (beat: Beat) => {
  // Play on the first beat of every other bar.
  if (beat.bars % 2 == 0 && beat.beats % 6 === 0) {
    const { note } = params.audio.piano;
    const player = pianoPlayers[note];
    startPlayer(player);
  }
};

const playPianoArp = (beat: Beat) => {
  if (beat.bars % 8 == 0 && beat.beats % 6 === 0) {
    startPlayer(pianoArpPlayer);
  }
};

const playEreignis = (beat: Beat) => {
  if (beat.bars % 2 == 0 && beat.beats % 6 === 0) {
    const player = ereignisPlayers[(beat.bars / 2) % 2];
    startPlayer(player);
  }
};

const playPeriodisch = (beat: Beat) => {
  // Just start playing at beginning, and control volume manually.
  if (beat.bars === 0 && beat.beats === 0) {
    startPlayer(periodischPlayer);
  }
};

const playObertonreich = (beat: Beat) => {
  // Just start playing at beginning, and control volume manually.
  if (beat.bars === 0 && beat.beats === 0) {
    for (const { player } of Object.values(obertonreichPlayers)) {
      startPlayer(player);
    }
  }
};
