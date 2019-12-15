(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(require('p5')) :
  typeof define === 'function' && define.amd ? define(['p5'], factory) :
  (global = global || self, factory(global.p5));
}(this, (function (p5) { 'use strict';

  p5 = p5 && p5.hasOwnProperty('default') ? p5['default'] : p5;

  const ellipseSize = 50;

  const sketch = (p) => {
      p.draw = () => {
          p.ellipse(ellipseSize, ellipseSize, 80, 80);
      };
  };
  new p5(sketch);

})));
