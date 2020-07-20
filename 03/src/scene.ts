import { Tween, Ease, Ticker } from "@createjs/tweenjs";

import * as constants from "./constants";
import {
  remapValues,
  getPointOnCircle,
  getDistance,
  getPointAlongLine,
  getLineBetween,
  buildUnitFuntions,
  getRect,
  clamp,
  lerp,
} from "./utils";
import { Point, Scene, Vector, Bounds, Rect } from "./types";
import { meter, transitionScene } from "./audio";
import { Palette, loadPalette, PaletteStrings } from "./palette";
import { resizeParams } from "./params";
import tombola from "./tombola";

export let videoElements: { [scene in Scene]?: HTMLVideoElement };
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;
export let palette: Palette;
export let paletteStrings: PaletteStrings;
export let currentScene;

let previousFrameTime: number;

// In the real thing, this will be Scene.Title.
const defaultScene = Scene.Circles;

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
// This is controlled by the mouse position.
let circleSpeedMultiplier = constants.circle.MIN_SPEED_MODIFIER;

const blockDefinitions: Rect[] = [
  // Top blocks.
  { x: 0.5, y: 0.2, width: 0.1, height: 0.1 },
  { x: 0.6, y: 0.2, width: 0.1, height: 0.1 },
  { x: 0.7, y: 0.2, width: 0.1, height: 0.1 },
  { x: 0.8, y: 0.2, width: 0.1, height: 0.1 },
  { x: 0.9, y: 0.2, width: 0.1, height: 0.1 },

  // Bottom blocks.
  { x: 0.28, y: 0.7, width: 0.1, height: 0.12 },
  { x: 0.2, y: 0.72, width: 0.1, height: 0.07 },
  { x: 0.1, y: 0.69, width: 0.1, height: 0.11 },
];
const blocks = blockDefinitions.map((position) => ({
  position,
  swaySpeed: tombola.rangeFloat(0.001, 0.005),
  swayDirection: tombola.item([-1.0, +1.0]),
  swayOffset: tombola.rangeFloat(0, 1.0),
}));

