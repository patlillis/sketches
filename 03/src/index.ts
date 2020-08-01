import { initScene, startScene, resizeScene } from "./scene";
import { initAudio, startAudio } from "./audio";
import { Scene } from "./types";

import "../styles/index.scss";

const HAVE_ENOUGH_DATA = 4;

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const videos: { [scene in Scene]?: HTMLVideoElement } = {
  [Scene.Pinata]: document.getElementById("video0") as HTMLVideoElement,
  [Scene.Snowfall]: document.getElementById("video1") as HTMLVideoElement,
  [Scene.Poolside]: document.getElementById("video2") as HTMLVideoElement,
};

const videosLoadedPromises = Object.values(videos).map(
  (video) =>
    new Promise((resolve) => {
      if (video.readyState === HAVE_ENOUGH_DATA) {
        resolve();
      } else {
        video.addEventListener("canplaythrough", resolve);
      }
    })
);
const startButton = document.getElementById("start");
const startButtonWrapper = document.getElementById("start-wrapper");

/** Whether the whole thing has been started. */
let isStarted = false;

const onInit = async () => {
  startButton.textContent = "LOADING...";

  // Wait for loading and setup.
  await Promise.all([
    ...videosLoadedPromises,
    initScene(canvas, videos),
    initAudio(videos),
  ]);

  // Allow starting scene.
  startButton.textContent = "START";
  startButton.removeAttribute("disabled");

  const requireUserInteraction = false;
  if (!requireUserInteraction) {
    await onStartClicked();
  }
};

const onResize = () => {
  resizeScene({ x: window.innerWidth, y: window.innerHeight });
};

const onStartClicked = async () => {
  isStarted = true;
  startButtonWrapper.remove();
  await startScene();
  await startAudio();
};

startButton.addEventListener("click", onStartClicked);
window.addEventListener("load", onInit);
window.addEventListener("resize", onResize);
