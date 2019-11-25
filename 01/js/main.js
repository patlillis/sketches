const BG_COLOR = "#64868e";

let canvas;
let ctx;
let startButton;
let audioContextStartedPromise = StartAudioContext(Tone.context, "#start");

async function init() {
  canvas = document.getElementById("canvas");
  ctx = canvas.getContext("2d");
  startButton = document.getElementById("start");

  canvas.style.backgroundColor = BG_COLOR;

  resize();

  await setUpAudio();
  await setUpGui();
}

async function start() {
  await audioContextStartedPromise;
  playAudio();
  startButton.classList.add("hidden");
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
