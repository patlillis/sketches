export type Point = { x: number; y: number };

export type Block = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Video = { bounds: Block; intersectingBlocks: number[] };

export type Color = { r: number; g: number; b: number; a?: number };

export type Beat = { bars: number; beats: number; sixteenths: number };

export enum Scene {
  Main = "Main",
  // TODO: give these meaningful names based on the video clip.
  Video0 = "Video0",
  Video1 = "Video1",
  Video2 = "Video2",
}
