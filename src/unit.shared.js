"use strict";

//// Unit ////

function Unit(arena, { id: id,
                owner_id: owner_id,
                position: position,
                stats: stats,
                target_id: target_id,
                waypoints: waypoints,
                velocity: velocity }) {
  this.arena = arena;
  this.id = (id !== undefined) ? id : arena.id_counter++;
  this.owner = arena.users[owner_id];
  this.position = position;
  this.target_id = target_id;
  this.owner.units[this.id] = this;
  arena.units[this.id] = this;
  this.stats = stats || [128, 128, 128];
  this.waypoints = waypoints || [];
  this.velocity = velocity || [0, 0];
}

Unit.prototype.destroy = function() {
  delete this.arena.units[this.id];
  delete this.arena.users[this.owner.id].units[this.id];
}

Unit.prototype.serialize = function() {
  return { id: this.id,
           owner_id: this.owner.id,
           position: this.position,
           stats: this.stats,
           waypoints: this.waypoints,
           velocity: this.velocity };
}

Unit.prototype.receive = function(command, ...params) {
  this[command](...params);
}

Unit.prototype.tick = function() {
  this.velocity = add(this.velocity, this.acceleration());
  this.position = add(this.position, this.velocity);
  this.attack_target();
}

/// Properties ///
//
// These properties are based on the unit's stats

Unit.prototype.color = function() {
  return 'rgb(' + this.stats + ')';
}

Unit.prototype.radius = function () {
  return mix((this.stats[0] + this.stats[1] + this.stats[2]) / 765, 4, 35);
}

Unit.prototype.max_acceleration = function() {
  return this.stats[0] / 30.0;
}

Unit.prototype.weapon_range = function() {
  return 200; //Math.max(Math.abs(this.stats[0] - this.stats[1]), 20);
}

Unit.prototype.weapon_damage = function() {
  return this.stats[2] / 11;
}

Unit.prototype.mine_efficiency = function() {
  return 0.9 * this.weapon_damage();
}

/// Commands ///
//
// These are commands that the unit can receive

Unit.prototype.add_waypoint = function(waypoint) {
  // Add a new waypoint
  this.target_id = null;
  this.waypoints.push(waypoint);
}

Unit.prototype.clear_waypoints = function() {
  // Clear the current queue of waypoints
  this.waypoints = [];
}

Unit.prototype.create = function(stats) {
  // Have a unit baby
  new Unit(this.arena, { owner_id: this.owner.id, position: add(this.position, [10, 10]), stats: stats});
}

Unit.prototype.set_target = function (target) {
  this.target_id = target;
}

Unit.prototype.attack_target = function () {
  // Attack another unit
  let other = this.arena.units[this.target_id];
  if (!other) {
    this.target_id = null;
  } else if (leng(add(this.position, inv(other.position))) < this.weapon_range()) {
    this.owner.mine_resource(other.stats, this.mine_efficiency())
    other.decrease_stats(this.weapon_damage());
  } else {
    this.clear_waypoints();
    this.add_waypoint(other.position);
    this.target_id = other.id;
  }
}

/// Helpers ///

Unit.prototype.in_region = function([tl_x, tl_y], [br_x, br_y]) {
  let [x, y] = this.position;
  return tl_x-this.radius() < x && x < br_x+this.radius() && tl_y-this.radius() < y && y < br_y+this.radius();
}

Unit.prototype.decrease_stats = function(amount) {
  [0,1,2].forEach((i) => this.stats[i] = clamp(this.stats[i] - amount));
  // FUCK YES THIS IS THE BEST JAVASCRIPT IS MY FAVORITE LANGUAGE EVA!!!!1111!!!
  if (this.stats == '0,0,0') this.destroy();
}

Unit.prototype.acceleration = function() {
  if(this.waypoints.length !== 0) {
    let target = this.waypoints[0];
    let dir_vec = add(target, inv(this.position));
    let target_vel = scale(norm(dir_vec), this.max_acceleration() * (Math.sqrt(1+8*leng(dir_vec)/this.max_acceleration())-1)/2);
    if(Math.abs(dir_vec[0]) < EPSILON && Math.abs(dir_vec[1]) < EPSILON && leng(this.velocity) < this.max_acceleration()) {
      this.waypoints.shift();
      target_vel = [0, 0];
    }
    
    let d_accel = add(target_vel, inv(this.velocity));
    return scale(norm(d_accel), Math.min(this.max_acceleration(), leng(d_accel)));
  }
  return [0, 0]
}
