import p5 from "p5";

import ellipseSize from "./thing";

const sketch = (p: p5) => {
  p.draw = () => {
    p.ellipse(ellipseSize, ellipseSize, 80, 80);
  };
};

new p5(sketch);
