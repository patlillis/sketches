import { Block, Video, Beat, Scene, RGBA, Vector } from "../types";

import { randomizeVideos, updateVideosTick, updateVideosBeat } from "./videos";
import { randomizeBlocks, updateBlocksTick, updateBlocksBeat } from "./blocks";
import { randomizeAudio, updateAudioBeat, updateAudioTick } from "./audio";
import { initSceneParams } from "./scene";

type Params = {
  scene: {
    current: Scene;
    previous: Scene;
    transition: number;
  };
  videos: Array<Video>;
  blocks: Array<
    Block & {
      color: RGBA;
      colorChangeDirection: number;
      intersectingVideos: { intersects: boolean; adjustment: Block }[];
    }
  >;
  audio: {
    piano: {
      note: string;
    };
  };
};

/**
 * Randomized parameters that control how the scene renders.
 */
const params = {} as Params;
export default params;

/**
 * Randomly initialize params.
 */
export const initParams = (screenWidth: number, screenHeight: number) => {
  initSceneParams();
  randomizeParams(screenWidth, screenHeight);
};

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
