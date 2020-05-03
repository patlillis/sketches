import { initScene, startScene, resizeScene } from "./scene";
import { initAudio, startAudio } from "./audio";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const video = document.getElementById("video") as HTMLVideoElement;
const startButton = document.getElementById("start");
const startButtonWrapper = document.getElementById("start-wrapper");

const onInit = async () => {
  startButton.textContent = "LOADING...";
  startButton.toggleAttribute("disabled");

  await Promise.all([initScene(canvas, video), initAudio()]);

  startButton.textContent = "START";
  startButton.removeAttribute("disabled");

  const requireUserInteraction = true;
  if (!requireUserInteraction) {
    startButtonWrapper.remove();
    await startScene();
    await startAudio();
  }
};

const onResize = () => {
  resizeScene();
};

const onStartClicked = async () => {
  startButtonWrapper.remove();
  startScene();
  await startAudio();
};

startButton.addEventListener("click", onStartClicked);
window.addEventListener("load", onInit);
window.addEventListener("resize", onResize);
