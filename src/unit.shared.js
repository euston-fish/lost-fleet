"use strict";

//// Unit ////

function Unit(arena, { id: id,
                owner_id: owner_id,
                position: position,
                stats: stats,
                target_id: target_id,
                target_type: target_type,
                waypoints: waypoints,
                velocity: velocity }) {
  this.arena = arena;
  this.id = (id !== undefined) ? id : arena.id_counter++;
  this.owner = arena.users[owner_id];
  this.position = position;
  this.target_type = target_type;
  this.target_id = target_id;
  this.shape_id = 1;
  this.owner.units[this.id] = this;
  arena.units[this.id] = this;
  this.stats = stats || [128, 128, 128];
  this.hold = [0, 0, 0];
  this.waypoints = waypoints || [];
  this.velocity = velocity || [0, 0];
  this.command = null;
  this.rotation = scalar_angle(this.velocity);
}

Unit.prototype.destroy = function() {
  delete this.arena.units[this.id];
  delete this.arena.users[this.owner.id].units[this.id];
  this.destroyed = true;
}

Unit.prototype.serialize = function() {
  return {
    id: this.id,
    owner_id: this.owner.id,
    position: this.position,
    stats: this.stats,
    waypoints: this.waypoints,
    velocity: this.velocity
  };
}

Unit.prototype.receive = function(command, ...params) {
  Unit.handlers[command].call(this, ...params);
}

/// Properties ///
//
// These properties are based on the unit's stats

Unit.prototype.radius = function () {
  return mix((this.stats[0] + this.stats[1] + this.stats[2]) / 7650, 10, 24);
}

Unit.prototype.max_acceleration = function() {
  return (this.stats[0] + 1) / 500.0;
}

Unit.prototype.weapon_range = function() {
  return this.stats[1] / 3;
}

Unit.prototype.attack_stats = function() {
  return [30, 30, 30];
}

Unit.prototype.attack_efficiency = function() {
  return [0.1, 0.1, 0.1];
}

Unit.prototype.defence = function() {
  return [0.9, 0.9, 0.9];
}

Unit.prototype.hold_capacity = function() {
  return [100, 100, 100];
}

Unit.prototype.mine_range = function() {
  return 200;
}

Unit.prototype.mine_stats = function() {
  return [30, 30, 30];
}

Unit.prototype.mine_efficiency = function() {
  return [0.5, 0.5, 0.5];
}

/// Tick handling ///

Unit.prototype.tick = function() {
  this.current_acceleration = this.acceleration();
  this.velocity = add(this.velocity, this.current_acceleration);
  this.position = add(this.position, this.velocity);
  if(leng(this.velocity) > 0.01) this.rotation = scalar_angle(this.velocity);
  //this.attack_target();
  if(this.command) Unit.tick_handlers[this.command.type].call(this, this.command);
}

Unit.tick_handlers = {}

Unit.tick_handlers.attack = function({ target_id: target_id }) {
  let target = this.arena.units[target_id];
  if (!target) return;
  if (leng(sub(this.position, target.position)) < this.attack_range()) {
    this.laser = this.receive_attack_resources(target.take_damage(this.attack_stats()));
  } else {
    this.laser = null;
  }
}

Unit.tick_handlers.mine = function({ target_id: target_id }) {
  let target = this.arena.asteroid_field.asteroid(...target_id);
  if (!target) return;
  if (leng(sub(this.position, target.position)) < this.mine_range()) {
    this.laser = this.receive_mine_resources(target.take_damage(this.mine_stats()));
  } else {
    this.laser = null;
  }
}

/// Commands ///
//
// These are commands that the unit can receive

Unit.handlers = {};

Unit.handlers.set_command = function(command) {
  this.command = command;
}

Unit.handlers.set_destination = function(destination) {
  this.destination = destination;
}

/// Helpers ///

Unit.prototype.set_parent = function(parent_id) {
  this.parent = this.arena.units[parent_id];
}

Unit.prototype.acceleration = function() {
  if(this.destination) {
    let target = this.destination;
    let dir_vec = add(target, inv(this.position));
    let target_vel = scale(norm(dir_vec), this.max_acceleration() * (Math.sqrt(1+8*leng(dir_vec)/this.max_acceleration())-1)/2);
    if(Math.abs(dir_vec[0]) < EPSILON && Math.abs(dir_vec[1]) < EPSILON && leng(this.velocity) < this.max_acceleration()) {
      this.destination = null;
      target_vel = [0, 0];
    }
    
    let d_accel = add(target_vel, inv(this.velocity));
    return scale(norm(d_accel), Math.min(this.max_acceleration(), leng(d_accel)));
  } else {
    // Accelerate so that velocity becomes zero
    return scale(norm(inv(this.velocity)), Math.min(this.max_acceleration(), leng(this.velocity)));
  }
}

Unit.prototype.take_damage = function(attack_stats) {
  let damage = zip(dot(attack_stats, this.defence()), this.stats).map(([d, v]) => min(d, v));
  this.stats = zip(this.stats, damage).map(([s, d]) => s-d);
  if(this.stats == '0,0,0') this.destroy();
  return damage;
}

Unit.prototype.receive_attack_resources = function(resources) {
  this.hold = zip(this.hold, dot(resources, this.attack_efficiency()), this.hold_capacity()).map(([h, r, c]) => min(h+r, c))
  return dot(resources, this.attack_efficiency());
}

Unit.prototype.receive_mine_resources = function(resources) {
  this.hold = zip(this.hold, dot(resources, this.mine_efficiency()), this.hold_capacity()).map(([h, r, c]) => min(h+r, c))
  return dot(resources, this.mine_efficiency());
}
