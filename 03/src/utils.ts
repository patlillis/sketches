import {
  Beat,
  Rect,
  Point,
  HSLA,
  RGBA,
  Line,
  Vector,
  Bounds,
  Color,
  Circle,
  RGB,
} from "./types";

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

export function add(a: Vector, b: Vector): Vector {
  return { x: a.x + b.x, y: a.y + b.y };
}

export function subtract(a: Vector, b: Vector): Vector {
  return { x: a.x - b.x, y: a.y - b.y };
}

export function getIntersection(a: Rect, b: Rect): Rect {
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

  const result: Rect = {
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

export function getPointAlongLine(line: Line, { x }: { x: number }): Point;
export function getPointAlongLine(line: Line, { y }: { y: number }): Point;

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

export function scale(v: Vector, s: number): Vector {
  return { x: v.x * s, y: v.y * s };
}

export function getBounds(r: Rect): Bounds {
  return {
    left: r.x,
    top: r.y,
    bottom: r.y + r.height,
    right: r.x + r.width,
  };
}

export function getRect(b: Bounds): Rect {
  return {
    x: b.left,
    y: b.top,
    width: b.right - b.left,
    height: b.bottom - b.top,
  };
}

/**
 * Tests whether `a` intersects with `b`.
 */
export function intersects(a: Rect, b: Rect): boolean {
  if (a.x > b.x + b.width) return false;
  if (a.x + a.width < b.x) return false;
  if (a.y > b.y + b.height) return false;
  if (a.y + a.height < b.y) return false;

  return true;
}

export function enclosedIn(a: Rect, b: Rect): boolean;
export function enclosedIn(a: Point, b: Rect): boolean;
export function enclosedIn(a: Point, b: Circle): boolean;

/**
 * Determines whether `a` is enclosed entirely within `b`.
 */
export function enclosedIn(a: any, b: any): boolean {
  if (a.height != null && a.width != null) {
    // Testing a rect is enclosed in a rect.
    const aRect = a as Rect;
    const bRect = b as Rect;
    if (aRect.x < bRect.x) return false;
    if (aRect.x + aRect.width > bRect.x + bRect.width) return false;
    if (aRect.y < bRect.y) return false;
    if (aRect.y + aRect.height > bRect.y + bRect.height) return false;
    return true;
  }

  if (b.radius != null) {
    // Testing if a point is enclosed in a circle.
    const aPoint = a as Point;
    const bCircle = b as Circle;
    if (
      (aPoint.x - bCircle.x) ** 2 + (aPoint.y - bCircle.y) ** 2 >
      bCircle.radius ** 2
    ) {
      return false;
    }
    return true;
  }

  // Testing if a point is enclosed in a rect.
  const aPoint = a as Point;
  const bRect = b as Rect;
  if (aPoint.x < bRect.x) return false;
  if (aPoint.x > bRect.x + bRect.width) return false;
  if (aPoint.y < bRect.y) return false;
  if (aPoint.y > bRect.y + bRect.height) return false;
  return true;
}

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

export type Ease = (amount: number) => number;

export function lerp(
  start: number,
  end: number,
  t: number,
  ease?: Ease
): number;
export function lerp(
  start: number[],
  end: number[],
  t: number,
  ease?: Ease
): number[];
export function lerp<T extends { [key: string]: number }>(
  start: T,
  end: T,
  t: number,
  ease?: Ease
): T;

export function lerp(start: any, end: any, t: number, ease?: Ease): any {
  const adjustedT = ease?.(t) ?? t;

  switch (typeof start) {
    case "number":
      return lerpNumber(start, end, adjustedT);
    case "object":
      if (Array.isArray(start)) return lerpArray(start, end, adjustedT);
      return lerpObject(start, end, adjustedT);
    default:
      throw new Error("Don't know how to interpolate this type of thing.");
  }
}

export function inverseLerp(
  start: number,
  end: number,
  value: number,
  inverseEase?: Ease
): number {
  const t = start === end ? 0 : (value - start) / (end - start);
  return inverseEase?.(t) ?? t;
}

export function remapValues(
  input: { start: number; end: number },
  output: { start: number; end: number },
  value: number,
  ease?: Ease
): number {
  const t = inverseLerp(input.start, input.end, value);
  return lerp(output.start, output.end, t, ease);
}

function hslaToString(color: HSLA): string {
  return `hsla(${color.h} ${color.s}% ${color.l}% / ${color.a})`;
}

function rgbaToString(color: RGBA): string {
  return `rgba(${color.r} ${color.g} ${color.b} / ${color.a})`;
}

function rgbToString(color: RGB): string {
  return `rgba(${color.r} ${color.g} ${color.b})`;
}

export function colorToString(color: Color): string {
  if (typeof color !== "object") throw new Error("Colors must be objects.");

  if (["h", "s", "l", "a"].every((c) => color.hasOwnProperty(c))) {
    return hslaToString(color as HSLA);
  }

  if (["r", "g", "b", "a"].every((c) => color.hasOwnProperty(c))) {
    return rgbaToString(color as RGBA);
  }

  if (["r", "g", "b"].every((c) => color.hasOwnProperty(c))) {
    return rgbToString(color as RGB);
  }

  throw new Error("This isn't a color..");
}

/**
 * Converts an RGBA color value to HSLA.
 */
export function rgbaToHsla(color: RGBA): HSLA {
  const adjusted = {
    r: color.r / 255,
    g: color.g / 255,
    b: color.b / 255,
  };

  const max = Math.max(adjusted.r, adjusted.g, adjusted.b);
  const min = Math.min(adjusted.r, adjusted.g, adjusted.b);
  const delta = max - min;

  let h: number;
  let s: number;
  let l: number;

  if (delta == 0) {
    // No difference.
    h = 0;
  } else if (max == adjusted.r) {
    // Red is max.
    h = ((adjusted.g - adjusted.b) / delta) % 6;
  } else if (max == adjusted.g) {
    // Green is max.
    h = (adjusted.b - adjusted.r) / delta + 2;
  } else {
    // Blue is max.
    h = (adjusted.r - adjusted.g) / delta + 4;
  }

  h = Math.round(h * 60);

  // Make negative hues positive behind 360°.
  if (h < 0) h += 360;

  // Calculate lightness
  l = (max + min) / 2;

  // Calculate saturation
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));

  // Multiply l and s by 100
  s = parseInt((s * 100).toFixed(1), 10);
  l = parseInt((l * 100).toFixed(1), 10);

  return { h, s, l, a: color.a };
}

