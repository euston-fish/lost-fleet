"use strict";

const colors = [
  'red',
  'green',
  'blue',
  '#2b2b2b',
  'yellow',
  'cyan'
]

function User() {
  let color = colors.splice(Math.random() * colors.length, 1)[0];
  this.color = color;
  this.id = color;
}

/**
 * Terminate game
 */
User.prototype.end = () => {
};

let UnitFactory = (data) => {
  switch(data.type) {
    case 'standard': return new Unit(data);
    default: return null;
  }
}

function Unit(data) {
  this.type = 'standard';
  this.user = data.user;
  this.color = data.color;
  this.x = data.x;
  this.y = data.y;
  this.width = 20;
  this.height = 20;
}

Unit.prototype.draw = function(canvas) {
  if (this.selected) {
    canvas.fillStyle = 'pink';
  } else {
    canvas.fillStyle = this.color;
  }
  canvas.fillRect(this.x, this.y, this.width, this.height);
}

Unit.prototype.covers = function(x, y) {
  return this.x < x && this.y < y && (this.x + this.width) > x && (this.y + this.height) > y;
}
