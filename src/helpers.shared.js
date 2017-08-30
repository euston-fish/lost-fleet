const EPSILON=1;

let
  min = Math.min,
  max = Math.max,
  add = ([x, y], [z, w]) => [x+z, y+w],
  inv = ([x, y]) => [-x, -y],
  sub = (a, b) => add(a, inv(b)),
  scale = ([x, y], f) => [f*x, f*y],
  leng = ([x, y]) => Math.sqrt(x*x+y*y),
  norm = (a) => {
    let l = leng(a);
    return (l !== 0) ? scale(a, 1/l) : [0, 0];
  },
  clamp = (val) => Math.max(0, val),
  mix = (val, min, max) => min + (max - min) * val,
  combine = (fx, fy) => ((a, b) => [fx(a[0], b[0]), fy(a[1], b[1])]),
  tl = combine(min, min),
  tr = combine(max, min),
  bl = combine(min, max),
  br = combine(max, max);

function in_rounded_rectangle(point, radius, corner_a, corner_b) {
  console.log(point, radius, corner_a, corner_b);
  let tl_ = tl(corner_a, corner_b);
  let br_ = br(corner_a, corner_b);
  let tr_ = tr(corner_a, corner_b);
  let bl_ = bl(corner_a, corner_b);
  if(tl_[0] < point[0] && point[0] < br_[0]) {
    if(tl_[1] - radius < point[1] && point[1] < br_[1] + radius) return true;
    else return false;
  }
  if(tl_[1] < point[1] && point[1] < br_[1]) {
    if(tl_[0] - radius < point[0] && point[0] < br_[0] + radius) return true;
    else return false;
  }
  if(Math.min(leng(sub(point, tl_)),
              leng(sub(point, tr_)),
              leng(sub(point, bl_)),
              leng(sub(point, br_))) < radius) return true;
  return false;
}

// RNG inspired by https://gist.github.com/blixt/f17b47c62508be59987b
function RNG(seed) {
  this.seed = seed % 2147483647;
  if(this.seed <= 0) seed += 2147483647;
}

RNG.prototype.random = function() {
  return ((this.seed = this.seed * 16087 % 2147483647) - 1)/ 2147483647;
}