/**
 * Calcualates a point on the circle, at `offset` radians (going
 * counter-clockwise).
 */
export function getPointOnCircle(circle: Circle, offset: number): Point {
  return {
    x: circle.x + circle.radius * Math.cos(-offset),
    y: circle.y + circle.radius * Math.sin(-offset),
  };
}

/**
 * Gets the angle (in radians) from point1 to point2.
 */
export function getAngle(point1: Point, point2: Point): number {
  var dx = point1.x - point2.x;
  var dy = point1.y - point2.y;
  return Math.atan2(dy, dx);
}

/**
 * Constructs a set of functions, based on the current canvas size, that helps
 * translate unit values or objects into actual canvas values or objects.
 *
 * This helps keep the scene responsive to changing screen sizes and aspect
 * ratios.
 */
export function buildUnitFuntions(
  minCanvasSize: number,
  canvasCenter: Point
): {
  /** Scales an arbitrary multiplier by the current unit size of the canvas. */
  unit: (multiplier: number) => number;

  /** Positions a point on the unit grid of the drawing canvas. */
  unitPoint: (position: Point) => Point;

  /** Positions and scales a rect on the unit grid of the drawing canvas. */
  unitRect: {
    (rect: Rect): Rect;
    (bounds: Bounds): Rect;
  };

  /** Positions and scales a bounds on the unit grid of the drawing canvas. */
  unitBounds: {
    (rect: Rect): Bounds;
    (bounds: Bounds): Bounds;
  };

  /** Positions and scales a circle on the unit grid of the drawing canvas. */
  unitCircle: (circle: Circle) => Circle;
} {
  const unit = (multiplier: number): number => minCanvasSize * multiplier;

  const unitPoint = (position: Point): Point => ({
    x: canvasCenter.x + unit(position.x - 0.5),
    y: canvasCenter.y + unit(position.y - 0.5),
  });

  const unitRect = (rectOrBounds: any): Rect => {
    let rect: Rect;
    if (rectOrBounds.height != null && rectOrBounds.width != null) {
      // Transforming a Rect.
      rect = rectOrBounds as Rect;
    } else {
      // Transforming a Bounds.
      rect = getRect(rectOrBounds as Bounds);
    }
    return {
      ...unitPoint(rect),
      width: unit(rect.width),
      height: unit(rect.height),
    };
  };

  const unitBounds = (rectOrBounds: any): Bounds => {
    const rect = unitRect(rectOrBounds);
    return getBounds(rect);
  };

  const unitCircle = (circle: Circle): Circle => ({
    ...unitPoint(circle),
    radius: unit(circle.radius),
  });

  return {
    unit,
    unitPoint,
    unitRect,
    unitBounds,
    unitCircle,
  };
}
