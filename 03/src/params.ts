// Random params.

import { Point, Vector } from "./types";

type Params = {
  circles: {
    currentCenter: Point;
    radius: number;
    speed: number;
  };
};

/**
 * Randomized parameters that control how the scene renders.
 */
const params = {} as Params;
export default params;

/**
 * Randomly initialize params.
 */
export const initParams = (screenSize: Vector) => {};

export const resizeParams = (
  oldScreenSize: Vector,
  newScreenSize: Vector
) => {};
