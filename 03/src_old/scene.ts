import { Tween, Ease, Ticker } from "@createjs/tweenjs";

import params, { updateParamsTick, initParams } from "./params";
import * as constants from "./constants";
import {
  enclosedIn,
  getSceneForVideo,
  getVideoForScene,
  getVideoIndexForScene,
  calculateTransformForVideo,
  lerp,
  colorToString,
} from "./utils";
import { Block, Point, Scene, Video, Circle } from "./types";
import {
  playAudio,
  pauseAudio,
  startPlayingObertonreich,
  stopPlayingObertonreich,
  meter,
} from "./audio";
import { Palette, loadPalette } from "./palette";

export let videoElements: HTMLVideoElement[];
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;
export let palette: Palette;

/*********** Random variables to track state. *******************/

type CircleSynth = { bounds: Circle; note: string };
const circleSynths: CircleSynth[] = [
  { note: "d4", bounds: { x: 450, y: 375, radius: 50 } },
  { note: "e4", bounds: { x: 595, y: 230, radius: 25 } },
  { note: "g4", bounds: { x: 860, y: 455, radius: 135 } },
  { note: "a4", bounds: { x: 725, y: 275, radius: 75 } },
  { note: "b4", bounds: { x: 550, y: 350, radius: 100 } },
  { note: "c5", bounds: { x: 600, y: 300, radius: 75 } },
  { note: "d5", bounds: { x: 860, y: 235, radius: 105 } },
  { note: "e5", bounds: { x: 650, y: 400, radius: 140 } },
];

/** Whether the video is paused or not. */
let isPlaying = false;
/** The transform for "zooming in" on a video. Affects videos and blocks. */
let backgroundTransform = { x: 0, y: 0, scale: 1.0 };
const hoverState = {
  videos: [false, false, false],
  circleSynths: circleSynths.map(() => false),
  playPauseButton: false,
  closeSceneButton: false,
};
const pressState = {
  circleSynths: false,
};
const videoActiveTweens: Tween[] = [];
const videoActiveStates = [
  { isActive: false, transition: 0 },
  { isActive: false, transition: 0 },
  { isActive: false, transition: 0 },
];

