import { initScene, startScene, resizeScene } from "./scene";
import { initAudio, startAudio } from "./audio";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const video0 = document.getElementById("video0") as HTMLVideoElement;
const video1 = document.getElementById("video1") as HTMLVideoElement;
const startButton = document.getElementById("start");
const startButtonWrapper = document.getElementById("start-wrapper");

/** Whether the whole thing has been started. */
let isStarted = false;

const onInit = async () => {
  startButton.textContent = "LOADING...";

  const videos = [video0, video1];
  await Promise.all([initScene(canvas, videos), initAudio(videos)]);

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
