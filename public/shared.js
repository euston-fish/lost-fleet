"use strict";

function Arena({ users: users, id_counter: id_counter }) {
  this.users = {};
  this.units = {};
  this.id_counter = id_counter;

  for (var user of users) new User(this, user);
}

Arena.prototype.serialize = function() {
  return {
    users: Object.values(this.users).map((unit) => unit.serialize()),
    id_counter: this.id_counter
  }
}

Arena.prototype.tick = function() {
  for (var unit of Object.values(this.units)) {
    unit.tick();
  }
}

Arena.prototype.receive = function([command, ...params]) {
  console.log('arena receive', command, ...params);
  Arena.handlers[command].call(this, ...params);
}

Arena.handlers = {}
Arena.handlers.introduce_user = function(user) {
  console.log('introduce user', user);
  user = new User(this, user);
}

Arena.handlers.command_unit = function(id, ...params) {
  if(this.units[id]) this.units[id].receive(...params);
}

Arena.handlers.remove_user = function(user_id) {
  console.log(this);
  for (let unit_id of Object.keys(this.users[user_id].units)) {
    delete this.units[unit_id];
  }
  delete this.users[user_id];
  // TODO: maybe handle this better
}

function User(arena, { id: id, units: units }) {
  this.id = (id !== undefined) ? id : arena.id_counter++;
  arena.users[this.id] = this;
  this.units = {};
  for(let unit of (units || [])) new Drone(arena, Object.assign({ owner_id: this.id }, unit));
}

User.prototype.serialize = function() {
  return { id: this.id,
           units: Object.values(this.units).map((unit) => unit.serialize()) };
}

// `owner_id` and `position` are required. `id` can be generated if it's not given
function Unit(arena, { id: id,
                owner_id: owner_id,
                position: position }) {
  this.arena = arena;
  this.id = (id !== undefined) ? id : arena.id_counter++;
  this.owner = arena.users[owner_id];
  this.position = position;
  this.owner.units[this.id] = this;
  arena.units[this.id] = this;
}

Unit.prototype.serialize = function() {
  return { id: this.id,
           owner_id: this.owner.id,
           position: this.position };
}

Unit.prototype.draw = function(canvas) {
  let [x, y] = this.position;
  canvas.fillStyle = this.selected ? 'orange' : this.color();
  canvas.beginPath();
  canvas.arc(Math.round(x), Math.round(y), 5, 0, Math.PI * 2);
  canvas.fill();
}

Unit.prototype.color = function() {
  return 'rgb(' + this.stats + ')';
}

Unit.prototype.in_region = function([tl_x, tl_y], [br_x, br_y]) {
  let [x, y] = this.position;
  return tl_x-5 < x && x < br_x+5 && tl_y-5 < y && y < br_y+5;
}

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

function Drone(arena, { stats: stats, target: target, ...rest }) {
    Unit.call(this, arena, rest);
    this.stats = stats || [128, 128, 128];
    this.target = target || null;
    this.speed = Drone.top_speed(this);
}

Drone.top_speed = (self) => self.stats[0] / 12.8;

Drone.prototype = Object.create(Unit.prototype, {});

Drone.prototype.serialize = function() {
  return Object.assign({
    stats: this.stats,
    target: this.target,
    speed: this.speed
  }, Unit.prototype.serialize.call(this));
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
  let d = new Drone(this.arena, { owner_id: this.owner.id, position: add(this.position, [10, 10]), stats: stats});
}
