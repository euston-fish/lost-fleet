"use strict";

let user_colors = [
  'blue',
  'red',
  'green',
  'grey',
  'purple'
];

let sockets = {};

let commands = [];

let arena;

module.exports = function(socket) {
  if(!arena) {
    arena = new Arena({ users: [], units: [], id_counter: 0 });

    setInterval(() => {
      let tick_commands = commands;
      commands = [];
      for(let command of tick_commands) {
        console.log('executing command', command);
        arena.receive(command);
      }
      //for (var [destination, ...params] of tick_commands) {
        //console.log(destination, ...params);
        //state.units[destination].receive(...params);
      //}
      arena.tick();
      for(socket of Object.values(sockets)) {
        socket.emit('tick', tick_commands);
      }
    }, 100);
  }

  let socket_id = socket.id

  sockets[socket_id] = socket;
  //new Drone({ owner_id: user.id, position: [50, 50] });
  //new Drone({ owner_id: user.id, position: [60, 60] });
  //new Drone({ owner_id: user.id, position: [40, 60] });
  
  let color = user_colors.splice(Math.floor(Math.random() * user_colors.length), 1);
  commands.push(['introduce_user', { id: socket_id, color: color, units: [{ position: [50, 50] }, { position: [60, 60] }, { position: [40, 60] }]}]);
  
  socket.on('disconnect', () => {
    console.log('Disconnected: ' + socket_id);
    commands.push(['remove_user', socket_id]);
  });

  socket.on('command', ([destination, ...params]) => {
    console.log('received command', destination, ...params);
    if (arena.users[socket_id].units[destination] !== undefined) {
      console.log('desination recognised');
      commands.push(['command_unit', destination, ...params]);
    }
  });

  console.log("Connected: " + socket_id);
  //socket.emit('connected', state);
  console.log(arena);
  socket.emit('connected', arena.serialize(), socket_id);
}
