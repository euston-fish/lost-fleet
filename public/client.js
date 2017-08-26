let
  socket,
  canvas,
  elem,
  me,
  units = [];

let draw = () => {
  units.forEach((unit) => unit.draw(canvas));
}

bind = () => {
  socket.bcast = (method, data) => socket.emit('bcast', {method: method, data: data});

  elem.onclick = (event) => {
    let item;
    if ((item = units.find((unit) => unit.covers(event.x, event.y))) != null) {
      if (item.user.id === me.id) {
        units.forEach((unit) => unit.selected = false)
        item.selected = true;
        draw();
      }
    } else {
      let unit = UnitFactory({
        type: 'standard',
        x: event.x,
        y: event.y,
        user: me,
        color: me.color
      });
      socket.bcast('new_unit', unit);
      units.push(unit);
      draw();
    }
  }
  socket.on('new_unit', (data) => {
    units.push(UnitFactory(data));
    draw();
  });

  socket.on("error", () => {
    console.log("aaaaaaaa")
  });

  socket.on('connected', (user) => me = user);
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
