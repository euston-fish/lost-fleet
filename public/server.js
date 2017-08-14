"use strict";

/**
 * User session class
 * @param {Socket} socket
 */
function User(socket) {
  this.socket = socket;
}

/**
 * Terminate game
 */
User.prototype.end = () => {
};

let users = [];

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = (socket) => {
  let user = new User(socket);
  users.push(user);
  
  socket.on('disconnect', () => {
    console.log('Disconnected: ' + socket.id);
    users.splice(users.indexOf(user), 1);
  });

  socket.on('bcast', (data) => users.forEach((user) =>
    user.socket !== socket && user.socket.emit(data.method, data.data)));

  console.log("Connected: " + socket.id);
};
