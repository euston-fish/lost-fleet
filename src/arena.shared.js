function Arena({ users: users, id_counter: id_counter }) {
  this.users = {};
  this.units = {};
  this.id_counter = id_counter;
  this.asteroid_field = new AsteroidField(93454853);

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
//Arena.handlers.introduce_user = function(user) {
  //console.log('introduce user', user);
  //new User(this, user);
//}

Arena.handlers.command_unit = function(id, ...params) {
  if(this.units[id]) this.units[id].receive(...params);
}

Arena.handlers.make_baby = function(owner_id, pos, stats) {
  let u = new Unit(this, { owner_id: owner_id, pos: pos, stats: stats });
  console.log(u, u.stats);
}

Arena.handlers.remove_user = function(user_id) {
  console.log(this);
  for (let unit of Object.values(this.users[user_id].units)) {
    unit.destroy(true);
  }
  delete this.users[user_id];
}
