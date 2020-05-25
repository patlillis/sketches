import { RGBA, HSLA } from "./types";

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

// Audio constants.
export const BPM = 95;

// UI constants.
export const UI_PADDING = 30;
export const UI_SIZE = 50;
export const UI_THICKNESS = 5;

// Timing constants.
export const SCENE_TRANSITION_TIME = 1500;
export const VIDEO_ACTIVE_TRANSITION_TIME = 500;
