function User(arena, { id: id, units: units, resources: resources, color: color }) {
  this.id = (id !== undefined) ? id : arena.id_counter++;
  arena.users[this.id] = this;
  this.units = {};
  this.resources = resources || [2550, 2550, 2550];
  for(let unit of (units || [])) new Unit(arena, Object.assign({ owner_id: this.id }, unit));
  this.color = color;
}

User.prototype.serialize = function() {
  return {
    id: this.id,
    color: this.color,
    units: Object.values(this.units).map((unit) => unit.serialize())
  };
}

User.prototype.mine_resource = function(resource, efficiency) {
  [0,1,2].forEach((i) => this.resources[i] += (resource[i] - efficiency < 0 ? resource[i] : efficiency));
}

User.prototype.subtracted_resources = function(costs) {
  return this.resources.map((val, idx) => val - costs[idx]);
}

User.prototype.centroid = function() {
  let sum = [0, 0];
  this.units.values().forEach((unit) => {
    sum = add(sum, unit.pos);
  });
  return scale(sum, 1/this.units.values().length);
}
