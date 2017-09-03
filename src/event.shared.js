function Event(...args) {
  this.handlers = [];
  this.args = args;
}

Event.prototype.call = function(...args) {
  this.handlers.forEach((handler) => handler(...args, ...this.args));
}

Event.prototype.register = function(f) {
  this.handlers = [f];
}
