import { Tween, Ease, Ticker } from "@createjs/tweenjs";

import * as constants from "./constants";
import {
  remapValues,
  getPointOnCircle,
  getDistance,
  getPointAlongLine,
  getLineBetween,
  add,
} from "./utils";
import { Point, Scene, Vector, Circle, Bounds } from "./types";
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
let circleSpeedMultiplier = constants.circle.MIN_SPEED_MODIFIER;

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
  const units = (multiplier: number) => minCanvasSize * multiplier;

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

      // Draw outline of min screen size.
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      ctx.strokeRect(
        canvasCenter.x - units(0.5),
        canvasCenter.y - units(0.5),
        units(1),
        units(1)
      );
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

        // Outline of left-side vertical bars.
        ctx.strokeRect(
          canvasCenter.x -
            units(maxRadius) -
            units(constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2),
          -1,
          units(
            (constants.circle.MAX_EDGE_PADDING_PCT +
              constants.circle.MIN_EDGE_PADDING_PCT) /
              2
          ) + units(2 * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2),
          canvasElement.height + 2
        );
        // Outline of right-side vertical bars.
        ctx.strokeRect(
          canvasCenter.x +
            units(maxRadius) +
            units(constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2),
          -1,
          -units(
            (constants.circle.MAX_EDGE_PADDING_PCT +
              constants.circle.MIN_EDGE_PADDING_PCT) /
              2
          ) + -units(2 * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2),
          canvasElement.height + 2
        );
        // Outline of top-side horizontal bars.
        ctx.strokeRect(
          -1,
          canvasCenter.y -
            units(maxRadius) -
            units(constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2),
          canvasElement.width + 2,
          units(
            (constants.circle.MAX_EDGE_PADDING_PCT +
              constants.circle.MIN_EDGE_PADDING_PCT) /
              2
          ) + units(2 * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2)
        );
        // Outline of bottom-side horizontal bars.
        ctx.strokeRect(
          -1,
          canvasCenter.y +
            units(maxRadius) +
            units(constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2),
          canvasElement.width + 2,
          -units(
            (constants.circle.MAX_EDGE_PADDING_PCT +
              constants.circle.MIN_EDGE_PADDING_PCT) /
              2
          ) + -units(2 * constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2)
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
          units(minRadius) -
            units(constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2),
          0,
          2 * Math.PI
        );
        ctx.stroke();

        // Outline of midpoint circle radius.
        ctx.beginPath();
        ctx.arc(
          canvasCenter.x,
          canvasCenter.y,
          units(midpointRadius),
          0,
          2 * Math.PI
        );
        ctx.stroke();

        // Outline of max circle radius.
        ctx.beginPath();
        ctx.arc(
          canvasCenter.x,
          canvasCenter.y,
          units(maxRadius) +
            units(constants.circle.MAX_CENTER_OFFEST_PCT * Math.SQRT2),
          0,
          2 * Math.PI
        );
        ctx.stroke();
      }

      // Draw each circle.
      for (const [index, circle] of circles.entries()) {
        const circleCenterPath: Circle = {
          x: canvasCenter.x + units(circle.centerOffset.x),
          y: canvasCenter.y + units(circle.centerOffset.y),
          radius: 0,
        };
        if (circle.radius < midpointRadius) {
          circleCenterPath.radius = units(circle.radius - minRadius);
        } else {
          circleCenterPath.radius = units(maxRadius - circle.radius);
        }

        const circleCenter = getPointOnCircle(
          circleCenterPath,
          circle.currentSpinPosition
        );

        ctx.strokeStyle = index % 2 === 0 ? "pink" : "darkblue";
        ctx.lineWidth = units(0.007);
        ctx.beginPath();
        ctx.arc(
          circleCenter.x,
          circleCenter.y,
          units(circle.radius),
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
      const harpBounds: Bounds = {
        top: canvasCenter.y - units(1 / 4),
        right: canvasCenter.x + units(7 / 16),
        bottom: canvasCenter.y + units(1 / 4),
        left: canvasCenter.x - units(7 / 16),
      };

      const stringBounds: Bounds = {
        top: harpBounds.top + units(0.1),
        right: harpBounds.right - units(0.05),
        bottom: harpBounds.bottom,
        left: harpBounds.left + units(0.05),
      };

      const stringCount = 8;
      const stringBoundsWidth = stringBounds.right - stringBounds.left;
      const stringBoundsHeight = stringBounds.bottom - stringBounds.top;
      const distanceBetweenStrings = stringBoundsWidth / stringCount;

      const pLeft: Point = {
        x: stringBounds.left,
        y: stringBounds.top + stringBoundsHeight * 0.1,
      };
      const pCenter: Point = {
        x: canvasCenter.x,
        y: stringBounds.top + stringBoundsHeight * 0.8,
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
      ctx.lineWidth = units(0.007);
      for (const stringBottom of stringBottoms) {
        ctx.beginPath();
        ctx.moveTo(stringBottom.x, stringBounds.top);
        ctx.lineTo(stringBottom.x, stringBottom.y);
        ctx.stroke();
      }
      break;
    }
    case Scene.Blocks: {
      const hexagonPath = (leftPoint: Point, sideLength: number) => {
        const height = sideLength * Math.sqrt(3);
        const width = sideLength * 2;
        ctx.beginPath();
        ctx.moveTo(leftPoint.x, leftPoint.y);
        ctx.lineTo(leftPoint.x + sideLength / 2, leftPoint.y - height / 2);
        ctx.lineTo(
          leftPoint.x + sideLength * (3 / 2),
          leftPoint.y - height / 2
        );
        ctx.lineTo(leftPoint.x + width, leftPoint.y);
        ctx.lineTo(
          leftPoint.x + sideLength * (3 / 2),
          leftPoint.y + height / 2
        );
        ctx.lineTo(leftPoint.x + sideLength / 2, leftPoint.y + height / 2);
        ctx.closePath();
      };

      ctx.strokeStyle = "red";

      const sideLength = 50;
      const height = sideLength * Math.sqrt(3);
      const width = sideLength * 2;

      // Draw hex1
      const hex1LeftPoint = add(canvasCenter, { x: -100, y: 50 });
      hexagonPath(hex1LeftPoint, sideLength);
      ctx.stroke();

      // Draw hex2
      const hex2LeftPoint = add(hex1LeftPoint, {
        x: (width * 3) / 4,
        y: -height / 2,
      });
      hexagonPath(hex2LeftPoint, sideLength);
      ctx.stroke();

      // Draw diamond
      const bigSide = sideLength * (Math.sqrt(3) / 2);
      const smallSide = sideLength * (1 / 2);
      const diamondLeftPoint = add(hex2LeftPoint, {
        x: (width * 3) / 4,
        y: -height / 2,
      });
      ctx.beginPath();
      ctx.moveTo(diamondLeftPoint.x, diamondLeftPoint.y);
      ctx.lineTo(diamondLeftPoint.x + bigSide, diamondLeftPoint.y - smallSide);
      ctx.lineTo(
        diamondLeftPoint.x + bigSide + smallSide,
        diamondLeftPoint.y + bigSide - smallSide
      );
      ctx.lineTo(diamondLeftPoint.x + smallSide, diamondLeftPoint.y + bigSide);
      ctx.closePath();
      ctx.stroke();

      // Draw hex 3
      const hex3LeftPoint = add(diamondLeftPoint, {
        x: bigSide,
        y: -smallSide,
      });
      hexagonPath(hex3LeftPoint, sideLength);
      ctx.stroke();

      // Draw hex 4
      const hex4LeftPoint = add(hex3LeftPoint, { x: 0, y: -2 * bigSide });
      hexagonPath(hex4LeftPoint, sideLength);
      ctx.stroke();

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
