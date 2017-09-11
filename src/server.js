"use strict";

(function() {

  // Kinda from this: https://martin.ankerl.com/2009/12/09/how-to-create-random-colors-programmatically/
  let random_color = () => 'hsl(' + ((Math.random() + 0.618033988749895) * 360) % 360 + ',50%,50%)';

  let clients = {};
  let commands = [];
  let arena;
  let waiting = {};

  let start_game = (players) => {
    console.log('starting game...'); 

    let mothership_stats = new Stats({
      Attack: {
        Rn: [0.7, 0.7],
        Pw: [0.7, 0.7],
        Ef: [0.7, 0.7]
      },
      Mine: {
        Rn: [0.7, 0.7],
        Pw: [0.7, 0.7],
        Ef: [0.7, 0.7]
      },
      Construct: {
        Rn: [0.7, 0.7],
        Pw: [0.7, 0.7],
        Ef: [0.7, 0.7]
      },
      Misc: {
        Ac: [0.7, 0.7],
        De: [0.7, 0.7],
        Cp: [0.7, 0.7],
        Tr: [0.7, 0.7]
      }
    });
    console.log(mothership_stats);
    
    let arena = new Arena({
      users: players.map((client, i) => {
        let pos = [normal(Math.random(), Math.random()) * 5000, normal(Math.random(), Math.random()) * 5000];
        client.id = i;
        return {
          id: client.id,
          color: random_color(),
          username: client.username,
          units: [
            { pos: pos, vel: [0, 0], stats: mothership_stats, health: mothership_stats.cost, activated: true }
          ]
        }
      }),
      id_counter: 0
    });

    let commands = [];

    players.forEach((client) => {
      let command_unit = (unit_id, ...params) => {
        if (arena.users[client.id].units[unit_id] !== undefined) {
          commands.push(['command_unit', unit_id, ...params]);
        }
      };
      let make_baby = (pos, stats) => {
        commands.push(['make_baby', client.id, pos, stats]);
      }
      client.command_handler = (type, ...params) => {
        console.log('received command', type, ...params);
        if (type === 'command_unit') command_unit(...params);
        if (type === 'make_baby') make_baby(...params);
      };
      /*client.command_handler = ([destination, ...params]) => {
        console.log('received command', destination, ...params);
        if (arena.users[client.id].units[destination] !== undefined) {
          console.log('desination recognised');
          commands.push(['command_unit', destination, ...params]);
        }
      };*/
      client.socket.emit('create_arena', arena.serialize(), client.id);
    });

    setInterval(() => {
      let tick_commands = commands;
      commands = [];
      for (let command of tick_commands) {
        console.log('executing command', command);
        arena.receive(command);
      }
      arena.tick();
      for(client of players) {
        client.socket.emit('tick', tick_commands);
      }
    }, 100);
  }

  module.exports = function(socket) {
    // Create client
    let client = { socket: socket, command_handler: () => {}, current_game: null };
    clients[client.socket.id] = client;

    socket.on('create_game', (name, username) => {
      if (!waiting[name]) {
        waiting[name] = {};
      }
      if (client.current_game && waiting[client.current_game]) {
        waiting[client.current_game].values()
          .forEach((client) => client.socket.emit('user_left', client.socket.id));
        delete waiting[client.current_game][client.socket.id];
      }
      client.username = username;
      client.current_game = name;
      waiting[name].values().forEach((cl) => {
        cl.socket.emit('new_users', [[client.socket.id, username]]);
      })
      waiting[name][client.socket.id] = client;
      socket.emit('new_users', waiting[name].values().map((cl) => [cl.socket.id, cl.username]));
    })
    
    socket.on('start_game', () => {
      start_game(waiting[client.current_game].values());
      delete waiting[client.current_game];
    });

    socket.on('disconnect', () => {
      console.log('Disconnected: ', client.id);
      //TODO: handle disconnection better
    });

    socket.on('command', (...args) => client.command_handler(...args));
  }
})();
