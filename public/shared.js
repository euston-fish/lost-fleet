"use strict";

let EPSILON = 1;

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

function User(arena, { id: id, units: units, color: color }) {
  this.id = (id !== undefined) ? id : arena.id_counter++;
  arena.users[this.id] = this;
  this.units = {};
  this.color = color;
  for(let unit of (units || [])) new Drone(arena, Object.assign({ owner_id: this.id }, unit));
}

User.prototype.serialize = function() {
  return {
    id: this.id,
    color: this.color,
    units: Object.values(this.units).map((unit) => unit.serialize())
  };
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

function Drone(arena, { stats: stats, waypoints: waypoints, velocity: velocity, ...rest }) {
    Unit.call(this, arena, rest);
    this.stats = stats || [128, 128, 128];
    this.waypoints = waypoints || [];
    this.velocity = velocity || [0, 0];
}

Drone.prototype = Object.create(Unit.prototype, {});

Drone.prototype.max_acceleration = function() {
  return this.stats[0] / 30.0;
}

Drone.prototype.serialize = function() {
  return Object.assign({
    stats: this.stats,
    waypoints: this.waypoints,
    velocity: this.velocity
  }, Unit.prototype.serialize.call(this));
}

Drone.prototype.receive = function(command, ...params) {
  console.log('received', command, ...params);
  this[command](...params);
}

Drone.prototype.add_waypoint = function(waypoint) {
  this.waypoints.push(waypoint);
}

Drone.prototype.clear_waypoints = function() {
  this.waypoints = [];
}

Drone.prototype.tick = function() {
  if(this.waypoints.length !== 0) {
    let target = this.waypoints[0];
    let dir_vec = add(target, inv(this.position));
    let target_vel = scale(norm(dir_vec), (Math.sqrt(1+8*leng(dir_vec))-1)/2);
    if(Math.abs(dir_vec[0]) < EPSILON && Math.abs(dir_vec[1]) < EPSILON) {
      this.waypoints.shift();
      target_vel = [0, 0];
    }
    
    let d_accel = add(target_vel, inv(this.velocity));
    let acceleration = scale(norm(d_accel), Math.min(this.max_acceleration(), leng(d_accel)));
    this.velocity = add(this.velocity, acceleration);
  }
  this.position = add(this.position, this.velocity);
}

Drone.prototype.create = function(stats) {
  let d = new Drone(this.arena, { owner_id: this.owner.id, position: add(this.position, [10, 10]), stats: stats});
}
