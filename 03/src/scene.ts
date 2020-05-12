import TWEEN from "@tweenjs/tween.js";

import params, { updateParamsTick, initParams } from "./params";
import * as constants from "./constants";
import {
  enclosedIn,
  getSceneForVideo,
  getVideoForScene,
  calculateTransformForVideo,
  lerp,
} from "./utils";
import tombola from "./tombola";
import { Block, Point, Scene } from "./types";
import { playAudio, pauseAudio } from "./audio";

export let videoElement: HTMLVideoElement;
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

export let isPlaying = false;

// This is the transform for "zooming in" on a video. Affects videos and blocks.
let backgroundTransform = { x: 0, y: 0, scale: 1.0 };

const allTweens = new TWEEN.Group();

export const initScene = async (
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
) => {
  canvasElement = canvas;
  ctx = canvasElement.getContext("2d");
  videoElement = video;

  canvasElement.addEventListener("mousedown", onClick, { capture: false });

  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;

  initParams(canvasElement.width, canvasElement.height);

  updateBackgroundTransform();
};

const wrapDraw = (drawFunc: () => void) => {
  ctx.save();
  drawFunc();
  ctx.restore();
};

const draw = (time) => {
  // Clear.
  ctx.clearRect(0, 0, canvasElement.width, canvasElement.height);

  // Draw background.
  wrapDraw(() => {
    ctx.translate(backgroundTransform.x, backgroundTransform.y);
    ctx.scale(backgroundTransform.scale, backgroundTransform.scale);

    // Draw videos.
    params.videos.forEach((video, index) => {
      ctx.drawImage(
        videoElement,
        video.bounds.x,
        video.bounds.y,
        video.bounds.width,
        video.bounds.height
      );
    });

    // Draw blocks.
    params.blocks.forEach((block) => {
      const hide = params.videos.some((video) =>
        enclosedIn(block, video.bounds)
      );
      if (!hide) {
        ctx.fillStyle = `rgb(${block.color.r}, ${block.color.g}, ${block.color.b})`;
        ctx.fillRect(block.x, block.y, block.width, block.height);
      }
    });
  });

  // Draw play/pause UI.
  wrapDraw(() => {
    ctx.fillStyle = "white";

    if (isPlaying) {
      // Pause button.
      ctx.fillRect(
        constants.UI_PADDING,
        canvasElement.height - constants.UI_PADDING - constants.UI_SIZE,
        (constants.UI_SIZE * 3) / 7,
        constants.UI_SIZE
      );
      ctx.fillRect(
        constants.UI_PADDING + (constants.UI_SIZE * 4) / 7,
        canvasElement.height - constants.UI_PADDING - constants.UI_SIZE,
        (constants.UI_SIZE * 3) / 7,
        constants.UI_SIZE
      );
    } else {
      // Play button.
      ctx.beginPath();
      // Top corner.
      ctx.moveTo(
        constants.UI_PADDING,
        canvasElement.height - constants.UI_PADDING - constants.UI_SIZE
      );
      // Bottom corner.
      ctx.lineTo(
        constants.UI_PADDING,
        canvasElement.height - constants.UI_PADDING
      );
      // Tip.
      ctx.lineTo(
        constants.UI_PADDING + constants.UI_SIZE,
        canvasElement.height - constants.UI_PADDING - constants.UI_SIZE / 2
      );
      ctx.closePath();
      ctx.fill();
    }
  });

  // Draw "close scene" button.
  if (
    isPlaying &&
    params.scene.current !== Scene.Main &&
    params.scene.transition === 1
  ) {
    wrapDraw(() => {
      ctx.fillStyle = "white";
      ctx.translate(
        canvasElement.width - constants.UI_PADDING - constants.UI_SIZE / 2,
        canvasElement.height - constants.UI_PADDING - constants.UI_SIZE / 2
      );
      ctx.rotate(Math.PI / 4);

      const diagonalRadius = (constants.UI_SIZE / 2) * Math.SQRT2;
      const crossBarLength = (constants.UI_SIZE * 2) / 7;
      const diagonalLeftOut = crossBarLength / 2;
      const diagonalIncluded = diagonalRadius - diagonalLeftOut;

      ctx.fillRect(
        -diagonalIncluded,
        -crossBarLength / 2,
        diagonalIncluded * 2,
        crossBarLength
      );
      ctx.fillRect(
        -crossBarLength / 2,
        -diagonalIncluded,
        crossBarLength,
        diagonalIncluded * 2
      );
    });
  }

  // Update random params.
  if (isPlaying) {
    updateParamsTick();
  }

  // Update tweening.
  TWEEN.update(time);

  // RAF for next frame.
  requestAnimationFrame(draw);
};

