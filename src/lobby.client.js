window.addEventListener("load", function() {
  let socket = io({ upgrade: false, transports: ["websocket"] });
  el('join').style.display = 'none';
  el('game').style.display = 'block';
  start_game(socket);
}, false);
