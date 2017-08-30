function User(arena, { id: id, units: units, resources: resources, color: color }) {
  this.id = (id !== undefined) ? id : arena.id_counter++;
  arena.users[this.id] = this;
  this.units = {};
  this.resources = resources || [255, 255, 255];
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

User.prototype.subtracted_resources = function(r, g, b) {
  return [
    clamp(this.resources[0] - r),
    clamp(this.resources[1] - g),
    clamp(this.resources[2] - b)
  ];
}
