import params, { randomizeParams, updateParams } from "./params";
import { VIDEO_WIDTH, VIDEO_HEIGHT } from "./constants";

export let video: HTMLVideoElement;
export let canvas: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

export const initScene = (
  canvasElement: HTMLCanvasElement,
  videoElement: HTMLVideoElement
) => {
  canvas = canvasElement;
  ctx = canvas.getContext("2d");
  video = videoElement;

  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  randomizeParams(canvas.width, canvas.height);
};

const wrapDraw = (drawFunc: () => void) => {
  ctx.save();
  drawFunc();
  ctx.restore();
};

const draw = () => {
  // Draw scene using current random params.
  wrapDraw(() => {
    ctx.fillStyle = "red";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  });

  for (const video of params.videos) {
    wrapDraw(() => {
      ctx.fillStyle = "black";
      ctx.fillRect(video.x, video.y, VIDEO_WIDTH, VIDEO_HEIGHT);
    });
  }

  // Update random params.
  updateParams();

  // RAF for next frame.
  requestAnimationFrame(draw);
};

export const startScene = () => {
  canvas.classList.remove("hidden");
  video.play();
  draw();
};

export const resizeScene = () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
};
