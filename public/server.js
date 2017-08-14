"use strict";

let users = [];
let sockets = {all: []};

/**
 * Socket.IO on connect event
 * @param {Socket} socket
 */
module.exports = (socket) => {
  let user = new User();
  users.push(user);
  sockets[socket.id] = socket;
  sockets.all.push(socket);
  
  socket.on('disconnect', () => {
    console.log('Disconnected: ' + socket.id);
    users.splice(user, 1);
    delete sockets[socket.id];
  });

  socket.on('bcast', (data) => sockets.all.forEach((other_socket) => {
    data.data.user = user;
    if (other_socket !== socket && sockets[other_socket.id]) {
      other_socket.emit(data.method, data.data);
    }
  }));

  console.log("Connected: " + socket.id);
  console.log(users.length)
  socket.emit('connected', user);
};
