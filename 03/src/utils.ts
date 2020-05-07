import { Beat, Block, Point } from "./types";

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
