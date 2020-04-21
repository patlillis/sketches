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

    params.videos.forEach((video) => {
      ctx.fillStyle = "white";
      ctx.fillRect(video.x, video.y, VIDEO_WIDTH, VIDEO_HEIGHT);
    });

    params.blocks.forEach((block, index) => {
      ctx.fillStyle = `rgb(0, 0, ${(index * 100) % 255})`;
      ctx.fillRect(block.x, block.y, block.width, block.height);
    });
  });

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
