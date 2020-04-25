import params, { randomizeParams, updateParams } from "./params";
import * as constants from "./constants";
import { enclosedIn } from "./types";
import tombola from "./tombola";

export let videoElement: HTMLVideoElement;
export let canvasElement: HTMLCanvasElement;
export let ctx: CanvasRenderingContext2D;

export const initScene = (
  canvas: HTMLCanvasElement,
  video: HTMLVideoElement
) => {
  canvasElement = canvas;
  ctx = canvasElement.getContext("2d");
  videoElement = video;

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

    // Draw blocks.
    params.blocks.forEach((block, index) => {
      const hide = params.videos.some((video) =>
        enclosedIn(block, video.bounds)
      );
      if (!hide) {
        ctx.fillStyle = `rgb(${block.color.r}, ${block.color.g}, ${block.color.b})`;
        ctx.fillRect(block.x, block.y, block.width, block.height);
      }
    });
  });

  // Update random params.
  updateParams();

  // RAF for next frame.
  requestAnimationFrame(draw);
};

export const startScene = () => {
  canvasElement.classList.remove("hidden");
  videoElement.play();
  draw();
};

export const resizeScene = () => {
  canvasElement.width = window.innerWidth;
  canvasElement.height = window.innerHeight;
};
