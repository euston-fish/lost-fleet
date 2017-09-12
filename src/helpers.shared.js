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
  clamp = (val, min, max) => max === undefined ? Math.max(min || 0, val) : Math.min(max, Math.max(min || 0, val)),
  mix = (val, min, max) => min + (max - min) * val,
  normal = (uniform_1, uniform_2) => Math.sqrt(-2 * Math.log(uniform_1)) * Math.cos(2 * Math.PI * uniform_2), // Using Box-Muller
  towards = (from, to, inc) => from < to ? min(from + inc, to) : max(to, from - inc),
  scalar_angle = ([dx, dy]) => Math.atan2(dy, dx) + (Math.PI * 0.5),
  nums = {
    multiply: (a, b) => a * b,
    divide: (a, b) => a / b,
    add: (a, b) => a + b,
    subtract: (a, b) => a - b,
  },
  is_left = (p0, p1, p2) => ((p1[0] - p0[0]) * (p2[1] - p0[1]) - (p2[0] - p0[0]) * (p1[1] - p0[1])),
  rotate = (p, t) => [p[0]*Math.cos(t) - p[1]*Math.sin(t), p[1]*Math.cos(t)+p[0]*Math.sin(t)],
  zip = (...rest) => rest[0].map((_, i) => rest.map((r) => r[i])),
  dot = (a, b) => zip(a, b).map(([x, y]) => x*y),
  to_html = (md) => {
    [
      [/_(.*?)_/g, 'i'],
      [/\*(.*?)\*/g, 'b'],
      [/^[+\-*] ?(.*?)$/gm, 'li'],
      [/^\d+\. ?(.*?)$/gm, 'oli'],
      [/^# (.*?)$/gm, 'h1'],
      [/^## (.*?)$/gm, 'h2'],
      [/^### (.*?)$/gm, 'h3'],
      ['\n\n<li>', '\n\n<ul><li>', 1],
      ['</li>\n\n', '</li></ul>\n\n', 1],
      ['\n\n<oli>', '<ol><li>', 1],
      ['</oli>\n\n', '</li></ol>\n\n', 1],
      ['<oli>', '<li>', 1],
      ['</oli>', '</li>', 1]
    ].forEach(([regex, tag, verbatim]) => {
      md = md.replace(regex, verbatim ? tag : (_, c) => '<' + tag + '>' + c + '</' + tag + '>');
    })
    return '<p>' + md.split('\n\n').join('</p><p>') + '</p>';
  };

Function.prototype.curry = function(...init_args) {
  return (...extra_args) => this(...init_args.concat(extra_args));
}

Array.prototype.num_pretty = function() {
  return this.map(v => Math.floor(v)).join(', ')
}

function in_rounded_rectangle(point, radius, corner_a, corner_b) {
  if(!corner_b) corner_b = corner_a;
  let t = min(corner_a[1], corner_b[1]),
      b = max(corner_a[1], corner_b[1]),
      l = min(corner_a[0], corner_b[0]),
      r = max(corner_a[0], corner_b[0]),
      x = point[0],
      y = point[1];
  if(l < x && x < r) {
    if(t - radius < y && y < b + radius) return true;
    else return false;
  }
  if(t < y && y < b) {
    if(l - radius < x && x < r + radius) return true;
    else return false;
  }
  if(Math.min(leng(sub(point, [l, t])),
              leng(sub(point, [r, t])),
              leng(sub(point, [l, b])),
              leng(sub(point, [r, b]))) < radius) return true;
  return false;
}

let acceleration = (pos, dest, vel, acc) => {
  let dir_vec = sub(dest, pos);
  let target_vel = scale(norm(dir_vec), acc * (Math.sqrt(1+8*leng(dir_vec)/acc)-1)/2);
  if(leng(dir_vec) < EPSILON && leng(vel) < acc) {
    target_vel = [0, 0];
  }
  let d_accel = sub(target_vel, vel);
  return scale(norm(d_accel), min(acc, leng(d_accel)));
}

// RNG inspired by https://gist.github.com/blixt/f17b47c62508be59987b
function RNG(seed) {
  if(seed < 0) seed *= -1;
  if(seed === 0) seed = 42;
  this.seed = seed % 2147483647;
}

RNG.prototype.random = function() {
  return (this.random_int() - 1)/ 2147483647;
}

RNG.prototype.random_int = function() {
  return this.seed = (this.seed * this.seed * 59749 + this.seed * 16087) % 2147483647;
}

Object.prototype.values = function() {
  return Object.values(this);
}

Object.prototype.entries = function() {
  return Object.entries(this);
}

Array.prototype.sum = function() {
  return this.reduce(nums.add);
}

Array.prototype.zip = function(...args) {
  return zip(this, ...args);
}

Array.prototype.dot = function(...args) {
  return dot(this, ...args);
}
