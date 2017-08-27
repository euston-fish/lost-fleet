(function() {
  let socket, ctx, me, mothership, selection_start, cursor_location, selected;
  let slider_vals, el;

  let draw = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'white';
    if(selection_start !== null && cursor_location !== null) {
      ctx.strokeRect(...selection_start, ...add(cursor_location, inv(selection_start)));
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

  show_selected = () => {
    let info_pane = el('selected');
    info_pane.innerHTML = '';
    selected.forEach((unit) => {
      info_pane.innerHTML += unit.stats + '<br>';
    });
  };

  init = () => {
    el = (id) => document.getElementById(id);
    socket = io({ upgrade: false, transports: ["websocket"] });
    let elem = el('c');
    ctx = elem.getContext('2d');
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    socket.on('tick', handle_tick);

    slider_vals = {};
    ['r', 'g', 'b'].forEach((range) => {
      let disp = el(range + '-val');
      let slider = el(range);
      slider.onchange = () => {
        disp.innerText = slider.value;
        slider_vals[range] = slider.value;
      }
      slider_vals[range] = '0';
    });

    el('create').onclick = () => {
      if (selected[0]) {
        socket.emit('command',
          [selected[0].id, 'create', [slider_vals.r, slider_vals.g, slider_vals.b]]);
      }
    };

    selection_start = null;

    elem.addEventListener('contextmenu', (event) => { event.preventDefault(); });

    elem.addEventListener('mousedown', (event) => {
      cursor_location = [event.x, event.y];
      if(event.button === 0) {
        selection_start = cursor_location;
      }
    });

    elem.addEventListener('mousemove', (event) => {
      cursor_location = [event.x, event.y];
    });

    elem.addEventListener('mouseup', (event) => {
      if(event.button === 0) {
        cursor_location = [event.x, event.y];
        if(selection_start === null) selection_start = cursor_location;
        let tl_x = Math.min(selection_start[0], cursor_location[0]);
        let tl_y = Math.min(selection_start[1], cursor_location[1]);
        let br_x = Math.max(selection_start[0], cursor_location[0]);
        let br_y = Math.max(selection_start[1], cursor_location[1]);
        selection_start = null;
        selected = [];
        let item;
        for (var unit of Object.values(units)) {
          if (unit.in_region([tl_x, tl_y], [br_x, br_y])) {
            selected.push(unit);
            unit.selected = true;
            console.log('selected', unit);
          } else {
            unit.selected = false;
          }
        }
        show_selected();
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
