import { Tween, Ease, Ticker, TweenStep } from "@createjs/tweenjs";

import * as constants from "./constants";
import {
  buildUnitFuntions,
  lerp,
  getAngle,
  add,
  subtract,
  colorToString,
} from "./utils";
import { Point, Scene, Vector, Rect, RGBA, RGB } from "./types";
import { meter, transitionScene } from "./audio";
import { Palette, loadPalette, PaletteStrings } from "./palette";
import { resizeParams } from "./params";
import tombola from "./tombola";

export let videoElements: { [scene in Scene]?: HTMLVideoElement };
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;
export let palette: Palette;
export let paletteStrings: PaletteStrings;
export let currentScene: Scene;

type Control = {
  offPosition: Point;
  onPosition: Point;
  sliderAngle: number;
  // In raget [0, 1].
  currentValue: number;
  // For tracking movement.
  dragging: false;
  // Position on slider that mouse was clicked.
  dragPoint: Point;
  // Position the slider should be moving towards.
  targetPoisition: Point;
};

type PrimaryControl = Control & {
  isPrimary: true;
};
type SecondaryControl = Control & {
  isPrimary: false;
  shapes: SecondaryControlShape[];
};
type SecondaryControlShape = {
  xOffset: number;
  yOffset: number;
  width: number;
  height: number;
  color: RGBA;
};

const buildControl = ({
  offPosition,
  onPosition,
  startValue = 0.5,
}: {
  offPosition: Point;
  onPosition: Point;
  startValue?: number;
}): Control => ({
  offPosition,
  onPosition,
  sliderAngle: getAngle(offPosition, onPosition),
  currentValue: startValue,
  dragging: false,
  dragPoint: { x: 0, y: 0 },
  targetPoisition: { x: 0, y: 0 },
});

const buildPrimaryControl = ({
  offPosition,
  onPosition,
  startValue = 0.5,
}: {
  offPosition: Point;
  onPosition: Point;
  startValue?: number;
}): PrimaryControl => ({
  ...buildControl({ offPosition, onPosition, startValue }),
  isPrimary: true,
});

const buildSecondaryControl = ({
  offPosition,
  onPosition,
  startValue = 0.5,
}: {
  offPosition: Point;
  onPosition: Point;
  startValue?: number;
}): SecondaryControl => {
  const baseControl = buildControl({
    offPosition,
    onPosition,
    startValue,
  });

  const white: RGB = { r: 255, g: 255, b: 255 };
  const peach: RGB = { r: 255, g: 110, b: 97 };
  const blue: RGB = { r: 7, g: 104, b: 159 };

  const padding = 0.02;
  const boxSize = 0.1;

  const shapeCount = tombola.item([2, 3]);
  const shapes: SecondaryControlShape[] = [];
  for (let i = 0; i < shapeCount; i++) {
    let color: RGBA;
    // if (i === 0) {
    //   color = {
    //     ...white,
    //     a: 1,
    //   };
    // } else {
    color = {
      ...tombola.item([peach, blue, white]),
      a: tombola.item([0.5, 1.0]),
    };
    // }
    shapes.push({
      xOffset: tombola.rangeFloat(-padding, padding),
      yOffset: tombola.rangeFloat(-padding, padding),
      width: tombola.rangeFloat(boxSize - padding, boxSize + padding),
      height: tombola.rangeFloat(boxSize - padding, boxSize + padding),
      color,
    });
  }

  return {
    ...baseControl,
    isPrimary: false,
    shapes,
  };
};

const controls = {
  [Scene.Snowfall]: {
    primary: buildPrimaryControl({
      offPosition: { x: 0.1, y: 0.8 },
      onPosition: { x: 0.4, y: 0.8 },
    }),
    secondary: [
      buildSecondaryControl({
        offPosition: { x: 0.65, y: 0.1 },
        onPosition: { x: 0.65, y: 0.4 },
      }),
      buildSecondaryControl({
        offPosition: { x: 0.85, y: 0.1 },
        onPosition: { x: 0.85, y: 0.4 },
      }),
    ],
  },
};

let previousFrameTime: number;

// In the real thing, this will be Scene.Title.
const defaultScene = Scene.Snowfall;

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

  ({
    unit,
    unitPoint,
    unitRect,
    unitBounds,
    unitCircle,
  } = calculateUnitFunctions());

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

