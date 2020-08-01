import { Tween, Ease, Ticker, TweenStep } from "@createjs/tweenjs";

import * as constants from "./constants";
import { buildUnitFuntions } from "./utils";
import { Point, Scene, Vector, Rect } from "./types";
import { meter, transitionScene } from "./audio";
import { Palette, loadPalette, PaletteStrings } from "./palette";
import { resizeParams } from "./params";

export let videoElements: { [scene in Scene]?: HTMLVideoElement };
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;
export let palette: Palette;
export let paletteStrings: PaletteStrings;
export let currentScene: Scene;

let previousFrameTime: number;

// In the real thing, this will be Scene.Title.
const defaultScene = Scene.Pinata;

declare global {
  interface Window {
    /** For testing, can do `window.setScene("Title")`. */
    setScene: (scene: string) => void;
  }
}
window.setScene = (newScene: string) => {
  for (const scene of Object.values(Scene)) {
    if (newScene.toLowerCase() === scene.toLowerCase()) setScene(scene);
  }
};

export const initScene = async (
  canvas: HTMLCanvasElement,
  videos: { [scene in Scene]?: HTMLVideoElement }
) => {
  // Grab query params.
  // TODO: remove this, only for development.
  const urlParmas = new URLSearchParams(window.location.search);
  const urlScene = urlParmas.get("scene");
  setScene(Scene[urlScene] ?? defaultScene);

  // Load color palette.
  ({ palette, paletteStrings } = await loadPalette("assets/palette.png"));

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

const calculateUnitFunctions = () => {
  const canvasCenter: Point = {
    x: canvasElement.width / 2,
    y: canvasElement.height / 2,
  };
  const minCanvasSize = Math.min(canvasElement.width, canvasElement.height);
  return buildUnitFuntions(minCanvasSize, canvasCenter);
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
    ctx.fillStyle = paletteStrings.background;
    ctx.fillRect(0, 0, canvasElement.width, canvasElement.height);
  });

  // Canvas sizes/points that are used in multiple scenes.
  const canvasCenter: Point = {
    x: canvasElement.width / 2,
    y: canvasElement.height / 2,
  };

  const {
    unit,
    unitPoint,
    unitRect,
    unitBounds,
    unitCircle,
  } = calculateUnitFunctions();

  // Draw video.
  let videoBackground = videoElements[currentScene];
  if (videoBackground != null) {
    const videoAspectRatio =
      videoBackground.videoWidth / videoBackground.videoHeight;
    const screenAspectRatio = canvasElement.width / canvasElement.height;

    if (videoAspectRatio > screenAspectRatio) {
      // Video has wider aspect ratio.
      const videoWidth = canvasElement.height * videoAspectRatio;
      const videoX = (videoWidth - canvasElement.width) / 2;
      ctx.drawImage(
        videoBackground,
        -videoX,
        0,
        videoWidth,
        canvasElement.height
      );
    } else {
      // Screen has wider aspect ratio.
      const videoHeight = canvasElement.width / videoAspectRatio;
      const videoY = (videoHeight - canvasElement.height) / 2;
      ctx.drawImage(
        videoBackground,
        0,
        -videoY,
        canvasElement.width,
        videoHeight
      );
    }
  }

  if (constants.DEBUG) {
    wrapDraw(() => {
      // Draw dB and FPS meters.
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

    wrapDraw(() => {
      // Draw outline of min screen size.
      ctx.strokeStyle = "white";
      ctx.lineWidth = 3;
      const rect = unitRect({ x: 0, y: 0, width: 1.0, height: 1.0 });
      ctx.strokeRect(rect.x, rect.y, rect.width, rect.height);
    });

    wrapDraw(() => {
      // Draw unit intervals.
      ctx.lineWidth = 1;
      for (let i = 0; i < 1.0; i += 0.1) {
        ctx.setLineDash(i === 0.5 ? [] : [5, 5]);
        ctx.strokeStyle = i === 0.5 ? "white" : "rgba(255, 255, 255, 0.5)";

        // Draw horizontal line.
        ctx.beginPath();

        const horizontalStart = unitPoint({ x: 0.0, y: i });
        ctx.moveTo(horizontalStart.x, horizontalStart.y);

        const horizontalEnd = unitPoint({ x: 1.0, y: i });
        ctx.lineTo(horizontalEnd.x, horizontalEnd.y);

        ctx.stroke();

        // Draw Vertical line.
        ctx.beginPath();

        const verticalStart = unitPoint({ x: i, y: 0.0 });
        ctx.moveTo(verticalStart.x, verticalStart.y);

        const verticalEnd = unitPoint({ x: i, y: 1.0 });
        ctx.lineTo(verticalEnd.x, verticalEnd.y);

        ctx.stroke();
      }
    });
  }

  // Draw title & navigation
  wrapDraw(() => {
    let currentSceneTitle: string;
    let prevSceneTitle: string;
    let nextSceneTitle: string;
    switch (currentScene) {
      case Scene.Pinata:
        currentSceneTitle = "PIÑATA";
        nextSceneTitle = "snowfall";
        break;
      case Scene.Snowfall:
        currentSceneTitle = "SNOWFALL";
        prevSceneTitle = "piñata";
        nextSceneTitle = "poolside";
        break;
      case Scene.Poolside:
        currentSceneTitle = "POOLSIDE";
        prevSceneTitle = "snowfall";
        break;
      default:
    }
  });

  // RAF for next frame.
  requestAnimationFrame(draw);
};

export const startScene = async () => {
  for (const videoElement of Object.values(videoElements)) videoElement.play();
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

const setScene = (newScene: Scene) => {
  const previousScene = currentScene;
  currentScene = newScene;

  // Set current scene name on body.
  for (const scene of Object.values(Scene)) {
    const className = scene.toLowerCase();
    document.body.classList.remove(className);
  }
  document.body.classList.add(newScene.toLowerCase());

  transitionScene(previousScene, currentScene);
};
