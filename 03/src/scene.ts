import params, { randomizeParams, updateParamsTick } from "./params";
import * as constants from "./constants";
import { enclosedIn } from "./utils";
import tombola from "./tombola";
import { Block, Point } from "./types";
import { playAudio, pauseAudio } from "./audio";

export let videoElement: HTMLVideoElement;
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

export let isPlaying = false;

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

  randomizeParams(canvasElement.width, canvasElement.height);
};

const wrapDraw = (drawFunc: () => void) => {
  ctx.save();
  drawFunc();
  ctx.restore();
};

const draw = () => {
  // Draw scene using current random params.
  wrapDraw(() => {
    // Draw videos.
    params.videos.forEach((video) => {
      ctx.drawImage(
        videoElement,
        video.bounds.x,
        video.bounds.y,
        video.bounds.width,
        video.bounds.height
      );
    });
  });

  // Draw blocks.
  wrapDraw(() => {
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

  // Draw play/pause.
  wrapDraw(() => {
    ctx.fillStyle = "white";

    if (isPlaying) {
      ctx.fillRect(
        constants.PLAY_PAUSE_PADDING,
        canvasElement.height -
          constants.PLAY_PAUSE_PADDING -
          constants.PLAY_PAUSE_SIZE,
        (constants.PLAY_PAUSE_SIZE * 3) / 7,
        constants.PLAY_PAUSE_SIZE
      );
      ctx.fillRect(
        constants.PLAY_PAUSE_PADDING + (constants.PLAY_PAUSE_SIZE * 4) / 7,
        canvasElement.height -
          constants.PLAY_PAUSE_PADDING -
          constants.PLAY_PAUSE_SIZE,
        (constants.PLAY_PAUSE_SIZE * 3) / 7,
        constants.PLAY_PAUSE_SIZE
      );
    } else {
      ctx.beginPath();
      // Top corner.
      ctx.moveTo(
        constants.PLAY_PAUSE_PADDING,
        canvasElement.height -
          constants.PLAY_PAUSE_PADDING -
          constants.PLAY_PAUSE_SIZE
      );
      // Bottom corner.
      ctx.lineTo(
        constants.PLAY_PAUSE_PADDING,
        canvasElement.height - constants.PLAY_PAUSE_PADDING
      );
      // Tip.
      ctx.lineTo(
        constants.PLAY_PAUSE_PADDING + constants.PLAY_PAUSE_SIZE,
        canvasElement.height -
          constants.PLAY_PAUSE_PADDING -
          constants.PLAY_PAUSE_SIZE / 2
      );
      ctx.closePath();
      ctx.fill();
    }
  });

  // Update random params.
  updateParamsTick();

  // RAF for next frame.
  requestAnimationFrame(draw);
};

export const startScene = async () => {
  isPlaying = true;
  videoElement.play();
  draw();
  canvasElement.classList.remove("hidden");
};

export const resizeScene = () => {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
};

const onClick = (event: MouseEvent) => {
  const mousePosition: Point = { x: event.pageX, y: event.pageY };

  // Check play/pause.
  const playPauseBlock: Block = {
    x: constants.PLAY_PAUSE_PADDING,
    y:
      canvasElement.height -
      constants.PLAY_PAUSE_PADDING -
      constants.PLAY_PAUSE_SIZE,
    width: constants.PLAY_PAUSE_SIZE,
    height: constants.PLAY_PAUSE_SIZE,
  };

  if (enclosedIn(mousePosition, playPauseBlock)) {
    setIsPlaying(!isPlaying);
  }
};

function setIsPlaying(playing: boolean) {
  isPlaying = playing;

  if (playing) {
    playAudio();
  } else {
    pauseAudio();
  }
}