export const startScene = async () => {
  isPlaying = true;
  videoElement.play();
  requestAnimationFrame(draw);
  canvasElement.classList.remove("hidden");
};

export const resizeScene = () => {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
};

const onClick = (event: MouseEvent) => {
  const mousePosition: Point = { x: event.pageX, y: event.pageY };

  // Check if clicked on play/pause.
  const playPauseBlock: Block = {
    x: constants.UI_PADDING,
    y: canvasElement.height - constants.UI_PADDING - constants.UI_SIZE,
    width: constants.UI_SIZE,
    height: constants.UI_SIZE,
  };
  if (enclosedIn(mousePosition, playPauseBlock)) {
    setIsPlaying(!isPlaying);
    return;
  }

  // Check if clicked on close scene button.
  const closeSceneBlock: Block = {
    x: canvasElement.width - constants.UI_PADDING - constants.UI_SIZE,
    y: canvasElement.height - constants.UI_PADDING - constants.UI_SIZE,
    width: constants.UI_SIZE,
    height: constants.UI_SIZE,
  };
  if (
    isPlaying &&
    params.scene.current !== Scene.Main &&
    params.scene.transition === 1 &&
    enclosedIn(mousePosition, closeSceneBlock)
  ) {
    setScene(Scene.Main);
    return;
  }

  // Check if clicked on videos.
  if (isPlaying && params.scene.current === Scene.Main) {
    for (const [index, video] of params.videos.entries()) {
      if (enclosedIn(mousePosition, video.bounds)) {
        const scene = getSceneForVideo(video);
        setScene(scene);
        return;
      }
    }
  }
};

function setIsPlaying(playing: boolean) {
  isPlaying = playing;

  if (isPlaying) {
    // Play audio.
    playAudio();

    // Play videos.
    videoElement.play();

    // Resume tweens.
    allTweens.getAll().forEach((tween, i) => tween.resume());
  } else {
    // Pause audio.
    pauseAudio();

    // Pause videos.
    videoElement.pause();

    // Pause tweens.
    allTweens.getAll().forEach((tween, i) => tween.pause());
  }
}

function setScene(scene: Scene) {
  const previousScene = params.scene.current;
  params.scene = {
    current: scene,
    previous: previousScene,
    transition: 0,
  };

  const tween = new TWEEN.Tween(params.scene)
    .to({ transition: 1 }, 1500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    // Update background transform to "zoom in" on the selected video.
    .onUpdate(updateBackgroundTransform)
    .onComplete(() => allTweens.remove(tween));

  allTweens.add(tween);
  tween.start();
}

/**
 * Updates the background transform based on the current params.
 */
const updateBackgroundTransform = () => {
  const baseTransform = { x: 0, y: 0, scale: 1.0 };
  const screenBounds: Block = {
    x: 0,
    y: 0,
    width: canvasElement.width,
    height: canvasElement.height,
  };

  if (params.scene.current === Scene.Main) {
    // For main scene, we're actually "zooming out" from a video.
    const previousVideo = getVideoForScene(params.scene.previous);
    if (previousVideo == null) {
      backgroundTransform = baseTransform;
    } else {
      const transform = calculateTransformForVideo(
        previousVideo.bounds,
        screenBounds
      );
      backgroundTransform = lerp(
        transform,
        baseTransform,
        params.scene.transition
      );
    }
    return;
  } else {
    // For video scenes, we're "zooming in" on a video.
    const video = getVideoForScene(params.scene.current);
    const transform = calculateTransformForVideo(video.bounds, screenBounds);
    backgroundTransform = lerp(
      baseTransform,
      transform,
      params.scene.transition
    );
  }
};
