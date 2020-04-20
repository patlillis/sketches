const BG_COLOR = "#64868e";

let canvas;
let ctx;
let startButton;

async function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  startButton = document.getElementById("start");

  canvas.style.backgroundColor = BG_COLOR;

  resize();

  await setUpAudio();
}

async function start() {
  Tone.start();
  playAudio();
  startButton.classList.add("hidden");
  await setUpGui();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
