export type Block = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Tests whether `a` intersects with `b`.
 */
export const intersects = (a: Block, b: Block): boolean => {
  if (a.x > b.x + b.width) return false;
  if (a.x + a.width < b.x) return false;
  if (a.y > b.y + b.height) return false;
  if (a.y + a.height < b.y) return false;

  return true;
};

/**
 * Determines whether `a` is enclosed entirely within `b`.
 */
export const enclosedIn = (a: Block, b: Block): boolean => {
  if (a.x < b.x) return false;
  if (a.x + a.width > b.x + b.width) return false;
  if (a.y < b.y) return false;
  if (a.y + a.height > b.y + b.height) return false;

  return true;
};

export type Video = { bounds: Block };

export type Color = { r: number; g: number; b: number; a?: number };

export type Beat = { bars: number; beats: number; sixteenths: number };

export const toBeat = (barsBeatsSixteenths: string): Beat => {
  const splits = barsBeatsSixteenths.split(":");
  return {
    bars: parseFloat(splits[0]),
    beats: parseFloat(splits[1]),
    sixteenths: parseFloat(splits[2]),
  };
};
