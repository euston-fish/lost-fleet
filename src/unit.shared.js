"use strict";

//// Unit ////

function Unit(arena, { id: id,
                owner_id: owner_id,
                pos: pos,
                stats: stats,
                health: health,
                activated: activated }) {
  this.arena = arena;
  this.id = (id !== undefined) ? id : arena.id_counter++;
  this.owner = arena.users[owner_id];
  this.owner.units[this.id] = this;
  arena.units[this.id] = this;
  this.pos = pos;
  this.dest = pos;
  this.stats = new Stats(stats);

  this.vel = [0, 0];
  this.hold = 0;
  this.health = health || 0;
  this.activated = activated || false;

  this.command = null;
  this.shape_id = this.calc_ship_id();
  this.rotation = scalar_angle(this.vel);

  this.events = {
    hold_full: () => {},
    out_of_range: () => {},
    no_target: () => {},
    done: () => {}
  };
}

Unit.prototype.calc_ship_id = function() {
  // FIXME I don't work on scalar values
  if (this.stats.misc.acceleration < 3) {
    return 1;
  } else {
    return 0;
  }
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
    stats: this.stats.serialize(),
    health: this.health,
    activated: this.activated
  };
}

Unit.prototype.receive = function(command, ...params) {
  Unit.handlers[command].call(this, ...params);
}

/// Properties ///
//
// These properties are based on the unit's stats

Unit.prototype.radius = function () {
  return mix(this.stats.misc.defence, 8, 15);
}

Unit.prototype.health_color = function() {
  if (!this.health) return '';
  return 'hsl(' + mix(this.health / this.stats.cost, 0, 140)+ ',80%,50%)';
}

/// Tick handling ///

Unit.prototype.tick = function() {
  //this.current_acceleration = this.acceleration();
  //this.vel = add(this.vel, this.current_acceleration);
  if (!this.activated) return;
  if (this.command) Unit.tick_handlers[this.command.type].call(this, this.command);
  if (leng(this.vel) > 0.01) this.rotation = scalar_angle(this.vel);
  this.pos = add(this.pos, this.vel);
}

Unit.tick_handlers = {}

let attack = (attacker, defender) => {
  if (leng(sub(attacker.pos, defender.pos)) < attacker.stats.attack.range) {
    let attack_amount = min(attacker.stats.attack.power * defender.stats.misc.defence, defender.health);
    console.log(attack_amount, defender.health);
    defender.health -= attack_amount;
    attacker.hold += attack_amount * attacker.stats.attack.efficiency;
    attacker.hold = min(attacker.hold, attacker.stats.misc.capacity);

    if (defender.health === 0) {
      defender.destroy();
      attacker.events.done();
    } else if (attacker.hold === attacker.stats.misc.capacity) {
      attacker.events.fold_full();
    }
    return attack_amount;
  } else {
    attacker.events.out_of_range();
  }
  return null
}

Unit.tick_handlers.attack = function({ target_id: target_id }) {
  let target = this.arena.units[target_id];
  if (!target) return this.events.no_target();
  this.laser = attack(this, target);
}

let mine = (miner, asteroid) => {
  if (leng(sub(miner.pos, asteroid.pos)) < miner.stats.mine.range) {
    let mine_amount = min(miner.stats.mine.power,
                          asteroid.stats,
                          (miner.stats.misc.capacity - miner.hold) / miner.stats.mine.efficiency);
    asteroid.stats -= mine_amount;
    miner.hold += mine_amount * miner.stats.mine.efficiency;

    if (asteroid.stats === 0) {
      asteroid.destroy();
      miner.events.done();
    } else if (miner.hold === miner.stats.capacity) {
      miner.events.hold_full();
    }
    return mine_amount;
  } else {
    miner.events.out_of_range();
  }
  return null;
};

Unit.tick_handlers.mine = function({ target_id: target_id }) {
  let target = this.arena.asteroid_field.asteroid(...target_id);
  if (!target) return this.events.no_target();
  this.laser = mine(this, target);
}

let construct = (ctor, ctee) => {
  if (leng(sub(ctor.pos, ctee.pos)) < ctor.stats.construct.range) {
    // The max amount that could be transferred from the ctor
    let beam_amount = min(ctor.stats.construct.power, ctor.hold)*ctor.stats.construct.efficiency;
    // The max amount that could be received by the ctee
    let health_remaining = ctee.stats.cost - ctee.health;
    // The actual amount that will be received
    let health_added = min(beam_amount, health_remaining);
    ctee.health += health_added;
    ctor.hold -= health_added/ctor.stats.construct.efficiency;

    if (ctee.health === ctee.stats.cost) ctee.activated = true;
    if (health_remaining == 0) ctor.events.done();
    return health_added;
  } else {
    ctor.events.out_of_range();
  }
  return null;
};

Unit.tick_handlers.construct = function({ target_id: target_id }) {
  let target = this.arena.units[target_id];
  if (!target) return this.events.no_target();
  this.laser = construct(this, target);
}

Unit.tick_handlers.move = function({ dest: dest }) {
  this.current_acceleration = this.acceleration(dest);
  this.vel = add(this.vel, this.current_acceleration);
  if (this.vel == '0,0') {
    this.events.done();
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
  return acceleration(this.pos, dest, this.vel, this.stats.misc.acceleration);
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
