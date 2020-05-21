import { Beat, Block, Point, Scene, Video, HSLA, RGBA, Line } from "./types";
import params from "./params";

/**
 * Shuffles an array, and returns a new array.
 *
 * Original array is not modified.
 */
export function shuffleArray<T = any>(
  array: T[],
  disable: boolean = false
): T[] {
  const newArray = array.slice(0);

  if (!disable) {
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
  }

  return newArray;
}

export function clamp(num: number, min: number, max: number) {
  return Math.min(Math.max(num, min), max);
}

export function toBeat(barsBeatsSixteenths: string): Beat {
  const splits = barsBeatsSixteenths.split(":");
  return {
    bars: parseFloat(splits[0]),
    beats: parseFloat(splits[1]),
    sixteenths: parseFloat(splits[2]),
  };
}

export function getIntersection(a: Block, b: Block): Block {
  const aMin: Point = { x: a.x, y: a.y };
  const aMax: Point = { x: a.x + a.width, y: a.y + a.height };
  const bMin: Point = { x: b.x, y: b.y };
  const bMax: Point = { x: b.x + b.width, y: b.y + b.height };

  const maxOfMins: Point = {
    x: Math.max(aMin.x, bMin.x),
    y: Math.max(aMin.y, bMin.y),
  };
  const minOfMaxes: Point = {
    x: Math.min(aMax.x, bMax.x),
    y: Math.min(aMax.y, bMax.y),
  };

  const result: Block = {
    x: maxOfMins.x,
    y: maxOfMins.y,
    width: minOfMaxes.x - maxOfMins.x,
    height: minOfMaxes.y - maxOfMins.y,
  };

  if (result.width <= 0 || result.height <= 0) return null;
  return result;
}

export function getLineBetween(a: Point, b: Point): Line {
  if (a.x === b.x && a.y === b.y) {
    throw new Error("Can't get line between two points that are the same.");
  }

  const slope = a.x === b.x ? Infinity : (a.y - b.y) / (a.x - b.x);
  const intercept = a.y - slope * a.x;
  return { slope, intercept };
}

export function getPointAlongLine(line: Line, { x }: { x: number });
export function getPointAlongLine(line: Line, { y }: { y: number });

export function getPointAlongLine(
  line: Line,
  coord: { x: number } | { y: number }
): Point {
  let { x, y } = coord as any;

  if (x != null) y = line.slope * x + line.intercept;
  if (y != null) x = (y - line.intercept) / line.slope;

  return { x, y };
}

export function getSlope(a: Point, b: Point): number {
  if (a.x === b.x) return Infinity;
  return (a.y - b.y) / (a.x - b.x);
}

export function getDistance(a: Point, b: Point): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

/**
 * Tests whether `a` intersects with `b`.
 */
export function intersects(a: Block, b: Block): boolean {
  if (a.x > b.x + b.width) return false;
  if (a.x + a.width < b.x) return false;
  if (a.y > b.y + b.height) return false;
  if (a.y + a.height < b.y) return false;

  return true;
}

export function enclosedIn(a: Block, b: Block): boolean;
export function enclosedIn(a: Point, b: Block): boolean;

/**
 * Determines whether `a` is enclosed entirely within `b`.
 */
export function enclosedIn(a: any, b: Block): boolean {
  if (a.height != null && a.width != null) {
    // Testing a block.
    if (a.x < b.x) return false;
    if (a.x + a.width > b.x + b.width) return false;
    if (a.y < b.y) return false;
    if (a.y + a.height > b.y + b.height) return false;
  } else {
    // Testing a point.
    if (a.x < b.x) return false;
    if (a.x > b.x + b.width) return false;
    if (a.y < b.y) return false;
    if (a.y > b.y + b.height) return false;
  }

  return true;
}

/**
 * Get the video corresponding to the given scene.
 *
 * Returns `undefined` if the given scene has no corresponding video.
 */
export function getVideoForScene(scene: Scene) {
  return params.videos[getVideoIndexForScene(scene)];
}

/**
 * Get the video index corresponding to the given scene.
 *
 * Returns `-1` if the given scene has no corresponding video.
 */
