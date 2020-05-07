// Video constants.
export const VIDEO_HEIGHT = 240;
export const VIDEO_WIDTH = 427;
export const VIDEO_PADDING = 30;

// Block constants.
export const VIDEO_BLOCK_MAX_OVERHANG_OUTER = 100;
export const VIDEO_BLOCK_MAX_OVERHANG_INNER = 100;
export const VIDEO_BLOCK_MAX_BLOCK_OVERLAP = 30;

const BLOCK_ASPECT_DIFFERENCE = 0.4;
export const BLOCK_MIN_ASPECT = 1.0 - BLOCK_ASPECT_DIFFERENCE;
export const BLOCK_MAX_ASPECT = 1.0 + BLOCK_ASPECT_DIFFERENCE;
export const BLOCK_MIN_SIZE = 100;
export const BLOCK_MAX_SIZE = 150;

export const BLOCK_BASE_COLOR = {
  r: 30,
  g: 0,
  b: 27,
};

// Audio constants.
export const BPM = 95;

// Play/pause constants.
export const PLAY_PAUSE_PADDING = 30;
export const PLAY_PAUSE_SIZE = 50;
