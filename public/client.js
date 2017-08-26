let
  socket,
  canvas,
  elem,
  me,
  mothership,
  selection_start,
  selection_end,
  selected;

let draw = () => {
  canvas.clearRect(0, 0, canvas.canvas.width, canvas.canvas.height);
  if(selection_start !== null && selection_end !== null) canvas.strokeRect(...selection_start, ...add(selection_end, inv(selection_start)));
  Object.values(units).forEach((unit) => unit.draw(canvas));
  window.requestAnimationFrame(draw);
}

bind = () => {
  socket.on('tick', (commands) => {
    //console.log('tick', commands);
    for ([destination, ...params] of commands) {
      units[destination].receive(...params);
    }
    for (unit of Object.values(units)) {
      unit.tick();
    }
  });

  selection_start = null;
  selection_end = null;

  elem.addEventListener('contextmenu', (event) => {
    event.preventDefault();
  });

  elem.addEventListener('mousedown', (event) => {
    //socket.emit('command', [0, 'move_to', [event.x, event.y]]);
    if(event.button === 0) {
      selection_start = [event.x, event.y];
    }
  });

  elem.addEventListener('mousemove', (event) => {
    if(event.button === 0) {
      selection_end = [event.x, event.y];
    }
  });

  elem.addEventListener('mouseup', (event) => {
    if(event.button === 0) {
      selection_end = [event.x, event.y];
      if(selection_start === null) selection_start = selection_end;
      let tl_x = Math.min(selection_start[0], selection_end[0]);
      let tl_y = Math.min(selection_start[1], selection_end[1]);
      let br_x = Math.max(selection_start[0], selection_end[0]);
      let br_y = Math.max(selection_start[1], selection_end[1]);
      selection_start = null;
      selection_end = null;
      selected = [];
      let item;
      for(unit of Object.values(units)) {
        if(unit.in_region([tl_x, tl_y], [br_x, br_y])) {
          selected.push(unit);
          unit.selected = true;
        } else {
          unit.selected = false;
        }
      }
    } else if(event.button === 2) {
      //let average_pos = [0, 0]
      //for(unit of selected) {
        //average_pos = add(average_pos, unit.position);
      //}
      //average_pos = scale(average_pos, 1/selected.length);
      let offset = [0, 0]
      for(unit of selected) {
        socket.emit('command', [unit.id, 'move_to', add([event.x, event.y], offset)]);
        offset = add(offset, [12, 0]);
      }
    }
  });
  //socket.on('new_unit', (data) => {
    //units.push(UnitFactory(data));
    //draw();
  //});

  socket.on('connected', (units) => {
    console.log('connected', units);
    for(unit of units) {
      new Drone(unit);
    }
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
  bind();
  window.requestAnimationFrame(draw);
}

window.addEventListener("load", init, false);
