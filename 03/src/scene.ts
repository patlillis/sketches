import { Tween, Ease, Ticker } from "@createjs/tweenjs";

import params, { updateParamsTick, initParams } from "./params";
import * as constants from "./constants";
import {
  enclosedIn,
  getSceneForVideo,
  getVideoForScene,
  calculateTransformForVideo,
  lerp,
  colorToString,
  scale,
} from "./utils";
import { Block, Point, Scene, Video } from "./types";
import { playAudio, pauseAudio } from "./audio";

export let videoElement: HTMLVideoElement;
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

/*********** Random variables to track state. *******************/

/** Whether the video is paused or not. */
let isPlaying = false;
/** The transform for "zooming in" on a video. Affects videos and blocks. */
let backgroundTransform = { x: 0, y: 0, scale: 1.0 };
const hoverState = {
  /** Index of video being hovered over. -1 if no video is being hovered. */
  currentVideoIndex: -1,
  videos: [
    { current: false, transition: 0 },
    { current: false, transition: 0 },
    { current: false, transition: 0 },
  ],
  playPauseButton: { current: false, transition: 0 },
  closeSceneButton: { current: false, transition: 0 },
};
const hoverTweens = {
  videos: [] as Tween[],
  playPauseButton: null as Tween,
  closeSceneButton: null as Tween,
};
let playPauseButtonColor = constants.UI_COLOR;
let closeSceneButtonColor = constants.UI_COLOR;

// Tweens for adding/removing hover effects on videos.
let videoHoveringTweens = [];

const pausableTweens = new Set<Tween>();

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

const draw = (time: number) => {
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
    // console.log(hoverState.videos.map((v) => v.transition));
    params.blocks.forEach((block, index) => {
      let offset = { x: 0, y: 0 };
      for (const [index, video] of block.intersectingVideos.entries()) {
        const offsetForVideo = scale(
          video.offset,
          hoverState.videos[index].transition
        );
        offset.x += offsetForVideo.x;
        offset.y += offsetForVideo.y;
      }

      ctx.fillStyle = colorToString(block.color);
      ctx.fillRect(
        block.x + offset.x,
        block.y + offset.y,
        block.width,
        block.height
      );
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
    ctx.fillStyle = colorToString(playPauseButtonColor);
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
      ctx.fillStyle = colorToString(closeSceneButtonColor);
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

const updatePlayPauseHover = (mousePosition: Point) => {
  const wasHoveringPlayPause = hoverState.playPauseButton.current;
  const isHoveringPlayPause = testPlayPauseCollision(mousePosition);
  hoverState.playPauseButton.current = isHoveringPlayPause;

  if (wasHoveringPlayPause !== isHoveringPlayPause) {
    const transitionStart = isHoveringPlayPause ? 0 : 1;
    const transitionEnd = isHoveringPlayPause ? 1 : 0;
    let tweenPosition = 0;
    if (hoverTweens.playPauseButton != null) {
      tweenPosition =
        constants.UI_HOVER_TRANSITION_TIME -
        hoverTweens.playPauseButton.position;
    }

    hoverState.playPauseButton.transition = transitionStart;
    const tween = new Tween(hoverState.playPauseButton, { override: true }).to(
      { transition: transitionEnd },
      constants.UI_HOVER_TRANSITION_TIME,
      Ease.linear
    );
    tween.setPosition(tweenPosition);
    tween.on("change", () => {
      playPauseButtonColor = lerp(
        constants.UI_COLOR,
        constants.UI_HOVER_COLOR,
        hoverState.playPauseButton.transition
      );
    });
    tween.on("complete", () => {
      hoverTweens.playPauseButton = null;
    });
    hoverTweens.playPauseButton = tween;
  }
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

const updateCloseSceneHover = (mousePosition: Point) => {
  const wasHoveringCloseScene = hoverState.closeSceneButton.current;
  const isHoveringCloseScene = testCloseSceneCollision(mousePosition);
  hoverState.closeSceneButton.current = isHoveringCloseScene;

  if (wasHoveringCloseScene !== isHoveringCloseScene) {
    const transitionStart = isHoveringCloseScene ? 0 : 1;
    const transitionEnd = isHoveringCloseScene ? 1 : 0;
    let tweenPosition = 0;
    if (hoverTweens.closeSceneButton != null) {
      tweenPosition =
        constants.UI_HOVER_TRANSITION_TIME -
        hoverTweens.closeSceneButton.position;
    }

    hoverState.closeSceneButton.transition = transitionStart;
    const tween = new Tween(hoverState.closeSceneButton, { override: true }).to(
      { transition: transitionEnd },
      constants.UI_HOVER_TRANSITION_TIME,
      Ease.linear
    );
    tween.setPosition(tweenPosition);
    tween.on("change", () => {
      closeSceneButtonColor = lerp(
        constants.UI_COLOR,
        constants.UI_HOVER_COLOR,
        hoverState.closeSceneButton.transition
      );
    });
    tween.on("complete", () => {
      hoverTweens.closeSceneButton = null;
    });
    hoverTweens.closeSceneButton = tween;
  }
};

const testVideoCollision = (mousePosition: Point, video: Video) => {
  return (
    isPlaying &&
    params.scene.current === Scene.Main &&
    params.scene.transition === 1 &&
    enclosedIn(mousePosition, video.bounds)
  );
};

const updateVideoHover = (mousePosition: Point) => {
  let newVideoHoverIndex = -1;
  for (const [index, video] of params.videos.entries()) {
    const wasHoveringVideo = hoverState.videos[index].current;
    const isHoveringVideo = testVideoCollision(mousePosition, video);
    hoverState.videos[index].current = isHoveringVideo;

    if (wasHoveringVideo !== isHoveringVideo) {
      const transitionStart = isHoveringVideo ? 0 : 1;
      const transitionEnd = isHoveringVideo ? 1 : 0;
      const tweenEasing = isHoveringVideo ? Ease.quintOut : Ease.quintIn;
      let tweenPosition = 0;
      if (hoverTweens.videos[index] != null) {
        tweenPosition =
          constants.VIDEO_HOVER_TRANSITION_TIME -
          hoverTweens.videos[index].position;
      }

      hoverState.videos[index].transition = transitionStart;
      const tween = new Tween(hoverState.videos[index], { override: true }).to(
        { transition: transitionEnd },
        constants.VIDEO_HOVER_TRANSITION_TIME,
        tweenEasing
      );
      tween.setPosition(tweenPosition);
      tween.on("complete", () => {
        hoverTweens.videos[index] = null;
      });
      hoverTweens.videos[index] = tween;
    }
  }

  // Update index with hover results.
  hoverState.currentVideoIndex = newVideoHoverIndex;
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
  updatePlayPauseHover(mousePosition);

  // Check if close scene button is hovered.
  updateCloseSceneHover(mousePosition);

  // Check if videos are hovered.
  updateVideoHover(mousePosition);
};

function setIsPlaying(playing: boolean) {
  isPlaying = playing;

  if (isPlaying) {
    // Play audio.
    playAudio();

    // Play videos.
    videoElement.play();

    // Resume tweens.
    for (const tween of pausableTweens) tween.paused = false;
  } else {
    // Pause audio.
    pauseAudio();

    // Pause videos.
    videoElement.pause();

    // Pause tweens.
    for (const tween of pausableTweens) tween.paused = true;
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
    constants.SCENE_TRANSITION_TIME,
    Ease.quadInOut
  );
  tween.on("change", updateBackgroundTransform);
  tween.on("complete", () => pausableTweens.delete(tween));
  pausableTweens.add(tween);
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
