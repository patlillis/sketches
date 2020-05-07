export type Point = { x: number; y: number };

export type Block = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Video = { bounds: Block };

export type Color = { r: number; g: number; b: number; a?: number };

export type Beat = { bars: number; beats: number; sixteenths: number };
