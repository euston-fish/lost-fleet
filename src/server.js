"use strict";

(function() {

  // Kinda from this: https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
  let random_color = () => 'hsl(' + ((Math.random() + 0.618033988749895) * 360) % 360 + ',50%,50%)';

  let clients = {};
  let commands = [];
  let arena;
  let waiting = [];

  module.exports = function(socket) {
    // Create client
    let client = { socket: socket, command_handler: () => {} };
    clients[client.socket.id] = client;

    // Add client to waiting list
    waiting.push(client);

    // If there are enough people waiting, start a game
    if (waiting.length >= 2) {
      console.log('starting game...'); 
      
      let arena = new Arena({
        users: waiting.map((client, i) => {
          let pos = [normal(Math.random(), Math.random()) * 5000, normal(Math.random(), Math.random()) * 5000];
          client.id = i;
          return {
            id: client.id,
            color: random_color(),
            units: [
              { position: pos, velocity: [0, 0], stats: [2550, 2550, 2550] }
            ]
          }
        }),
        id_counter: 0
      });

      let commands = [];

      waiting.forEach((client) => {
        client.command_handler = ([destination, ...params]) => {
          console.log('received command', destination, ...params);
          if (arena.users[client.id].units[destination] !== undefined) {
            console.log('desination recognised');
            commands.push(['command_unit', destination, ...params]);
          }
        };
        client.socket.emit('connected', arena.serialize(), client.id);
      });

      waiting = [];


      setInterval(() => {
        let tick_commands = commands;
        commands = [];
        for(let command of tick_commands) {
          console.log('executing command', command);
          arena.receive(command);
        }
        arena.tick();
        for(client of clients.values()) {
          client.socket.emit('tick', tick_commands);
        }
      }, 100);
    }
    
    socket.on('disconnect', () => {
      console.log('Disconnected: ' + client.id);
      //TODO: handle disconnection better
    });

    socket.on('command', (...args) => client.command_handler(...args));

    console.log("Connected: " + client);
  }
})();
