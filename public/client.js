let
  socket,
  canvas,
  elem,
  me,
  mothership,
  units = [];

let draw = () => {
  units.forEach((unit) => unit.draw(canvas));
}

bind = () => {
  socket.on('tick', (commands) => {
    console.log('tick', commands);
    for ([destination, ...params] of commands) {
      units[destination].receive(...params);
    }
    for (unit of Object.values(units)) {
      unit.tick();
    }
  });

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

  socket.on('connected', (mothership_) => {
    console.log('connected', mothership_);
    mothership = new Drone(mothership_);
  });

  socket.on("error", () => {
    console.log("error")
  });
}

init = () => {
  socket = io({ upgrade: false, transports: ["websocket"] });
  bind()
}

window.addEventListener("load", init, false);
