const BG_COLOR = '#64868e';

let canvas;
let ctx;
let startButton;

async function init() {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  startButton = document.getElementById('start');

  canvas.style.backgroundColor = BG_COLOR;

  resize();

  const componentsLoaded = [];
  componentsLoaded.push(setUpAudio());
  // Push more loading promises.

  await Promise.all(componentsLoaded);
}

function start() {
  playAudio();
  startButton.classList.add('hidden');
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
