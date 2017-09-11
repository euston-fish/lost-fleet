let el = (id) => document.getElementById(id);
window.addEventListener("load", function() {
  let socket = io({ upgrade: false, transports: ['websocket'] });

  let player_count = 0;
  let show_elem = (elem, show) => el(elem).style.display = show ? 'block' : 'none';

  show_elem('room', false);

  socket.on('new_users', (usernames) => {
    usernames.forEach(([id, username]) => {
      player_count++;
      show_elem('room', player_count > 0);
      show_elem('join', player_count < 1);
      console.log('User joined:', username);
      let li = document.createElement('li');
      li.innerText = username;
      li.id = 'user-' + id;
      el('players').appendChild(li);
    });
  });

  socket.on('user_left', (id) => {
    let user = el('user-' + id)
    if (user) {
      player_count--;
      show_elem('room', player_count > 0);
      show_elem('join', player_count < 1);
      user.remove()
    }
  })

  bind_game_stuff(socket);

  let username_field = el('username');
  let game_name_field = el('game_name');

  username_field.value = NAMES.sample();
  game_name_field.value = Math.floor(Math.random() * 1000000).toString(16).toUpperCase();

  el('join_game').onclick = () => {
    socket.emit('create_game', game_name_field.value, username_field.value)
    el('room_name').innerText = 'In room ' + game_name_field.value + ' as ' + username_field.value + '. Waiting for other players.';
    el('room').style.display = 'block';
    el('join').style.display = 'none';
  };

  el('start').onclick = () => {
    if (player_count <= 0) return;
    socket.emit('start_game');
  }
}, false);
