(function() {
  let
    socket,
    ctx,
    me,
    mothership,
    selection_start,
    selection_end,
    selected;

  let draw = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'white';
    if (selection_start !== null && selection_end !== null) {
      ctx.strokeRect(...selection_start, ...add(selection_end, inv(selection_start)));
    }
    Object.values(units).forEach((unit) => unit.draw(ctx));
    window.requestAnimationFrame(draw);
  }

  function handle_tick(commands) {
    //console.log('tick', commands);
    for (var [destination, ...params] of commands) {
      units[destination].receive(...params);
    }
    for (var unit of Object.values(units)) {
      unit.tick();
    }
  }

  init = () => {
    socket = io({ upgrade: false, transports: ["websocket"] });
    let elem = document.getElementById('c');
    ctx = elem.getContext('2d');
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    socket.on('tick', handle_tick);

    ['thing', 'other', 'stuff'].forEach((range) => {
      let disp = document.getElementById(range + '-val');
      let slider = document.getElementById(range);
      slider.onchange = () => disp.innerText = slider.value;
    });

    selection_start = null;
    selection_end = null;

    elem.addEventListener('contextmenu', (event) => { event.preventDefault(); });

    elem.addEventListener('mousedown', (event) => {
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
        for(var unit of Object.values(units)) {
          if(unit.in_region([tl_x, tl_y], [br_x, br_y])) {
            selected.push(unit);
            unit.selected = true;
          } else {
            unit.selected = false;
          }
        }
      } else if(event.button === 2) {
        let offset = [0, 0]
        for(var unit of selected) {
          socket.emit('command', [unit.id, 'move_to', add([event.x, event.y], offset)]);
          offset = add(offset, [12, 0]);
        }
      }
    });

    socket.on('connected', (units) => {
      console.log('connected', units);
      for(var unit of units) {
        new Drone(unit);
      }
    });

    socket.on("error", () => {
      console.log("error")
    });
    window.requestAnimationFrame(draw);
  }

  window.addEventListener("load", init, false);
})();
