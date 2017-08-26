"use strict";

const colors = [
  'red',
  'green',
  'blue',
  '#2b2b2b',
  'yellow',
  'cyan'
]
let units = {};

//function User() {
  //let color = colors.splice(Math.random() * colors.length, 1)[0];
  //this.color = color;
  //this.id = color;
//}

/**
 * Terminate game
 */
//User.prototype.end = () => {
//};

//let UnitFactory = (data) => {
  //switch(data.type) {
    //case 'standard': return new Unit(data);
    //default: return null;
  //}
//}

function Unit() {
  this.position = [0, 0];
  //this.type = 'standard';
  //this.user = data.user;
  //this.color = data.color;
  //this.x = data.x;
  //this.y = data.y;
  //this.width = 20;
  //this.height = 20;
}

Unit.prototype.draw = function(canvas) {
  console.log('drawing unit', this);
  if (this.selected) {
    canvas.fillStyle = 'pink';
  } else {
    canvas.fillStyle = 'blue';
  }
  let [x, y] = this.position;
  canvas.fillRect(x, y, 10, 10);
}

Unit.prototype.covers = function(x, y) {
  return this.x < x && this.y < y && (this.x + this.width) > x && (this.y + this.height) > y;
}

function new_unit_id() {
  let id = new_unit_id.counter;
  new_unit_id.counter += 1;
  return id;
}

new_unit_id.counter = 0;

function add([x, y], [z, w]) {
  return [x+z, y+w];
}

function inv([x, y]) {
  return [-x, -y];
}

function scale([x, y], f) {
  return [f*x, f*y];
}

function norm([x, y]) {
  let l = Math.sqrt(x*x+y*y);
  return [x/l, y/l];
}

function move_towards(position, target, speed) {
  return add(position, scale(norm(add(target, inv(position))), speed));
}

function Drone(obj) {
  Unit.call(this);
  if(obj === undefined) {
    this.id = new_unit_id();
    units[this.id] = this;
    this.theta = 0;
    this.speed = 5;
    this.stats = [0, 0, 0];
    this.target = null;
  } else {
    this.id = obj.id;
    units[this.id] = this;
    this.position = obj.position;
    this.theta = obj.theta;
    this.speed = obj.speed;
    this.stats = obj.stats;
    this.target = obj.target;
  }
}

Drone.prototype = Object.create(Unit.prototype, {});

function Structure() {
  this.id = new_unit_id();
  units[this.id] = this;
  this.position = [0, 0];
  this.stats = [0, 0, 0];
}

Drone.prototype.receive = function(command, ...params) {
  console.log('received', command, ...params);
  this[command](...params);
}

Drone.prototype.move_to = function(target) {
  this.target = target;
}

Drone.prototype.tick = function() {
  if(this.target !== null) this.position = move_towards(this.position, this.target, this.speed);
}
