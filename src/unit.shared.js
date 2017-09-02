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
  this.owner.units[this.id] = this;
  arena.units[this.id] = this;
  this.stats = stats || [128, 128, 128];
  this.waypoints = waypoints || [];
  this.velocity = velocity || [0, 0];
  this.rotation = scalar_angle(this.velocity);
}

Unit.prototype.destroy = function() {
  delete this.arena.units[this.id];
  delete this.arena.users[this.owner.id].units[this.id];
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
  this[command](...params);
}

Unit.prototype.tick = function() {
  this.velocity = add(this.velocity, this.acceleration());
  this.position = add(this.position, this.velocity);
  if(leng(this.velocity) > 1) this.rotation = scalar_angle(this.velocity);
  this.attack_target();
}

/// Properties ///
//
// These properties are based on the unit's stats

Unit.prototype.color = function() {
  return 'rgb(' + this.stats.map(Math.floor) + ')';
}

Unit.prototype.radius = function () {
  return mix((this.stats[0] + this.stats[1] + this.stats[2]) / 7650, 5, 17);
}

Unit.prototype.max_acceleration = function() {
  return this.stats[0] / 500.0;
}

Unit.prototype.weapon_range = function() {
  return 200; //Math.max(Math.abs(this.stats[0] - this.stats[1]), 20);
}

Unit.prototype.weapon_damage = function() {
  return this.stats[2] / 110;
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

Unit.prototype.get_target = function() {
  if (this.target_type == 'unit') {
    return this.arena.units[this.target_id];
  } else if (this.target_type == 'asteroid' && this.target_id) {
    return this.arena.asteroid_field.asteroid(...this.target_id);
  }
}

Unit.prototype.set_target = function (id, type) {
  this.target_id = id;
  this.target_type = type;
}

Unit.prototype.attack_target = function () {
  if (!this.target_id) return;
  let other = this.get_target();
  if (!other) {
    this.target_id = null;
  } else if (leng(add(this.position, inv(other.position))) < this.weapon_range()) {
    this.owner.mine_resource(other.stats, this.mine_efficiency())
    other.decrease_stats(this.weapon_damage());
  }
}

/// Helpers ///

Unit.prototype.set_parent = function(parent_id) {
  this.parent = this.arena.units[parent_id];
}

Unit.prototype.decrease_stats = function(amount) {
  [0,1,2].forEach((i) => this.stats[i] = clamp(this.stats[i] - amount));
  // FUCK YES THIS IS THE BEST JAVASCRIPT IS MY FAVORITE LANGUAGE EVA!!!!1111!!!
  if (this.stats == '0,0,0') this.destroy();
}

Unit.prototype.acceleration = function() {
  if(this.waypoints.length !== 0 || (this.get_target() && leng(sub(this.get_target().position, this.position)) > this.weapon_range())) {
    let target = this.waypoints.length !== 0 ? this.waypoints[0] :
      add(this.get_target().position, scale(norm(sub(this.position, this.get_target().position)), this.weapon_range() - 5));
    let dir_vec = add(target, inv(this.position));
    let target_vel = scale(norm(dir_vec), this.max_acceleration() * (Math.sqrt(1+8*leng(dir_vec)/this.max_acceleration())-1)/2);
    if(Math.abs(dir_vec[0]) < EPSILON && Math.abs(dir_vec[1]) < EPSILON && leng(this.velocity) < this.max_acceleration()) {
      this.waypoints.shift();
      target_vel = [0, 0];
    }
    
    let d_accel = add(target_vel, inv(this.velocity));
    return scale(norm(d_accel), Math.min(this.max_acceleration(), leng(d_accel)));
  } else {
    // Accelerate so that velocity becomes zero
    return scale(norm(inv(this.velocity)), Math.min(this.max_acceleration(), leng(this.velocity)));
  }
}
