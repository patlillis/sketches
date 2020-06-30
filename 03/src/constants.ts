export const DEBUG = new URLSearchParams(window.location.search).has("debug");

// Audio constants.
export const BPM = 95;

// UI constants.
export const ui = {
  PADDING: 30,
  SIZE: 50,
  THICKNESS: 5,
};

// Circle constants.
export const circle = {
  CIRCLE_COUNT: 15,
  MIN_SPEED: 0.01,
  MAX_SPEED: 0.1,
  MAX_CENTER_OFFEST_PCT: 0.04,
  MIN_EDGE_PADDING_PCT: 0.1,
  MAX_EDGE_PADDING_PCT: 0.3,
};