const pausableTweens = new Set<Tween>();
let previousFrameTime: number;

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

  // Add video event listeners. This lets us hook into OS-native media controls,
  // such as touch-bar or Chrome's media controls.
  for (const video of videoElements) {
    video.addEventListener(
      "pause",
      () => {
        if (isPlaying) setIsPlaying(false);
      },
      {
        capture: false,
        passive: true,
      }
    );
    video.addEventListener(
      "play",
      () => {
        if (!isPlaying) setIsPlaying(true);
      },
      {
        capture: false,
        passive: true,
      }
    );
  }

  // Add canvas event listeners.
  canvasElement.addEventListener("mousedown", onMouseClick, {
    capture: false,
    passive: true,
  });
  canvasElement.addEventListener(
    "mousemove",
    ({ pageX: x, pageY: y }) => onMouseMove({ x, y }),
    { capture: false }
  );
  canvasElement.addEventListener("mouseup", onMouseRelease, {
    capture: false,
    passive: true,
  });
  canvasElement.addEventListener("mouseleave", onMouseRelease, {
    capture: false,
    passive: true,
  });

  // Initialize canvas size.
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;

  // Initialize random params.
  initParams(canvasElement.width, canvasElement.height);

  // Initialize background transform.
  updateBackgroundTransform();

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
    ctx.translate(backgroundTransform.x, backgroundTransform.y);
    ctx.scale(backgroundTransform.scale, backgroundTransform.scale);

    // Draw videos.
    params.videos.forEach((video, videoIndex) => {
      ctx.drawImage(
        videoElements[videoIndex % videoElements.length],
        video.bounds.x,
        video.bounds.y,
        video.bounds.width,
        video.bounds.height
      );

      // TODO: remove once there are different videos to play.
      switch (videoIndex) {
        case 0:
          ctx.strokeStyle = "rgba(0,0,255,1)";
          break;
        case 1:
          ctx.strokeStyle = "rgba(0,255,0,1)";
          break;
        case 2:
          ctx.strokeStyle = "rgba(255,0,0,1)";
          break;
      }
      ctx.strokeRect(
        video.bounds.x,
        video.bounds.y,
        video.bounds.width,
        video.bounds.height
      );
    });

    // Draw blocks.
    params.blocks.forEach((block, index) => {
      // Figure out the adjustment to hide the block for hovered video.
      let adjustment: Block = { x: 0, y: 0, width: 0, height: 0 };
      for (const [index, video] of block.intersectingVideos.entries()) {
        const { transition } = videoActiveStates[index];
        adjustment = lerp(adjustment, video.adjustment, transition);
      }

      ctx.fillStyle = colorToString(block.color);
      ctx.fillRect(
        block.x + adjustment.x,
        block.y + adjustment.y,
        block.width + adjustment.width,
        block.height + adjustment.height
      );
    });
  });

  // Draw circle pads.
  if (
    params.scene.current === Scene.Video0 &&
    params.scene.transition === 1.0
  ) {
    wrapDraw(() => {
      ctx.globalAlpha = 0.5;

      for (const [synthIndex, synth] of circleSynths.entries()) {
        if (hoverState.circleSynths[synthIndex]) {
          ctx.beginPath();
          ctx.arc(
            synth.bounds.x,
            synth.bounds.y,
            synth.bounds.radius,
            0,
            2 * Math.PI
          );
          ctx.fillStyle = colorToString(
            pressState.circleSynths
              ? palette.circleSynthPressed
              : palette.circleSynth
          );
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(
            synth.bounds.x,
            synth.bounds.y,
            synth.bounds.radius - constants.UI_THICKNESS / 2,
            0,
            2 * Math.PI
          );
          ctx.strokeStyle = colorToString(palette.circleSynth);
          ctx.lineWidth = constants.UI_THICKNESS;
          ctx.stroke();
        }
      }
    });
  }

  // Draw dB meter.
  if (constants.DEBUG) {
    wrapDraw(() => {
      const level = meter.getValue();
      ctx.font = "16px sans-serif";
      ctx.fillStyle = "white";
      ctx.fillText(
        `${(level as number).toFixed(0)}dB`,
        constants.UI_PADDING,
        constants.UI_PADDING
      );
      if (fps != null && fps !== Infinity) {
        ctx.fillText(
          `${fps.toFixed(1)}fps`,
          constants.UI_PADDING,
          constants.UI_PADDING + 24
        );
      }
    });
  }

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
    ctx.translate(-5, -5);
    drawPlayPause();
  });

  wrapDraw(() => {
    const color = hoverState.playPauseButton ? palette.uiHover : palette.ui;
    ctx.fillStyle = colorToString(color);
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
      ctx.translate(-5, -5);
      drawCloseScene();
    });

    wrapDraw(() => {
      const color = hoverState.closeSceneButton ? palette.uiHover : palette.ui;
      ctx.fillStyle = colorToString(color);
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
  for (const videoElement of videoElements) videoElement.play();
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
  hoverState.playPauseButton = testPlayPauseCollision(mousePosition);
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
  hoverState.closeSceneButton = testCloseSceneCollision(mousePosition);
};

const testCircleSynthCollision = (mousePosition: Point, synth: CircleSynth) => {
  return (
    isPlaying &&
    params.scene.current === Scene.Video0 &&
    params.scene.transition === 1 &&
    enclosedIn(mousePosition, synth.bounds)
  );
};

const updateCircleSynthsHover = (mousePosition: Point) => {
  for (const [synthIndex, synth] of circleSynths.entries()) {
    const wasHovering = hoverState.circleSynths[synthIndex];
    const isHovering = testCircleSynthCollision(mousePosition, synth);

    if (pressState.circleSynths) {
      if (wasHovering && !isHovering) stopPlayingObertonreich(synth.note);
      if (!wasHovering && isHovering) startPlayingObertonreich(synth.note);
    }

    hoverState.circleSynths[synthIndex] = isHovering;
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

const updateVideoActiveState = (
  videoIndex: number,
  {
    newIsHovering,
    newIsInScene,
  }: { newIsHovering?: boolean; newIsInScene?: boolean }
) => {
  const video = params.videos[videoIndex];
  const previousIsInScene = getVideoForScene(params.scene.current) === video;

  const previousIsActive = videoActiveStates[videoIndex].isActive;
  let newIsActive = false;
  if (newIsHovering || newIsInScene) newIsActive = true;
  if (newIsInScene == null && previousIsInScene) newIsActive = true;

  videoActiveStates[videoIndex].isActive = newIsActive;

  if (previousIsActive != newIsActive) {
    const transitionStart = newIsActive ? 0 : 1;
    const transitionEnd = newIsActive ? 1 : 0;
    const tweenEasing = newIsActive ? Ease.quintOut : Ease.quintIn;
    let tweenPosition = 0;
    if (videoActiveTweens[videoIndex] != null) {
      tweenPosition =
        constants.VIDEO_ACTIVE_TRANSITION_TIME -
        videoActiveTweens[videoIndex].position;
      pausableTweens.delete(videoActiveTweens[videoIndex]);
    }

    videoActiveStates[videoIndex].transition = transitionStart;
    const tween = new Tween(videoActiveStates[videoIndex], {
      override: true,
    }).to(
      { transition: transitionEnd },
      constants.VIDEO_ACTIVE_TRANSITION_TIME,
      tweenEasing
    );
    tween.setPosition(tweenPosition);
    tween.on("complete", () => {
      videoActiveTweens[videoIndex] = null;
      pausableTweens.delete(tween);
    });
    videoActiveTweens[videoIndex] = tween;
    pausableTweens.add(tween);
  }
};

const updateVideoHover = (mousePosition: Point) => {
  for (const [videoIndex, video] of params.videos.entries()) {
    const wasHoveringVideo = hoverState.videos[videoIndex];
    const isHoveringVideo = testVideoCollision(mousePosition, video);

    hoverState.videos[videoIndex] = isHoveringVideo;

    if (wasHoveringVideo !== isHoveringVideo) {
      updateVideoActiveState(videoIndex, { newIsHovering: isHoveringVideo });
    }
  }
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

  // Check if clicked on circle synths.
  for (const [synthIndex, synth] of circleSynths.entries()) {
    if (testCircleSynthCollision(mousePosition, synth)) {
      pressState.circleSynths = true;
      startPlayingObertonreich(synth.note);
    }
  }
};

const onMouseMove = (mousePosition: Point) => {
  // Check if play/pause is hovered.
  updatePlayPauseHover(mousePosition);

  // Check if close scene button is hovered.
  updateCloseSceneHover(mousePosition);

  // Check if videos are hovered.
  updateVideoHover(mousePosition);

  // Check if circle synths are hovered.
  updateCircleSynthsHover(mousePosition);
};

const onMouseRelease = (event: MouseEvent) => {
  // Track release of any circle synths being pressed.
  pressState.circleSynths = false;

  for (const [synthIndex, synth] of circleSynths.entries()) {
    if (hoverState.circleSynths[synthIndex]) {
      stopPlayingObertonreich(synth.note);
    }
  }

  // Make sure to update hover tracking so that things aren't hovered any more.
  // onMouseMove({ x: -1000, y: -1000 });
};

export function toggleIsPlaying() {
  setIsPlaying(!isPlaying);
}

function setIsPlaying(playing: boolean) {
  isPlaying = playing;

  if (isPlaying) {
    // Play audio.
    playAudio();

    // Play videos.
    for (const videoElement of videoElements) videoElement.play();

    // Resume tweens.
    for (const tween of pausableTweens) tween.paused = false;
  } else {
    // Pause audio.
    pauseAudio();

    // Pause videos.
    for (const videoElement of videoElements) videoElement.pause();

    // Pause tweens.
    for (const tween of pausableTweens) tween.paused = true;
  }
}

function setScene(scene: Scene) {
  const previousScene = params.scene.current;
  const videoIndexForNewScene = getVideoIndexForScene(scene);
  const videoIndexForPreviousScene = getVideoIndexForScene(previousScene);

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
  tween.on("change", () => {
    updateBackgroundTransform();

    // This makes it so that when we're transitioning back to main scene, the
    // blocks go back into place at the end of the transition.
    if (
      constants.SCENE_TRANSITION_TIME - tween.position <
      constants.VIDEO_ACTIVE_TRANSITION_TIME
    ) {
      if (videoIndexForNewScene != -1) {
        updateVideoActiveState(videoIndexForNewScene, { newIsInScene: true });
      }
      if (videoIndexForPreviousScene != -1) {
        updateVideoActiveState(videoIndexForPreviousScene, {
          newIsInScene: false,
        });
      }
    }
  });
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
