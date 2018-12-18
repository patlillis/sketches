const BG_COLOR = '#64868e';

let canvas;
let ctx;

function init() {
  canvas = document.getElementById('canvas');
  ctx = this.canvas.getContext('2d');
  canvas.style.backgroundColor = BG_COLOR;

  resize();
}

function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
