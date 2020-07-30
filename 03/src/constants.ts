// Debugging constants.
const debugEnabled = new URLSearchParams(window.location.search).has("debug");
export const DEBUG = debugEnabled;
export const debug = {
  enabled: debugEnabled,
  lineWidth: 1,
};

// Audio constants.
export const BPM = 95;

// UI constants.
export const ui = {
  PADDING: 30,
  SIZE: 50,
  THICKNESS: 5,
};
