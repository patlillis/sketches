import p5 from "p5";

const sketch = (p: p5) => {
  const CANVAS_SIZE = 800;
  const STEPS = 3;

  let t = 0;

  p.setup = () => {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
  };

  p.draw = () => {
    p.clear();

    let noisePos = 0;
    // Gets an independent sample each time it's called. If called in the same
    // order every "draw", each sample should have perlin-like characteristics.
    const sampleNoise = (start: number, stop: number): number =>
      p.map(p.noise(t, noisePos++), 0, 1, start, stop);

    // Bezier control points.
    const startX = 0;
    const startY = sampleNoise(0, CANVAS_SIZE);
    const control1X = CANVAS_SIZE / 3;
    const control1Y = sampleNoise(0, CANVAS_SIZE);
    const control2X = (2 * CANVAS_SIZE) / 3;
    const control2Y = sampleNoise(0, CANVAS_SIZE);
    const endX = CANVAS_SIZE;
    const endY = sampleNoise(0, CANVAS_SIZE);

    // Draw main bezier shape.
    p.fill("black");
    p.noStroke();
    p.beginShape();
    p.vertex(startX, startY);
    p.bezierVertex(control1X, control1Y, control2X, control2Y, endX, endY);
    p.vertex(endX, CANVAS_SIZE);
    p.vertex(startX, CANVAS_SIZE);
    p.endShape();

    // Update time.
    t += sampleNoise(0, 0.004);
  };
};

new p5(sketch);
