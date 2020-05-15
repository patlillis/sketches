import { Tween, Ease, Ticker } from "@createjs/tweenjs";

import params, { updateParamsTick, initParams } from "./params";
import * as constants from "./constants";
import {
  enclosedIn,
  getSceneForVideo,
  getVideoForScene,
  calculateTransformForVideo,
  lerp,
  getVideoIndexForScene,
} from "./utils";
import tombola from "./tombola";
import { Block, Point, Scene, Video } from "./types";
import { playAudio, pauseAudio } from "./audio";

export let videoElement: HTMLVideoElement;
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

/*
import { Tween } from "@createjs/tweenjs";

const target = { transition: 0 };

let reversed = false;

const start = Date.now();

// return;
let tween;
let newTween;
tween = new Tween(target);

tween.to({ transition: 1 }, 1000);
tween.on("change", () => {
  onChange();
  if (target.transition > 0.5 && !reversed) {
    console.log("WOO");
    target.transition = 1;
    newTween = new Tween(target, {
      override: true
    });
    newTween.to({ transition: 0 }, 1000);
    newTween.setPosition(tween.position);
    newTween.on("change", onChange);
  }
});

function onChange() {
  const now = Date.now();
  const elapsed = now - start;
  console.log(
    `${target.transition} [${elapsed}], [${tween.position}] [${newTween &&
      newTween.positon}]`
  );
}


*/

/*********** Random variables to track state. *******************/

/** Whether the video is paused or not. */
let isPlaying = false;
/** The transform for "zooming in" on a video. Affects videos and blocks. */
let backgroundTransform = { x: 0, y: 0, scale: 1.0 };
/** Index of video being hovered over. -1 if no video is being hovered. */
let isHoveringVideoIndex = -1;
let isHoveringPlayPause = false;
let isHoveringCloseScene = false;

const allTweens = new Set<Tween>();

export const initScene = async (
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
) => {
  canvasElement = canvas;
  ctx = canvasElement.getContext("2d");
  videoElement = video;

  canvasElement.addEventListener("mousedown", onMouseClick, { capture: false });
  canvasElement.addEventListener("mousemove", onMouseMove, { capture: false });

  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;

  initParams(canvasElement.width, canvasElement.height);

  updateBackgroundTransform();

  Ticker.timingMode = Ticker.RAF;
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
      if (block.intersectingVideos.includes(isHoveringVideoIndex)) return;
      if (
        block.intersectingVideos.includes(
          getVideoIndexForScene(params.scene.current)
        )
      )
        return;
      if (
        block.intersectingVideos.includes(
          getVideoIndexForScene(params.scene.previous)
        ) &&
        params.scene.transition !== 1
      )
        return;
      ctx.fillStyle = block.intersectingVideos.includes(isHoveringVideoIndex)
        ? "#F5B940"
        : `rgb(${block.color.r}, ${block.color.g}, ${block.color.b})`;
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });
  });

  // Draw play/pause UI.
  const drawPlayPause = () => {
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
  };
  wrapDraw(() => {
    ctx.fillStyle = "black";
    ctx.translate(-2, -2);
    drawPlayPause();
  });

  wrapDraw(() => {
    ctx.fillStyle = isHoveringPlayPause ? "#F5B940" : "white";
    drawPlayPause();
  });

  // Draw "close scene" button.
  if (
    isPlaying &&
    params.scene.current !== Scene.Main &&
    params.scene.transition === 1
  ) {
    const drawCloseScene = () => {
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
    };
    wrapDraw(() => {
      ctx.fillStyle = "black";
      ctx.translate(-2, -2);
      drawCloseScene();
    });

    wrapDraw(() => {
      ctx.fillStyle = isHoveringCloseScene ? "#F5B940" : "white";
      drawCloseScene();
    });
  }

  // Update random params.
  if (isPlaying) {
    updateParamsTick();
  }

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

