"use strict";

let users = [];
let commands = [];

function User(socket) {
  this.socket = socket;
  this.units = {};
  let mothership = new Drone();
  this.units[mothership.id] = mothership;
}

module.exports = (socket) => {
  let user = new User();
  users.push(user);
  
  socket.on('disconnect', () => {
    console.log('Disconnected: ' + socket.id);
    users.splice(user, 1);
    delete sockets[socket.id];
  });

  socket.on('command', ([destination, ...params]) => {
    console.log('received command', destination, ...params);
    if(user.units[destination] !== undefined) {
      console.log('desination recognised');
      commands.push([destination, ...params]);
    }
  });

  console.log("Connected: " + socket.id);
  console.log(users.length)
  socket.emit('connected', Object.values(user.units)[0]);

  setInterval(() => {
    let tick_commands = commands;
    commands = [];
    for (var [destination, ...params] of tick_commands) {
      console.log(destination, ...params);
      units[destination].receive(...params);
    }
    for (var unit of Object.values(units)) {
      unit.tick();
    }
    socket.emit('tick', tick_commands);
  }, 100)
};
