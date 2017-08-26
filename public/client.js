let
  socket,
  canvas,
  elem,
  me,
  mothership;

let draw = () => {
  canvas.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
  Object.values(units).forEach((unit) => unit.draw(canvas));
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
    draw();
  });

  elem.onclick = (event) => {
    socket.emit('command', [0, 'move_to', [event.x, event.y]]);
    //let item;
    //if ((item = Object.values(units).find((unit) => unit.covers(event.x, event.y))) != null) {
      //if (item.user.id === me.id) {
        //Object.values(units).forEach((unit) => unit.selected = false)
        //item.selected = true;
        //draw();
      //}
    //} else {
      //Object.values(units).forEach((unit) => unit.selected = false)
      //let unit = UnitFactory({
        //type: 'standard',
        //x: event.x,
        //y: event.y,
        //user: me,
        //color: me.color
      //});
      //socket.bcast('new_unit', unit);
      //units.push(unit);
      //draw();
    //}
  }
  //socket.on('new_unit', (data) => {
    //units.push(UnitFactory(data));
    //draw();
  //});

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
  elem = document.getElementById('c');
  canvas = elem.getContext('2d');
  canvas.canvas.width = window.innerWidth;
  canvas.canvas.height = window.innerHeight;
  bind()
}

window.addEventListener("load", init, false);
