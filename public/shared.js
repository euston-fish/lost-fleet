"use strict";

const colors = [
  'red',
  'green',
  'blue',
  '#2b2b2b',
  'yellow',
  'cyan'
]

function User() {
  let color = colors.splice(Math.random() * colors.length, 1)[0];
  this.color = color;
}

/**
 * Terminate game
 */
User.prototype.end = () => {
};
