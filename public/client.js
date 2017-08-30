(function() {
  let socket, ctx, me, mothership, selection_start, cursor_location, selected = {};
  let selection_groups = {};
  let slider_vals, el;
  let arena;

  {
    let old_destroy = Unit.prototype.destroy;
    Unit.prototype.destroy = function() {
      old_destroy.call(this);
      if (this.owner.id === me) {
        for (let group of Object.values(selection_groups)) {
          delete group[this.id];
        }
        delete selected[this.id];
      }
    }
  }


  Unit.prototype.draw = function(ctx) {
    let other;
    if (other = arena.units[this.target_id]) {
      if (leng(add(this.position, inv(other.position))) < this.weapon_range()) {
        ctx.strokeStyle = 'red';
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(...this.position);
        ctx.lineTo(...other.position);
        ctx.stroke();
      }
    }
    let [x, y] = this.position;
    ctx.beginPath();
    ctx.arc(Math.round(x), Math.round(y), this.radius(), 0, Math.PI * 2);
    ctx.fillStyle = this.color();
    ctx.fill();
    ctx.strokeStyle = this.owner.color;
    ctx.lineWidth = 3;
    ctx.arc(Math.round(x), Math.round(y), this.radius(), 0, Math.PI * 2);
    ctx.stroke();
    if (selected[this.id]) {
      ctx.beginPath();
      ctx.strokeStyle = 'orange'
      ctx.lineWidth = 1;
      ctx.arc(Math.round(x), Math.round(y), this.radius() + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  let draw = () => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    ctx.strokeStyle = 'white';
    if(selection_start !== null && cursor_location !== null) {
      ctx.strokeRect(...selection_start, ...add(cursor_location, inv(selection_start)));
    }
    if (arena) {
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
    let command = (...args) => socket.emit('command', args)
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
        slider_vals[range] = +slider.value;
      }
      slider_vals[range] = 0;
    });

    el('create').onclick = () => {
      if (Object.values(selected)[0]) {
        command(Object.values(selected)[0].id, 'create', [slider_vals.r, slider_vals.g, slider_vals.b]);
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
      cursor_location = [event.x, event.y];
      if (event.button === 0) {
        if(selection_start === null) selection_start = cursor_location;
        let tl_x = Math.min(selection_start[0], cursor_location[0]);
        let tl_y = Math.min(selection_start[1], cursor_location[1]);
        let br_x = Math.max(selection_start[0], cursor_location[0]);
        let br_y = Math.max(selection_start[1], cursor_location[1]);
        selection_start = null;
        selected = {};
        let item;
        for (let unit of Object.values(arena.users[me].units)) {
          if (unit.in_region([tl_x, tl_y], [br_x, br_y])) {
            selected[unit.id] = unit;
          }
        }
        show_selected();
      } else if (event.button === 2) {
        let offset = [0, 0]
        let target = Object.values(arena.units).find((unit) =>
          unit.in_region(cursor_location, cursor_location) && unit.owner.id !== me);

        for (var unit of Object.values(selected)) {
          if (target) {
            command(unit.id, 'set_target', target.id);
          } else {
            if (!event.altKey) {
              command(unit.id, 'clear_waypoints');
            }
            command(unit.id, 'add_waypoint', add([event.x, event.y], offset));
            offset = add(offset, [12, 0]);
          }
        }
      }
    });

    document.addEventListener('keydown', (event) => {
      if(/^\d$/.test(event.key)) {
        if (event.ctrlKey) {
          selection_groups[event.key] = selected;
        } else {
          // TODO: if units get deleted, this might break
          selected = selection_groups[event.key] || {};
        }
      } else if (event.key == 'a') {
        selected = arena.users[me].units;
      } else if (event.key == 'Delete' || event.key == 'Backspace') {
        Object.values(selected).forEach((unit) => command(unit.id, 'destroy'))
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