const testPlayPauseCollision = (mousePosition: Point) => {
  const playPauseBlock: Block = {
    x: constants.UI_PADDING,
    y: canvasElement.height - constants.UI_PADDING - constants.UI_SIZE,
    width: constants.UI_SIZE,
    height: constants.UI_SIZE,
  };
  return enclosedIn(mousePosition, playPauseBlock);
};

const testCloseSceneCollision = (mousePosition: Point) => {
  const closeSceneBlock: Block = {
    x: canvasElement.width - constants.UI_PADDING - constants.UI_SIZE,
    y: canvasElement.height - constants.UI_PADDING - constants.UI_SIZE,
    width: constants.UI_SIZE,
    height: constants.UI_SIZE,
  };
  return (
    isPlaying &&
    params.scene.current !== Scene.Main &&
    params.scene.transition === 1 &&
    enclosedIn(mousePosition, closeSceneBlock)
  );
};

const testVideoCollision = (mousePosition: Point, video: Video) => {
  return (
    isPlaying &&
    params.scene.current === Scene.Main &&
    params.scene.transition === 1 &&
    enclosedIn(mousePosition, video.bounds)
  );
};

const onMouseClick = (event: MouseEvent) => {
  const mousePosition: Point = { x: event.pageX, y: event.pageY };

  // Check if clicked on play/pause.
  if (testPlayPauseCollision(mousePosition)) {
    setIsPlaying(!isPlaying);
    return;
  }

  // Check if clicked on close scene button.
  if (testCloseSceneCollision(mousePosition)) {
    setScene(Scene.Main);
    return;
  }

  // Check if clicked on videos.
  for (const video of params.videos) {
    if (testVideoCollision(mousePosition, video)) {
      const scene = getSceneForVideo(video);
      setScene(scene);
      return;
    }
  }
};

const onMouseMove = (event: MouseEvent) => {
  const mousePosition: Point = { x: event.pageX, y: event.pageY };

  // Check if play/pause is hovered.
  isHoveringPlayPause = testPlayPauseCollision(mousePosition);

  // Check if close scene button is hovered.
  isHoveringCloseScene = testCloseSceneCollision(mousePosition);

  // Check if videos are hovered.
  isHoveringVideoIndex = -1;
  for (const [index, video] of params.videos.entries()) {
    if (testVideoCollision(mousePosition, video)) {
      isHoveringVideoIndex = index;

      // Add tween for extended hover effect.
      //   if (hoveringVideoTweens[index] == null) {
      //     hoveringVideoTweens[index] = { transition: 0, tween: null };
      //   }
      //   const hoverTween = new TWEEN.Tween(hoveringVideoTweens[index].transition)
      //     .to({ transition: 1 }, 1500)
      //     .easing(TWEEN.Easing.Quadratic.InOut);
      //   // Update background transform to "zoom in" on the selected video.
      //   // .onUpdate(updateBackgroundTransform)
      //   // .onComplete(() => allTweens.remove(hoverTween));
      //   allTweens.add(hoverTween);
      //   hoveringVideoTweens[index];
      //   hoverTween.start();
      // } else {
      //   // Video is not being hovered.
      //   const tween = new TWEEN.Tween(params.scene)
      //     .to({ transition: 1 }, 1500)
      //     .easing(TWEEN.Easing.Quadratic.InOut);
      //   // Update background transform to "zoom in" on the selected video.
      //   // .onUpdate(updateBackgroundTransform)
      //   // .onComplete(() => allTweens.remove(tween));

      //   allTweens.add(tween);
      //   tween.start();
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
    for (const tween of allTweens) tween.paused = false;
  } else {
    // Pause audio.
    pauseAudio();

    // Pause videos.
    videoElement.pause();

    // Pause tweens.
    for (const tween of allTweens) tween.paused = true;
  }
}

function setScene(scene: Scene) {
  const previousScene = params.scene.current;
  params.scene = {
    current: scene,
    previous: previousScene,
    transition: 0,
  };

  const tween = new Tween(params.scene).to(
    { transition: 1 },
    1500,
    Ease.quadInOut
  );
  tween.on("change", updateBackgroundTransform);
  tween.on("complete", () => allTweens.delete(tween));
  allTweens.add(tween);
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
