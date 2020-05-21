export type Point = { x: number; y: number };

export type Vector = { x: number; y: number };

export type Line = { slope: number; intercept: number };

export type Block = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Video = { bounds: Block; intersectingBlocks: number[] };

export type Beat = { bars: number; beats: number; sixteenths: number };

export type RGBA = { r: number; g: number; b: number; a: number };

export type HSLA = {
  /** Hue, in degress */
  h: number;
  /** Saturation, in percentage. Should be from 0-100. */
  s: number;
  /** Lightness, in percentage. Should be from 0-100. */
  l: number;
  /** Alpha. Should be from 0-1. */
  a: number;
};

export enum Scene {
  Main = "Main",
  // TODO: give these meaningful names based on the video clip.
  Video0 = "Video0",
  Video1 = "Video1",
  Video2 = "Video2",
}
