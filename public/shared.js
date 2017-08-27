"use strict";

function Arena({ users: users, units: drones, id_counter: id_counter }) {
  this.units = {};
  this.users = {};
  this.id_counter = id_counter;

  for (var user of users) new User(this, user);
  for(var drone of drones) new Drone(this, drone);

  console.log('drones:', drones);

  console.log('created a new arena', this);
}

Arena.prototype.serialize = function() {
  return {
    users: Object.values(this.users),
    units: Object.values(this.units),
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
Arena.handlers.introduce_user = function(user, drones) {
  console.log('introduce user', user, drones);
  user = new User(this, user);
  for (var drone of drones) {
    // all of these drones should belong to `user`
    drone.owner_id = user.id;
    new Drone(this, drone);
  }
}

Arena.handlers.command_unit = function(id, ...params) {
  if(this.units[id]) this.units[id].receive(...params);
}

Arena.handlers.remove_user = function(user_id) {
  console.log(this);
  for (let unit_id of Object.values(this.users[user_id].unit_ids)) {
    delete this.units[unit_id];
  }
  delete this.users[user_id];
  // TODO: maybe handle this better
}

function User(arena, { id: id }) {
  this.id = id || arena.id_counter++;
  arena.users[this.id] = this;
  this.unit_ids = {};
  console.log('created a new user', this);
}

User.become = function(user) {
  Object.setPrototypeOf(user, User.prototype);
  Object.setPrototypeOf(user.unit_ids, Set.prototype);
}

// `owner_id` and `position` are required. `id` can be generated if it's not given
function Unit(arena, { id: id,
                owner_id: owner_id,
                position: position }) {
  this.owner_id = owner_id;
  console.log('creating a unit, passed id is', id);
  if(id === undefined) this.id = arena.id_counter++;
  else this.id = id;
  arena.units[this.id] = this;
  console.log('so this.id is', this.id);
  arena.users[owner_id].unit_ids[this.id] = this.id;
  this.position = position;
}

Unit.become = function(unit) {
  Object.setPrototypeOf(unit, Drone.prototype); // TODO: this will need to be fixed when we add structures
}

Unit.prototype.draw = function(canvas) {
  //console.log('drawing unit', this);
  canvas.fillStyle = this.selected ? 'orange' : 'blue';
  let [x, y] = this.position;
  canvas.beginPath();
  canvas.arc(Math.round(x), Math.round(y), 5, 0, Math.PI * 2);
  canvas.fill();
  //canvas.fillRect(x, y, 10, 10);
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
    this.speed = 5;
}

Drone.prototype = Object.create(Unit.prototype, {});

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
  let d = new Drone({ owner_id: this.owner_id, position: add(this.position, [10, 10]), stats: stats});
}
