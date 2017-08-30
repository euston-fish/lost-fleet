function User(arena, { id: id, units: units, color: color }) {
  this.id = (id !== undefined) ? id : arena.id_counter++;
  arena.users[this.id] = this;
  this.units = {};
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