export function getVideoIndexForScene(scene: Scene) {
  switch (scene) {
    case Scene.Video0:
      return 0;
    case Scene.Video1:
      return 1;
    case Scene.Video2:
      return 2;
    default:
      return -1;
  }
}

/**
 * Get the scene corresponding to the given video
 */
export function getSceneForVideo(video: Video): Scene {
  let videoIndex = -1;
  for (const [index, videoEntry] of params.videos.entries()) {
    if (videoEntry === video) videoIndex = index;
  }

  switch (videoIndex) {
    case 0:
      return Scene.Video0;
    case 1:
      return Scene.Video1;
    case 2:
      return Scene.Video2;
    default:
      return null;
  }
}

/**
 * Calculates the final background transform for the given video.
 */
export const calculateTransformForVideo = (
  videoBounds: Block,
  screenBounds: Block
): { x: number; y: number; scale: number } => {
  const screenAspectRatio = screenBounds.width / screenBounds.height;
  const videoAspectRatio = videoBounds.width / videoBounds.height;

  const widthRatio = screenBounds.width / videoBounds.width;
  const heightRatio = screenBounds.height / videoBounds.height;

  if (screenAspectRatio < videoAspectRatio) {
    // Spill horizontally.
    const newScreenWidth = screenAspectRatio * videoBounds.height;
    const spillPerSide = (videoBounds.width - newScreenWidth) / 2;

    const scale = heightRatio;
    const x = scale * -(videoBounds.x + spillPerSide);
    const y = scale * -videoBounds.y;
    return { x, y, scale };
  } else {
    // Spill vertically.
    const newScreenHeight = videoBounds.width / screenAspectRatio;
    const spillPerSide = (videoBounds.height - newScreenHeight) / 2;

    const scale = widthRatio;
    const x = scale * -videoBounds.x;
    const y = scale * -(videoBounds.y + spillPerSide);
    return { x, y, scale };
  }
};

const lerpNumber = (start: number, end: number, t: number): number =>
  (1 - t) * start + t * end;

const lerpArray = (start: number[], end: number[], t: number): number[] => {
  if (start.length !== end.length) {
    throw new Error("Can't lerp arrays of different lengths.");
  }
  return start.map((startValue, index) =>
    lerpNumber(startValue, end[index], t)
  );
};

const lerpObject = (
  start: { [key: string]: number },
  end: { [key: string]: number },
  t: number
): { [key: string]: number } => {
  const result = {};

  for (const [key, value] of Object.entries(start)) {
    if (typeof end[key] !== "number") {
      throw new Error(`Property ${key} not found on end object.`);
    }
    result[key] = lerpNumber(value, end[key], t);
  }

  return result;
};

export function lerp(start: number, end: number, t: number): number;
export function lerp(start: number[], end: number[], t: number): number[];
export function lerp<T extends { [key: string]: number }>(
  start: T,
  end: T,
  t: number
): T;

export function lerp(start: any, end: any, t: number): any {
  switch (typeof start) {
    case "number":
      return lerpNumber(start, end, t);
    case "object":
      if (Array.isArray(start)) return lerpArray(start, end, t);
      return lerpObject(start, end, t);
    default:
      throw new Error("Don't know how to interpolate this type of thing.");
  }
}

function hslaToString(color: HSLA): string {
  return `hsla(${color.h} ${color.s}% ${color.l}% / ${color.a})`;
}

function rgbaToString(color: RGBA): string {
  return `rgba(${color.r} ${color.g} ${color.b} / ${color.a})`;
}

export function colorToString(color: HSLA): string;
export function colorToString(color: RGBA): string;

export function colorToString(color: any): string {
  if (typeof color !== "object") throw new Error("Colors must be objects.");

  if (["h", "s", "l", "a"].every((c) => color.hasOwnProperty(c))) {
    return hslaToString(color);
  }

  if (["r", "g", "b", "a"].every((c) => color.hasOwnProperty(c))) {
    return rgbaToString(color);
  }

  throw new Error("This isn't a color..");
}
