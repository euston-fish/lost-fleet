(function() {
  let socket, ctx, me, mothership, selection_start, cursor_location, selected = {};
  let selection_groups = {};
  let slider_vals, el;
  let arena;

  Unit.prototype.draw = function(ctx) {
    let [x, y] = this.position;
    ctx.beginPath();
    ctx.arc(Math.round(x), Math.round(y), 5, 0, Math.PI * 2);
    ctx.fillStyle = this.color();
    ctx.fill();
    ctx.strokeStyle = selected[this.id] !== undefined ? 'orange' : this.owner.color;
    ctx.arc(Math.round(x), Math.round(y), 7, 0, Math.PI * 2);
    ctx.stroke();
  }

  let draw = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'white';
    if(selection_start !== null && cursor_location !== null) {
      ctx.strokeRect(...selection_start, ...add(cursor_location, inv(selection_start)));
    }
    if(arena) {
      Object.values(arena.units).forEach((unit) => unit.draw(ctx));
    }
    window.requestAnimationFrame(draw);
  }

  function handle_tick(commands) {
    //console.log('tick', commands);
    for (var command of commands) {
      arena.receive(command);
    }
    arena.tick();
  }

  show_selected = () => {
    let info_pane = el('selected');
    info_pane.innerHTML = '';
    Object.values(selected).forEach((unit) => {
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
      if (Object.values(selected)[0]) {
        socket.emit('command',
          [Object.values(selected)[0].id, 'create', [slider_vals.r, slider_vals.g, slider_vals.b]]);
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
      event.preventDefault();
      if(event.button === 0) {
        cursor_location = [event.x, event.y];
        if(selection_start === null) selection_start = cursor_location;
        let tl_x = Math.min(selection_start[0], cursor_location[0]);
        let tl_y = Math.min(selection_start[1], cursor_location[1]);
        let br_x = Math.max(selection_start[0], cursor_location[0]);
        let br_y = Math.max(selection_start[1], cursor_location[1]);
        selection_start = null;
        selected = {};
        let item;
        for(let unit of Object.values(arena.users[me].units)) {
          if(unit.in_region([tl_x, tl_y], [br_x, br_y])) {
            selected[unit.id] = unit;
          }
        }
        show_selected();
      } else if(event.button === 2) {
        let offset = [0, 0]
        for(var unit of Object.values(selected)) {
          console.log('sending move for unit', unit);
          if(!event.altKey) socket.emit('command', [unit.id, 'clear_waypoints']);
          socket.emit('command', [unit.id, 'add_waypoint', add([event.x, event.y], offset)]);
          offset = add(offset, [12, 0]);
        }
      }
    });

    document.addEventListener('keydown', (event) => {
      if(/^\d$/.test(event.key)) {
        console.log('number pressed');
        if(event.ctrlKey) {
          selection_groups[event.key] = selected;
        } else {
          // TODO: if units get deleted, this might break
          selected = selection_groups[event.key] || {};
        }
      } else if(event.key == 'a') {
        selected = arena.users[me].units;
      }
    });

    socket.on('connected', (arena_, me_) => {
      arena = new Arena(arena_);
      me = me_;
      console.log('connected', arena, me);
    });

    socket.on("error", () => {
      console.log("error")
    });
    window.requestAnimationFrame(draw);
  }

  window.addEventListener("load", init, false);
})();
