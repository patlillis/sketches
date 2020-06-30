import { Tween, Ease, Ticker } from "@createjs/tweenjs";

import * as constants from "./constants";
import {
  colorToString,
  remapValues,
  getPointOnCircle,
  lerp,
  inverseLerp,
  getDistance,
} from "./utils";
import { Point, Scene, Vector, Circle } from "./types";
import { meter } from "./audio";
import { Palette, loadPalette } from "./palette";
import { resizeParams } from "./params";
import tombola from "./tombola";

export let videoElements: HTMLVideoElement[];
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;
export let palette: Palette;

let previousFrameTime: number;
let currentScene: Scene = Scene.Circle;

// Variables for Circle scene.
const circles: {
  speed: number;
  radius: number;
  centerOffset: Vector;
  currentSpinPosition: number;
}[] = Array.from({
  length: constants.circle.CIRCLE_COUNT,
}).map(() => {
  return {
    speed: tombola.rangeFloat(
      constants.circle.MIN_SPEED,
      constants.circle.MAX_SPEED
    ),
    radius: tombola.rangeFloat(
      0.5 - constants.circle.MAX_EDGE_PADDING_PCT,
      0.5 - constants.circle.MIN_EDGE_PADDING_PCT
    ),
    centerOffset: {
      x: tombola.rangeFloat(
        -constants.circle.MAX_CENTER_OFFEST_PCT,
        constants.circle.MAX_CENTER_OFFEST_PCT
      ),
      y: tombola.rangeFloat(
        -constants.circle.MAX_CENTER_OFFEST_PCT,
        constants.circle.MAX_CENTER_OFFEST_PCT
      ),
    },
    currentSpinPosition: tombola.rangeFloat(0, 2 * Math.PI),
  };
});
let circleSpeedMultiplier = constants.circle.MIN_SPEED_MODIFIER;

declare global {
  interface Window {
    /** For testing, can do `window.setScene("Title")`. */
    setScene: (scene: string) => void;
  }
}
window.setScene = (scene: Scene) => {
  currentScene = scene;
};

export const initScene = async (
  canvas: HTMLCanvasElement,
  videos: HTMLVideoElement[]
) => {
  // Load color palette.
  palette = await loadPalette("assets/palette.png");

  // Store references to important variables.
  canvasElement = canvas;
  ctx = canvasElement.getContext("2d");
  videoElements = videos;

  // Add canvas event listeners.
  canvasElement.addEventListener(
    "mousedown",
    ({ pageX: x, pageY: y }) => onMouseClick({ x, y }),
    {
      capture: false,
      passive: true,
    }
  );
  canvasElement.addEventListener(
    "mousemove",
    ({ pageX: x, pageY: y }) => onMouseMove({ x, y }),
    { capture: false }
  );
  canvasElement.addEventListener(
    "mouseup",
    ({ pageX: x, pageY: y }) => onMouseRelease({ x, y }),
    {
      capture: false,
      passive: true,
    }
  );
  canvasElement.addEventListener(
    "mouseleave",
    ({ pageX: x, pageY: y }) => onMouseRelease({ x, y }),
    {
      capture: false,
      passive: true,
    }
  );

  // Initialize canvas size.
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;

  // Make sure tweenjs updates timing properly.
  Ticker.timingMode = Ticker.RAF;
};

const wrapDraw = (drawFunc: () => void) => {
  ctx.save();
  drawFunc();
  ctx.restore();
};