declare global {
  interface Window {
    /** For testing, can do `window.setScene("Title")`. */
    setScene: (scene: keyof Scene) => void;
  }
}
window.setScene = (scene: keyof Scene) => {
  if (Scene[scene] != null) setScene(Scene[scene]);
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
  const minCanvasSize = Math.min(canvasElement.width, canvasElement.height);

  const {
    unit,
    unitPoint,
    unitRect,
    unitBounds,
    unitCircle,
  } = buildUnitFuntions(minCanvasSize, canvasCenter);

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

  // Draw circles.
  switch (currentScene) {
    case Scene.Circles: {
      const minRadius = 0.5 - constants.circle.MAX_EDGE_PADDING_PCT;
      const maxRadius = 0.5 - constants.circle.MIN_EDGE_PADDING_PCT;
      const midpointRadius =
        0.5 -
        (constants.circle.MAX_EDGE_PADDING_PCT +
          constants.circle.MIN_EDGE_PADDING_PCT) /
          2;

      if (constants.DEBUG) {
        ctx.strokeStyle = paletteStrings.debugLines;
        ctx.lineWidth = constants.debug.lineWidth;

        const actualMinRadius =
          minRadius - constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2;
        const actualMaxRadius =
          maxRadius + constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2;

        // Outline of max radius vertical bars.
        const maxVerticalRect = unitRect({
          x: 0.5 - actualMaxRadius,
          y: -1,
          width: 2 * actualMaxRadius,
          height: canvasElement.height + 2,
        });
        ctx.strokeRect(
          maxVerticalRect.x,
          maxVerticalRect.y,
          maxVerticalRect.width,
          maxVerticalRect.height
        );

        // Outline of min radius vertical bars.
        const minVerticalRect = unitRect({
          x: 0.5 - actualMinRadius,
          y: -1,
          width: 2 * actualMinRadius,
          height: canvasElement.height + 2,
        });
        ctx.strokeRect(
          minVerticalRect.x,
          minVerticalRect.y,
          minVerticalRect.width,
          minVerticalRect.height
        );

        // Outline of max radius horizontal bars.
        const maxHorizontalRect = unitRect({
          x: -1,
          y: 0.5 - actualMaxRadius,
          width: canvasElement.width + 2,
          height: 2 * actualMaxRadius,
        });
        ctx.strokeRect(
          maxHorizontalRect.x,
          maxHorizontalRect.y,
          maxHorizontalRect.width,
          maxHorizontalRect.height
        );

        // Outline of min radius horizontal bars.
        const minHorizontalRect = unitRect({
          x: -1,
          y: 0.5 - actualMinRadius,
          width: canvasElement.width + 2,
          height: 2 * actualMinRadius,
        });
        ctx.strokeRect(
          minHorizontalRect.x,
          minHorizontalRect.y,
          minHorizontalRect.width,
          minHorizontalRect.height
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
          unit(actualMinRadius),
          0,
          2 * Math.PI
        );
        ctx.stroke();

        // Outline of midpoint circle radius.
        ctx.beginPath();
        ctx.arc(
          canvasCenter.x,
          canvasCenter.y,
          unit(midpointRadius),
          0,
          2 * Math.PI
        );
        ctx.stroke();

        // Outline of max circle radius.
        ctx.beginPath();
        ctx.arc(
          canvasCenter.x,
          canvasCenter.y,
          unit(actualMaxRadius),
          0,
          2 * Math.PI
        );
        ctx.stroke();
      }

      // Draw each circle.
      for (const [index, circle] of circles.entries()) {
        const circleCenterRadius =
          circle.radius < midpointRadius
            ? circle.radius - minRadius
            : maxRadius - circle.radius;
        const circleCenterPath = unitCircle({
          x: 0.5 + circle.centerOffset.x,
          y: 0.5 + circle.centerOffset.y,
          radius: circleCenterRadius,
        });

        const circleCenter = getPointOnCircle(
          circleCenterPath,
          circle.currentSpinPosition
        );

        ctx.strokeStyle = index % 2 === 0 ? "pink" : "darkblue";
        ctx.lineWidth = unit(0.007);
        ctx.beginPath();
        ctx.arc(
          circleCenter.x,
          circleCenter.y,
          unit(circle.radius),
          0,
          2 * Math.PI
        );
        ctx.stroke();

        // Update circle position.
        circle.currentSpinPosition =
          (circle.currentSpinPosition + circle.speed * circleSpeedMultiplier) %
          (2 * Math.PI);
      }
      break;
    }
    case Scene.Harp: {
      const harpBounds = unitBounds({
        top: 0.25,
        right: 1.0 - 0.0625,
        bottom: 0.75,
        left: 0.0625,
      });

      const stringBounds: Bounds = {
        top: harpBounds.top + unit(0.1),
        right: harpBounds.right - unit(0.05),
        bottom: harpBounds.bottom,
        left: harpBounds.left + unit(0.05),
      };
      const stringRect = getRect(stringBounds);

      const stringCount = 8;
      const distanceBetweenStrings = stringRect.width / stringCount;

      const pLeft: Point = {
        x: stringBounds.left,
        y: stringBounds.top + stringRect.height * 0.1,
      };
      const pCenter: Point = {
        x: canvasCenter.x,
        y: stringBounds.top + stringRect.height * 0.8,
      };
      const pRight: Point = {
        x: stringBounds.right,
        y: stringBounds.bottom,
      };
      const leftLine = getLineBetween(pLeft, pCenter);
      const rightLine = getLineBetween(pCenter, pRight);

      const stringBottoms: Point[] = Array.from({
        length: stringCount,
      }).map((_, index) => {
        const x =
          stringBounds.left +
          distanceBetweenStrings / 2 +
          index * distanceBetweenStrings;

        return index < stringCount / 2
          ? getPointAlongLine(leftLine, { x })
          : getPointAlongLine(rightLine, { x });
      });

      if (constants.DEBUG) {
        ctx.strokeStyle = paletteStrings.debugLines;
        ctx.lineWidth = constants.debug.lineWidth;

        // Outline of where harp should go.
        ctx.beginPath();
        // Top.
        ctx.moveTo(-1, harpBounds.top);
        ctx.lineTo(canvasElement.width + 1, harpBounds.top);
        // Right.
        ctx.moveTo(harpBounds.right, -1);
        ctx.lineTo(harpBounds.right, canvasElement.height + 1);
        // Bottom.
        ctx.moveTo(-1, harpBounds.bottom);
        ctx.lineTo(canvasElement.width + 1, harpBounds.bottom);
        // Left.
        ctx.moveTo(harpBounds.left, -1);
        ctx.lineTo(harpBounds.left, canvasElement.height + 1);
        ctx.stroke();

        // Outline of where strings should go.
        ctx.beginPath();
        // Top.
        ctx.moveTo(-1, stringBounds.top);
        ctx.lineTo(canvasElement.width + 1, stringBounds.top);
        // Right.
        ctx.moveTo(stringBounds.right, -1);
        ctx.lineTo(stringBounds.right, canvasElement.height + 1);
        // Bottom.
        ctx.moveTo(-1, stringBounds.bottom);
        ctx.lineTo(canvasElement.width + 1, stringBounds.bottom);
        // Left.
        ctx.moveTo(stringBounds.left, -1);
        ctx.lineTo(stringBounds.left, canvasElement.height + 1);
        ctx.stroke();

        // Line of string bottom cut-off.
        ctx.beginPath();
        ctx.moveTo(pLeft.x, pLeft.y);
        ctx.lineTo(pCenter.x, pCenter.y);
        ctx.lineTo(pRight.x, pRight.y);
        ctx.stroke();
      }

      // Harp bar.
      ctx.fillStyle = "darkblue";
      ctx.beginPath();
      ctx.moveTo(harpBounds.left, harpBounds.top);
      ctx.lineTo(stringBounds.right, harpBounds.top);
      ctx.lineTo(harpBounds.right, stringBounds.top);
      ctx.lineTo(stringBounds.left, stringBounds.top);
      ctx.closePath();
      ctx.fill();

      // Draw strings.
      ctx.strokeStyle = "pink";
      ctx.lineWidth = unit(0.007);
      for (const stringBottom of stringBottoms) {
        ctx.beginPath();
        ctx.moveTo(stringBottom.x, stringBounds.top);
        ctx.lineTo(stringBottom.x, stringBottom.y);
        ctx.stroke();
      }
      break;
    }
    case Scene.Blocks: {
      const topRightBlocksCenter = unitPoint({ x: 0.75, y: 0.25 });
      const bottomLeftBlocksCenter = unitPoint({ x: 0.25, y: 0.75 });

      if (constants.DEBUG) {
        ctx.strokeStyle = paletteStrings.debugLines;
        ctx.lineWidth = constants.debug.lineWidth;

        ctx.beginPath();
        ctx.moveTo(-1, topRightBlocksCenter.y);
        ctx.lineTo(canvasElement.width + 1, topRightBlocksCenter.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-1, bottomLeftBlocksCenter.y);
        ctx.lineTo(canvasElement.width + 1, bottomLeftBlocksCenter.y);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(bottomLeftBlocksCenter.x, -1);
        ctx.lineTo(bottomLeftBlocksCenter.x, canvasElement.height + 1);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(topRightBlocksCenter.x, -1);
        ctx.lineTo(topRightBlocksCenter.x, canvasElement.height + 1);
        ctx.stroke();
      }

      // Draw blocks
      ctx.strokeStyle = "darkblue";
      ctx.lineWidth = unit(0.005);
      ctx.fillStyle = "pink";

      for (const block of blocks) {
        const swayOffset = lerp(
          -constants.block.MAX_SWAY,
          constants.block.MAX_SWAY,
          block.swayOffset,
          Ease.cubicInOut
        );

        const actualBlockPosition = unitRect({
          ...block.position,
          y: block.position.y + swayOffset,
        });
        ctx.beginPath();
        ctx.rect(
          actualBlockPosition.x,
          actualBlockPosition.y,
          actualBlockPosition.width,
          actualBlockPosition.height
        );
        ctx.stroke();
        ctx.fill();
      }

      // Update bob & sway.
      for (const block of blocks) {
        block.swayOffset += block.swayDirection * block.swaySpeed;
        if (block.swayOffset >= 1 || block.swayOffset <= 0) {
          block.swayDirection = -block.swayDirection;
        }
        block.swayOffset = clamp(block.swayOffset, 0, 1);
      }
      break;
    }
    default:
  }

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
  if (currentScene === Scene.Circles) {
    updateCircleSpeedMultiplier(mousePosition);
  }
};

const onMouseRelease = (mousePosition: Point) => {};

const setScene = (scene: Scene) => {
  const previousScene = currentScene;
  currentScene = scene;

  transitionScene(previousScene, currentScene);
};
