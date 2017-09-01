"use strict";

(function() {

  // Kinda from this: https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
  let random_color = () => 'hsl(' + ((Math.random() + 0.618033988749895) * 360) % 360 + ',50%,50%)';

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
        arena.tick();
        for(socket of sockets.values()) {
          socket.emit('tick', tick_commands);
        }
      }, 100);
    }

    let socket_id = socket.id;
    sockets[socket_id] = socket;

    let x = normal(Math.random(), Math.random()) * 5000,
        y = normal(Math.random(), Math.random()) * 5000;
    
    let color = random_color();
    commands.push(['introduce_user', {
      id: socket_id,
      color: color,
      units: [{ position: [x, y], stats: [2550, 2550, 2550] }]
    }]);
    
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
})();
