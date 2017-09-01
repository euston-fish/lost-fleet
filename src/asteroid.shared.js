"use strict";

//// Asteroid ////

function AsteroidField(seed) {
  let master = new RNG(seed);
  this.block_size = 300,
  this.x_coefficient = master.random_int(),
  this.y_coefficient = master.random_int(),
  this.i_coefficient = master.random_int(),
  this.constant = master.random_int(),
  this.asteroids = {}
}

AsteroidField.prototype.block = function(x, y) {
  let make_rng = (x, y) => new RNG(this.x_coefficient*x + this.y_coefficient*y + this.constant);

  if(!this.asteroids[[x, y]+'']) {
    this.asteroids[[x, y]+''] = {};
    let num_asteroids = 0;
    for(let dx=-1; dx<=1; dx++) {
      for(let dy=-1; dy<=1; dy++) {
        let rng = make_rng(x+dx, y+dy);
        if(rng.random() > 0.93) {
          num_asteroids += rng.random() > 0.7 ? 1 : 0;
        }
      }
    }
    while(num_asteroids-- > 0) {
      this.asteroids[[x, y]+''][num_asteroids] = new Asteroid(this, { block: [x, y], index: num_asteroids });
    }
  }
  return this.asteroids[[x, y]+''];
}

AsteroidField.prototype.asteroid = function(x, y, i) {
  return this.block(x, y)[i];
}

AsteroidField.prototype.in_range = function(t, l, b, r) {
  let asteroids = {};
  for (let x = Math.floor(l / this.block_size); x < Math.ceil(r / this.block_size); x++) {
    for (let y = Math.floor(t / this.block_size); y < Math.ceil(b / this.block_size); y++) {
      this.block(x, y).values().forEach((asteroid) => asteroids[[x, y]+':'+asteroid.index] = asteroid);
    }
  }
  return asteroids;
}

function Asteroid(field, { block: block,
                           index: index }) {
  this.field = field;
  this.block = block;
  this.index = index;
  let rng = new RNG(field.x_coefficient*block[0] + field.y_coefficient*block[1] + field.i_coefficient*index);
  this.position = [this.block[0]*this.field.block_size+mix(rng.random(), 0, field.block_size),
                   this.block[1]*this.field.block_size+mix(rng.random(), 0, field.block_size)];
  let emphasis = (this.block[0] + this.block[1]) % 3;
  this.stats = [0, 0, 0].map((_, idx) => mix(rng.random(), idx == emphasis ? 1400 : 0, idx == emphasis ? 2550 : 1800));
  this.shape_id = Math.round(rng.random()*Asteroid.asteroid_shapes.length-0.5);
  this.rotation = rng.random()*2*Math.PI;
}

Asteroid.asteroid_shapes = [
  [[-1,-0.75],[0,-0.75],[0,1.25],[-1,0.25]],
  [[-1.5,-2.5],[-0.5,-1.5],[-1.5,0.5],[-2.5,0.5],[-2.5,-0.5],[-3.5,-1.5]],
  [[-0,-1.5],[1,-0.5],[1,0.5],[-1,1.5],[-1,-0.5]],
  [[-0.5,-1.5],[0.5,-1.5],[0.5,-0.5],[1.5,0.5],[-0.5,1.5],[-1.5,-0.5]],
  [[-2.75,-0],[-0.75,2],[-1.75,3],[-1.75,4],[-2.75,5],[-3.75,5],[-4.75,3],[-3.75,2],[-3.75,1]],
  [[-0.75,-1.75],[1.25,-1.75],[2.25,0.25],[1.25,2.25],[0.25,2.25],[-0.75,1.25],[-2.75,0.25]],
  [[0.25,-2.25],[1.25,-0.25],[1.25,0.75],[0.25,1.75],[-1.75,0.75],[-0.75,-1.25]],
  [[-0.75,-2.25],[0.25,-1.25],[1.25,-1.25],[2.25,0.75],[1.25,1.75],[-0.75,1.75],[-1.75,0.75],[-1.75,-1.25]],
  [[-1,-1.5],[0,-1.5],[0,-0.5],[1,-1.5],[2,-0.5],[1,1.5],[0,1.5],[-1,0.5],[-2,0.5],[-2,-0.5]],
  [[-1,-2],[0,-2],[1,-1],[2,1],[1,3],[0,2],[0,1],[-1,1],[-2,2],[-2,0],[-1,-1]],
  [[-0.25,-1.5],[0.75,-0.5],[0.75,1.5],[-1.25,0.5]],
  [[-0,-1.5],[1,-0.5],[0,1.5],[-1,0.5],[-1,-0.5]],
  [[-1.5,-1.75],[0.5,-0.75],[1.5,0.25],[1.5,1.25],[0.5,2.25],[-0.5,0.25],[-1.5,0.25]],
  [[-0.25,-1.75],[0.75,-1.75],[0.75,-0.75],[1.75,-0.75],[0.75,0.25],[0.75,1.25],[-0.25,1.25],[-1.25,0.25],[-1.25,-0.75],[-0.25,-0.75]]
];

Asteroid.prototype.get_index = function() {
  return [...this.block, this.index];
}

Asteroid.prototype.size = function() {
  return this.stats.reduce(nums.add, 0) / 100;
}

Asteroid.prototype.shape = function() {
  return Asteroid.asteroid_shapes[this.shape_id]
    .map((p) => add(this.position, rotate(scale(p, this.size()), this.rotation)));
}

// point in polygon from http://geomalgorithms.com/a03-_inclusion.html
Asteroid.prototype.point_in = function(point) {
  let wn = 0;
  let shape = this.shape();
  for (let i=0; i<shape.length; i++) {
    if (shape[i][1] <= point[1]) {
      if (shape[(i+1)%shape.length][1] > point[1]) {
        if (is_left(shape[i], shape[(i+1)%shape.length], point) > 0) {
          wn++;
        }
      }
    } else {
      if (shape[(i+1)%shape.length][1] <= point[1]) {
        if (is_left(shape[i], shape[(i+1)%shape.length], point) < 0) {
          wn--;
        }
      }
    }
  }
  return wn !== 0;
}

// Minable things

Asteroid.prototype.decrease_stats = function(amount) {
  [0,1,2].forEach((i) => this.stats[i] = clamp(this.stats[i] - amount));
  // FUCK YES THIS IS THE BEST JAVASCRIPT IS MY FAVORITE LANGUAGE EVA!!!!1111!!!
  if (this.stats == '0,0,0') this.destroy();
}

Asteroid.prototype.destroy = function() {
  delete this.field.block(...this.block)[this.index];
}
