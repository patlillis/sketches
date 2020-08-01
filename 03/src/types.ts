export type Point = { x: number; y: number };

export type Vector = { x: number; y: number };

export type Line = { slope: number; intercept: number };

export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Bounds = {
  top: number;
  left: number;
  bottom: number;
  right: number;
};

export type Circle = {
  x: number;
  y: number;
  radius: number;
};

export type Video = { bounds: Rect; intersectingBlocks: number[] };

export type Beat = { bars: number; beats: number; sixteenths: number };

export type RGB = { r: number; g: number; b: number };

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

export type Color = RGB | RGBA | HSLA;

export enum Scene {
  Title = "Title",
  Pinata = "Pinata",
  Snowfall = "Snowfall",
  Poolside = "Poolside",
}
