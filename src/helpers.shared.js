const EPSILON=1;

let
  add = ([x, y], [z, w]) => [x+z, y+w],
  inv = ([x, y]) => [-x, -y],
  scale = ([x, y], f) => [f*x, f*y],
  norm = ([x, y]) => {
    let l = Math.sqrt(x*x+y*y);
    return [x/l, y/l];
  },
  leng = ([x, y]) => Math.sqrt(x*x+y*y),
  clamp = (val) => Math.max(0, val),
  mix = (val, min, max) => min + (max - min) * val;
