import { Tween, Ease, Ticker } from "@createjs/tweenjs";

import * as constants from "./constants";
import { colorToString, remapValues } from "./utils";
import { Point, Scene, Vector } from "./types";
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
let circles: {
  speed: number;
  radius: number;
  offset: number;
}[];

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

  // Initialize circles.
  circles = Array.from({
    length: constants.circle.CIRCLE_COUNT,
  }).map(() => {
    const minCanvasSize =
      Math.min(canvasElement.width, canvasElement.height) / 2;
    return {
      speed: tombola.rangeFloat(
        constants.circle.MIN_SPEED,
        constants.circle.MAX_SPEED
      ),
      radius: tombola.rangeFloat(
        minCanvasSize - constants.circle.MAX_EDGE_PADDING,
        minCanvasSize - constants.circle.MIN_EDGE_PADDING
      ),
      offset: tombola.rangeFloat(0, 2 * Math.PI),
    };
  });
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
    ctx.strokeStyle = "white";
    const canvasCenter: Vector = {
      x: canvasElement.width / 2,
      y: canvasElement.height / 2,
    };
    ctx.strokeRect(canvasCenter.x - 2, canvasCenter.y - 2, 4, 4);
    const minCanvasSize = Math.min(canvasElement.width, canvasElement.height);
    const minRadius = minCanvasSize / 2 - constants.circle.MAX_EDGE_PADDING;
    const maxRadius = minCanvasSize / 2 - constants.circle.MIN_EDGE_PADDING;
    const midpointRadius =
      minCanvasSize / 2 -
      (constants.circle.MAX_EDGE_PADDING - constants.circle.MIN_EDGE_PADDING) /
        2;
    for (const circle of circles) {
      let centerCircleRadius: number;
      if (circle.radius < midpointRadius) {
        centerCircleRadius = circle.radius - minRadius;
      } else {
        centerCircleRadius = maxRadius - circle.radius;
      }
      const circleCenter: Point = {
        x: canvasCenter.x,
        y: canvasCenter.y - centerCircleRadius,
      };
      ctx.beginPath();
      ctx.arc(circleCenter.x, circleCenter.y, circle.radius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.stroke();
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

const onMouseMove = (mousePosition: Point) => {};

const onMouseRelease = (mousePosition: Point) => {};