let {
  unit,
  unitPoint,
  unitRect,
  unitBounds,
  unitCircle,
}: ReturnType<typeof calculateUnitFunctions> = {} as any;

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

  // Draw controls for scene.
  if (currentScene === Scene.Snowfall) {
    const sceneControls = controls[currentScene];

    drawControl(sceneControls.primary);
    sceneControls.secondary.forEach((c) => drawControl(c));
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

const drawControl = (control: PrimaryControl | SecondaryControl) => {
  const currentPositionUnit = lerp(
    control.offPosition,
    control.onPosition,
    control.currentValue
  );
  const currentPosition = unitPoint(currentPositionUnit);

  // Draw control itself.
  wrapDraw(() => {
    if (control.isPrimary) {
      // Draw rectangle (for now).
      ctx.fillRect(currentPosition.x - 50, currentPosition.y - 50, 100, 100);
    } else {
      const c = control as SecondaryControl;
      for (const shape of c.shapes) {
        ctx.fillStyle = colorToString(shape.color);
        ctx.fillRect(
          currentPosition.x + unit(shape.xOffset) - unit(shape.width) / 2,
          currentPosition.y + unit(shape.yOffset) - unit(shape.height) / 2,
          unit(shape.width),
          unit(shape.height)
        );
      }
    }
  });

  // Draw arrows.
  wrapDraw(() => {
    const arrowAlpha = 1.0;
    ctx.globalAlpha = arrowAlpha;
    ctx.fillStyle = "white";
    ctx.strokeStyle = colorToString(palette.background);
    ctx.lineWidth = 2;
    const arrowDistance = 15 * arrowAlpha + 70;

    // Draw arrow towards 1.0
    ctx.globalAlpha = arrowAlpha;
    if (control.currentValue >= 0.95) {
      ctx.globalAlpha = 0.2 * arrowAlpha;
    }
    const forwardAngle = control.sliderAngle;
    const forwardOffsetX = Math.cos(forwardAngle) * arrowDistance;
    const forwardOffsetY = -Math.sin(forwardAngle) * arrowDistance;
    drawArrow(
      add(currentPosition, { x: forwardOffsetX, y: forwardOffsetY }),
      forwardAngle
    );

    // Draw arrow towards 0.0
    ctx.globalAlpha = arrowAlpha;
    if (control.currentValue <= 0.05) {
      ctx.globalAlpha = 0.2 * arrowAlpha;
    }
    const backwardAngle = Math.PI + forwardAngle;
    const backwardOffsetX = -Math.cos(backwardAngle) * arrowDistance;
    const backwardOffsetY = Math.sin(backwardAngle) * arrowDistance;
    drawArrow(
      subtract(currentPosition, { x: backwardOffsetX, y: backwardOffsetY }),
      backwardAngle
    );
  });
};

// Offset is a Vector (pixels), angle is in radians.
// Angle of 0 means draw it pointing to the right.
const drawArrow = (arrowOrigin: Point, arrowAngle: number) => {
  const arrowLength = 20;
  const arrowWidth = 6;
  const arrowInnerWidth = arrowLength - arrowWidth;
  // const arrowOrigin = Vector.add(origin, offset);

  // The angle of the main arrow bend
  const theta = Math.PI / 4;
  const sinTheta = Math.sin(theta);
  const cosTheta = Math.cos(theta);

  // The angle of the outer corners
  const angle = Math.PI / 4;
  const sinAngle = Math.sin(angle);
  const cosAngle = Math.cos(angle);

  wrapDraw(() => {
    ctx.translate(arrowOrigin.x, arrowOrigin.y);
    ctx.rotate(-arrowAngle + 1 * (Math.PI / 2));

    ctx.beginPath();
    ctx.moveTo(0, 0);

    var x = -(arrowLength * sinTheta);
    var y = arrowLength * cosTheta;
    ctx.lineTo(x, y);

    x += arrowWidth * sinAngle;
    y += arrowWidth * cosAngle;
    ctx.lineTo(x, y);

    x += arrowInnerWidth * sinTheta;
    y -= arrowInnerWidth * cosTheta;
    ctx.lineTo(x, y);

    x += arrowInnerWidth * sinTheta;
    y += arrowInnerWidth * cosTheta;
    ctx.lineTo(x, y);

    x += arrowWidth * sinAngle;
    y -= arrowWidth * cosAngle;
    ctx.lineTo(x, y);

    ctx.closePath();

    ctx.fill();
    // ctx.stroke();
  });
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

  ({
    unit,
    unitPoint,
    unitRect,
    unitBounds,
    unitCircle,
  } = calculateUnitFunctions());
};

const onMouseClick = (mousePosition: Point) => {};

const onMouseMove = (mousePosition: Point) => {};

const onMouseRelease = (mousePosition: Point) => {};

export const setScene = (newScene: Scene) => {
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
