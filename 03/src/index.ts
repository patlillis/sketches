import { initScene, startScene, resizeScene } from "./scene";
import { initAudio, startAudio } from "./audio";
import { Scene } from "./types";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const videos: { [scene in Scene]?: HTMLVideoElement } = {
  [Scene.Circles]: document.getElementById("video0") as HTMLVideoElement,
  [Scene.Harp]: document.getElementById("video1") as HTMLVideoElement,
  [Scene.Blocks]: document.getElementById("video2") as HTMLVideoElement,
};
const videosLoadedPromises = Object.values(videos).map(
  (video) =>
    new Promise((resolve) => video.addEventListener("canplaythrough", resolve))
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

  const requireUserInteraction = true;
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
