const BG_COLOR = '#64868e';

let canvas;
let ctx;

async function init() {
  canvas = document.getElementById('canvas');
  ctx = this.canvas.getContext('2d');
  canvas.style.backgroundColor = BG_COLOR;

  resize();

  const componentsLoaded = [];
  componentsLoaded.push(setupAudio());
  // Push more loading promises.

  await Promise.all(componentsLoaded);

  playAudio();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