const draw = (time: number) => {
  // Track FPS.
  const now = performance.now();
  let fps: number;
  if (previousFrameTime != null) {
    const frameMs = now - previousFrameTime;
    fps = 1000 / frameMs;
  }
  previousFrameTime = now;

  // Clear.
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw background.
  wrapDraw(() => {
    ctx.fillStyle = colorToString(palette.background);
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  });

  // Draw video.
  switch (currentScene) {
    case Scene.Circle: {
      ctx.drawImage(
        videoElements[0],
        0,
        0,
        canvasElement.width,
        canvasElement.height
      );
      break;
    }
  }

  // Draw dB FPS meters.
  if (constants.DEBUG) {
    wrapDraw(() => {
      const level = meter.getValue();
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "white";
      ctx.fillText(
        `${(level as number).toFixed(0)}dB`,
        constants.ui.PADDING,
        constants.ui.PADDING
      );
      if (fps != null && fps !== Infinity) {
        ctx.fillText(
          `${fps.toFixed(1)}fps`,
          constants.ui.PADDING,
          constants.ui.PADDING + 24
        );
      }
    });
  }

  // Draw circle.
  if (currentScene === Scene.Circle) {
    const canvasCenter: Point = {
      x: canvasElement.width / 2,
      y: canvasElement.height / 2,
    };
    const minCanvasSize = Math.min(canvasElement.width, canvasElement.height);

    const minRadius = 0.5 - constants.circle.MAX_EDGE_PADDING_PCT;
    const maxRadius = 0.5 - constants.circle.MIN_EDGE_PADDING_PCT;
    const midpointRadius =
      0.5 -
      (constants.circle.MAX_EDGE_PADDING_PCT +
        constants.circle.MIN_EDGE_PADDING_PCT) /
        2;

    if (constants.DEBUG) {
      ctx.strokeStyle = "blue";
      ctx.lineWidth = 1;

      // Outline of left-side vertical bars.
      ctx.strokeRect(
        canvasCenter.x -
          minCanvasSize * maxRadius -
          minCanvasSize * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2,
        -1,
        minCanvasSize *
          ((constants.circle.MAX_EDGE_PADDING_PCT +
            constants.circle.MIN_EDGE_PADDING_PCT) /
            2) +
          minCanvasSize *
            2 *
            constants.circle.MAX_CENTER_OFFEST_PCT *
            Math.SQRT2,
        canvasElement.height + 2
      );
      // Outline of right-side vertical bars.
      ctx.strokeRect(
        canvasCenter.x +
          minCanvasSize * maxRadius +
          minCanvasSize * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2,
        -1,
        -minCanvasSize *
          ((constants.circle.MAX_EDGE_PADDING_PCT +
            constants.circle.MIN_EDGE_PADDING_PCT) /
            2) +
          -minCanvasSize *
            2 *
            constants.circle.MAX_CENTER_OFFEST_PCT *
            Math.SQRT2,
        canvasElement.height + 2
      );
      // Outline of top-side horizontal bars.
      ctx.strokeRect(
        -1,
        canvasCenter.y -
          minCanvasSize * maxRadius -
          minCanvasSize * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2,
        canvasElement.width + 2,
        minCanvasSize *
          ((constants.circle.MAX_EDGE_PADDING_PCT +
            constants.circle.MIN_EDGE_PADDING_PCT) /
            2) +
          minCanvasSize *
            2 *
            constants.circle.MAX_CENTER_OFFEST_PCT *
            Math.SQRT2
      );
      // Outline of bottom-side horizontal bars.
      ctx.strokeRect(
        -1,
        canvasCenter.y +
          minCanvasSize * maxRadius +
          minCanvasSize * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2,
        canvasElement.width + 2,
        -minCanvasSize *
          ((constants.circle.MAX_EDGE_PADDING_PCT +
            constants.circle.MIN_EDGE_PADDING_PCT) /
            2) +
          -minCanvasSize *
            2 *
            constants.circle.MAX_CENTER_OFFEST_PCT *
            Math.SQRT2
      );

      // Outline of center point.
      ctx.beginPath();
      ctx.arc(canvasCenter.x, canvasCenter.y, 3, 0, 2 * Math.PI);
      ctx.stroke();

      // Outline of min circle radius.
      ctx.beginPath();
      ctx.arc(
        canvasCenter.x,
        canvasCenter.y,
        minCanvasSize * minRadius -
          minCanvasSize * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2,
        0,
        2 * Math.PI
      );
      ctx.stroke();

      // Outline of midpoint circle radius.
      ctx.beginPath();
      ctx.arc(
        canvasCenter.x,
        canvasCenter.y,
        minCanvasSize * midpointRadius,
        0,
        2 * Math.PI
      );
      ctx.stroke();

      // Outline of max circle radius.
      ctx.beginPath();
      ctx.arc(
        canvasCenter.x,
        canvasCenter.y,
        minCanvasSize * maxRadius +
          minCanvasSize * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2,
        0,
        2 * Math.PI
      );
      ctx.stroke();
    }

    for (const [index, circle] of circles.entries()) {
      const circleCenterPath: Circle = {
        x: canvasCenter.x + circle.centerOffset.x * minCanvasSize,
        y: canvasCenter.y + circle.centerOffset.y * minCanvasSize,
        radius: 0,
      };
      if (circle.radius < midpointRadius) {
        circleCenterPath.radius = minCanvasSize * (circle.radius - minRadius);
      } else {
        circleCenterPath.radius = minCanvasSize * (maxRadius - circle.radius);
      }

      const circleCenter = getPointOnCircle(
        circleCenterPath,
        circle.currentSpinPosition
      );

      ctx.strokeStyle = index % 2 === 0 ? "pink" : "darkblue";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.arc(
        circleCenter.x,
        circleCenter.y,
        minCanvasSize * circle.radius,
        0,
        2 * Math.PI
      );
      ctx.stroke();

      // Update circle position.
      circle.currentSpinPosition =
        (circle.currentSpinPosition + circle.speed * circleSpeedMultiplier) %
        (2 * Math.PI);
    }
  }

  // RAF for next frame.
  requestAnimationFrame(draw);
};

export const startScene = async () => {
  for (const videoElement of videoElements) videoElement.play();
  requestAnimationFrame(draw);
  canvasElement.classList.remove("hidden");
};

export const resizeScene = (newScreenSize: Vector) => {
  const oldScreenSize: Vector = {
    x: canvasElement.width,
    y: canvasElement.height,
  };

  canvasElement.width = newScreenSize.x;
  canvasElement.height = newScreenSize.y;

  resizeParams(oldScreenSize, newScreenSize);
};

const onMouseClick = (mousePosition: Point) => {};

const updateCircleSpeedMultiplier = (mousePosition: Point) => {
  const canvasCenter: Point = {
    x: canvasElement.width / 2,
    y: canvasElement.height / 2,
  };
  const maxCanvasSize = Math.max(canvasElement.width, canvasElement.height);
  const distanceToCenter = getDistance(canvasCenter, mousePosition);
  circleSpeedMultiplier = remapValues(
    { start: maxCanvasSize * Math.SQRT2, end: 0 },
    { start: constants.circle.MIN_SPEED_MODIFIER, end: 1 },
    distanceToCenter,
    Ease.getPowIn(7)
  );
};

const onMouseMove = (mousePosition: Point) => {
  if (currentScene === Scene.Circle) {
    updateCircleSpeedMultiplier(mousePosition);
  }
};

const onMouseRelease = (mousePosition: Point) => {};
