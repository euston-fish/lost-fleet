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
let users;

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
  this.position = [50, 50];
  //this.type = 'standard';
  //this.user = data.user;
  //this.color = data.color;
  //this.x = data.x;
  //this.y = data.y;
  //this.width = 20;
  //this.height = 20;
}

Unit.prototype.draw = function(canvas) {
  //console.log('drawing unit', this);
  canvas.fillStyle = this.selected ? 'orange' : this.color();
  let [x, y] = this.position;
  canvas.beginPath();
  canvas.arc(Math.round(x), Math.round(y), 5, 0, Math.PI * 2);
  canvas.fill();
  //canvas.fillRect(x, y, 10, 10);
}

Unit.prototype.color = function() {
  return 'rgb(' + this.stats + ')';
}

Unit.prototype.in_region = function([tl_x, tl_y], [br_x, br_y]) {
  let [x, y] = this.position;
  return tl_x-5 < x && x < br_x+5 && tl_y-5 < y && y < br_y+5;
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

function leng([x, y]) {
  return Math.sqrt(x*x+y*y);
}

function move_towards(position, target, speed) {
  if(leng(add(target, inv(position))) < speed) return target;
  return add(position, scale(norm(add(target, inv(position))), speed));
}

function Drone(owner_id, obj) {
  Unit.call(this);
  if(obj === undefined) {
    this.id = new_unit_id();
    units[this.id] = this;
    this.theta = 0;
    this.stats = [128, 128, 128];
    this.speed = Drone.top_speed(this);
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
  this.owner_id = owner_id;
}

Drone.top_speed = (self) => self.stats[0] / 12.8;

Drone.prototype = Object.create(Unit.prototype, {});

Drone.prototype.set_stats = function (stats) {
  this.stats = stats;
  this.speed = Drone.top_speed(this)
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

Drone.prototype.create = function(stats) {
  let d = new Drone(this.owner_id);
  d.set_stats(stats);
  d.position = add(this.position, [10, 10]);
  if (users) {
    users[this.owner_id].units[d.id] = d;
  }
}
