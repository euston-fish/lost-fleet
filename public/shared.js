"use strict";

let units = {};

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
  if(obj === undefined) {
    this.id = new_unit_id();
    units[this.id] = this;
    this.position = [0, 0];
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
