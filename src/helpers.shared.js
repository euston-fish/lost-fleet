const EPSILON=1;

function add([x, y], [z, w]) {
  return [x+z, y+w];
}

function inv([x, y]) {
  return [-x, -y];
}

function sub(a, b) {
  // subtract b from a
  return add(a, inv(b));
}

function scale([x, y], f) {
  return [f*x, f*y];
}

function norm([x, y]) {
  let l = leng([x, y]);
  if(l === 0) return [0, 0];
  return [x/l, y/l];
}

function leng([x, y]) {
  return Math.sqrt(x*x+y*y);
}

function clamp(val) {
  return Math.max(0, Math.min(255, val))
}

function mix(val, min, max) {
  return min + (max - min) * val;
}

function sign(x) {
  if (x < 0) return -1;
  else if (x > 0) return 1;
  else return 0;
}

function combine(fx, fy) {
  return function(a, b) {
    return [fx(a[0], b[0]), fy(a[1], b[1])];
  }
}

let tl = combine(Math.min, Math.min);
let tr = combine(Math.max, Math.min);
let bl = combine(Math.min, Math.max);
let br = combine(Math.max, Math.max);

function in_rounded_rectangle(point, radius, corner_a, corner_b) {
  console.log(point, radius, corner_a, corner_b);
  let tl_ = tl(corner_a, corner_b);
  let br_ = br(corner_a, corner_b);
  let tr_ = tr(corner_a, corner_b);
  let bl_ = bl(corner_a, corner_b);
  if(tl_[0] < point[0] && point[0] < br_[0]) {
    if(tl_[0] - radius < point[0] && point[0] < br_[0] + radius) return true;
    else return false;
  }
  if(tl_[1] < point[1] && point[1] < br_[1]) {
    if(tl_[1] - radius < point[1] && point[1] < br_[1] + radius) return true;
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
