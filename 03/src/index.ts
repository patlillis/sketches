import { initScene, startScene, resizeScene } from "./scene";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const video = document.getElementById("video") as HTMLVideoElement;
const startButton = document.getElementById("start");
const startButtonWrapper = document.getElementById("start-wrapper");

const onInit = () => {
  initScene(canvas, video);
};

const onResize = () => {
  resizeScene();
};

const onStartClicked = () => {
  startButtonWrapper.remove();
  startScene();
};

startButton.addEventListener("click", onStartClicked);
window.addEventListener("load", onInit);
window.addEventListener("resize", onResize);
