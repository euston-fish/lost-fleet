let
  socket,
  canvas,
  elem;

/**
 * Binde Socket.IO and button events
 */
bind = () => {
  socket.bcast = (method, data) => socket.emit('bcast', {method: method, data: data});
  socket.on("start", () => {
    console.log('started');
  });

  elem.onclick = (event) => {
    socket.bcast('clicked', {x: event.x, y: event.y})
    canvas.fillRect(event.x, event.y, 10, 10);
  }
  socket.on('clicked', (data) => {
    canvas.fillRect(data.x, data.y, 10, 10);
  });

  socket.on("error", () => {
    console.log("aaaaaaaa")
  });

}

/**
 * Client module init
 */
init = () => {
  socket = io({ upgrade: false, transports: ["websocket"] });
  elem = document.getElementById('c');
  canvas = elem.getContext('2d');
  canvas.canvas.width  = window.innerWidth;
  canvas.canvas.height = window.innerHeight;
  bind();
}

window.addEventListener("load", init, false);
