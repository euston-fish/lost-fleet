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

AsteroidField.prototype.in_range = function(t, l, b, r) {
  let make_rng = (x, y) => new RNG(this.x_coefficient*x + this.y_coefficient*y + this.constant);

  let asteroids = {};
  
  for (let x = Math.floor(l / this.block_size); x < Math.ceil(r / this.block_size); x++) {
    for (let y = Math.floor(t / this.block_size); y < Math.ceil(b / this.block_size); y++) {
      if(!this.asteroids[[x, y]+'']) {
        this.asteroids[[x, y]+''] = {};
        let num_asteroids = 0;
        for(let dx=-1; dx<=1; dx++) {
          for(let dy=-1; dy<=1; dy++) {
            let rng = make_rng(x+dx, y+dy);
            rng.random();
            if(rng.random() > 0.93) {
              num_asteroids += rng.random() > 0.7 ? 1 : 0;
            }
          }
        }
        let rng = make_rng(x, y);
        while(num_asteroids-- > 0) {
          this.asteroids[[x, y]+''][num_asteroids] = new Asteroid(this, { block: [x, y], index: num_asteroids });
        }
      }
      this.asteroids[[x, y]+''].values().forEach((asteroid) => asteroids[[x, y]+':'+asteroid.index] = asteroid);
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
  this.x = mix(rng.random(), 0, field.block_size);
  this.y = mix(rng.random(), 0, field.block_size);
  this.stats = [0, 0, 0].map(() => mix(rng.random(), 0, 255));
  this.shape = Math.round(rng.random()*13);
  this.rotation = rng.random()*2*Math.PI;
}

Asteroid.prototype.position = function() {
  return [this.block[0]*this.field.block_size+this.x, this.block[1]*this.field.block_size+this.y];
}

Asteroid.prototype.size = function() {
  return this.stats.reduce(nums.add, 0) / 10;
}
