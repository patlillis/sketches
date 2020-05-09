import { Block, Video, Color, Beat } from "../types";

import { randomizeVideos, updateVideosTick, updateVideosBeat } from "./videos";
import { randomizeBlocks, updateBlocksTick, updateBlocksBeat } from "./blocks";
import { randomizeAudio, updateAudioBeat, updateAudioTick } from "./audio";

type Params = {
  videos: Array<Video>;
  blocks: Array<Block & { color: Color; colorChangeDirection: number }>;
  audio: {
    piano: {
      note: string;
    };
  };
};

/**
 * Randomized parameters that control how the scene renders.
 */
export default {} as Params;

/**
 * Re-randomize the params.
 */
export const randomizeParams = (
  screenWidth: number,
  screenHeight: number
): void => {
  randomizeVideos(screenWidth, screenHeight);
  randomizeBlocks(screenWidth, screenHeight);
  randomizeAudio();
};

/**
 * Update the current params. Should be called every frame.
 */
export const updateParamsTick = () => {
  updateVideosTick();
  updateBlocksTick();
  updateAudioTick();
};

/**
 * Update params per beat.
 */
export const updateParamsBeat = (beat: Beat, time: number) => {
  updateVideosBeat(beat);
  updateBlocksBeat(beat);
  updateAudioBeat(beat);
};
