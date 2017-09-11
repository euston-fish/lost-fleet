"use strict";

//// Unit ////

function Unit(arena, { id: id,
                owner_id: owner_id,
                pos: pos,
                stats: stats,
                health: health }) {
  this.arena = arena;
  this.id = (id !== undefined) ? id : arena.id_counter++;
  this.owner = arena.users[owner_id];
  this.owner.units[this.id] = this;
  arena.units[this.id] = this;
  this.pos = pos;
  this.dest = pos;
  this.stats = stats;

  this.vel = [0, 0];
  this.hold = [0, 0];
  this.health = health || [0, 0];
  this.activated = false;

  this.command = null;
  this.shape_id = 1;
  this.rotation = scalar_angle(this.vel);

  this.events = {
    hold_full: new Event(),
    out_of_range: new Event(),
    no_target: new Event(),
    done: new Event()
  };
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
    pos: this.pos,
    stats: this.stats,
    health: this.health
  };
}

Unit.prototype.receive = function(command, ...params) {
  Unit.handlers[command].call(this, ...params);
}

/// Properties ///
//
// These properties are based on the unit's stats

Unit.prototype.radius = function () {
  // TODO: make less powerful units smaller?
  // (currently it's just the unit's health that determines size)
  return mix(leng(this.health)/leng(this.stats.cost), 8, 15);
}

/// Tick handling ///

Unit.prototype.tick = function() {
  //this.current_acceleration = this.acceleration();
  //this.vel = add(this.vel, this.current_acceleration);
  if(this.command) Unit.tick_handlers[this.command.type].call(this, this.command);
  if(leng(this.vel) > 0.01) this.rotation = scalar_angle(this.vel);
  this.pos = add(this.pos, this.vel);
}

Unit.tick_handlers = {}

Unit.tick_handlers.attack = function({ target_id: target_id }) {
  let target = this.arena.units[target_id];
  if (!target) {
    this.events.no_target.call();
    return;
  }
  if (leng(sub(this.pos, target.pos)) < this.stats.Attack.Rn) {
    this.laser = this.receive_attack_resources(target.take_damage(this.stats.Attack.Pw));
  } else {
    this.events.out_of_range.call();
    this.laser = null;
  }
}

Unit.tick_handlers.mine = function({ target_id: target_id }) {
  let target = this.arena.asteroid_field.asteroid(...target_id);
  if (!target) {
    this.events.no_target.call();
    return;
  }
  if (leng(sub(this.pos, target.pos)) < this.stats.Mine.Rn) {
    this.laser = this.receive_mine_resources(target.take_damage(this.stats.Mine.Pw));
  } else {
    this.events.out_of_range.call();
    this.laser = null;
  }
}

Unit.tick_handlers.move = function({ dest: dest }) {
  this.vel = add(this.vel, this.acceleration(dest));
  if (this.vel == '0,0') {
    this.events.done.call();
  }
}

/// Commands ///
//
// These are commands that the unit can receive

Unit.handlers = {};

Unit.handlers.set_command = function(command) {
  this.command = command;
}

/*Unit.handlers.set_destination = function(dest) {
  this.dest = dest;
}*/

/// Helpers ///

Unit.prototype.acceleration = function(dest) {
  return acceleration(this.pos, dest, this.vel, this.stats.Misc.Ac);
  /*
  let max_accel = this.stats.Misc.Ac;
  if(this.dest) {
    let target = this.dest;
    let dir_vec = add(target, inv(this.pos));
    let target_vel = scale(norm(dir_vec), max_accel * (Math.sqrt(1+8*leng(dir_vec)/max_accel)-1)/2);
    if(Math.abs(dir_vec[0]) < EPSILON && Math.abs(dir_vec[1]) < EPSILON && leng(this.vel) < max_accel) {
      target_vel = [0, 0];
    }
    
    let d_accel = add(target_vel, inv(this.vel));
    return scale(norm(d_accel), Math.min(max_accel, leng(d_accel)));
  } else {
    // Accelerate so that velocity becomes zero
    return scale(norm(inv(this.vel)), Math.min(max_accel, leng(this.vel)));
  }
  */
}

Unit.prototype.take_damage = function(attack_stats) {
  let damage = zip(dot(attack_stats, this.stats.Misc.De.map((d) => 1-d)), this.health).map(([d, v]) => min(d, v));
  this.health = zip(this.health, damage).map(([s, d]) => s-d);
  if(this.health == '0,0') this.destroy();
  return damage;
}

Unit.prototype.receive_attack_resources = function(resources) {
  this.hold = zip(this.hold, dot(resources, this.stats.Attack.Ef), this.stats.Misc.Cp).map(([h, r, c]) => min(h+r, c))
  if (this.hold + '' === this.stats.Misc.Cp + '') this.events.hold_full.call();
  return dot(resources, this.stats.Attack.Ef);
}

Unit.prototype.receive_mine_resources = function(resources) {
  this.hold = zip(this.hold, dot(resources, this.stats.Mine.Ef), this.stats.Misc.Cp).map(([h, r, c]) => min(h+r, c))
  if (this.hold + '' === this.stats.Misc.Cp + '') this.events.hold_full.call();
  return dot(resources, this.stats.Mine.Ef);
}
