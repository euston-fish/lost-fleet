(function() {
  let socket, ctx, me, mothership, selection_start, cursor_location, selected = {};
  let selection_groups = {};
  let slider_vals, el;
  let arena;
  let view_center = [0, 0];
  let zoom = 1;
  let resource_display;
  let moi = () => arena.users[me];
  let canvas;

  let game_to_screen = (game_pos) => {
    // screen_pos = center + (game_pos - view_center) * zoom
    let screen_dimensions = [ctx.canvas.width, ctx.canvas.height];
    let center = scale(screen_dimensions, 0.5);
    let dist_from_center = add(game_pos, inv(view_center));
    let screen_coordinate = add(center, scale(dist_from_center, zoom));
    return screen_coordinate;
  };


  let screen_to_game = (screen_pos) => {
    // game_pos = ((screen_pos - center) / zoom) + view_center
    let screen_dimensions = [ctx.canvas.width, ctx.canvas.height];
    let center = scale(screen_dimensions, 0.5);
    return add(scale(add(screen_pos, inv(center)), 1/zoom), view_center);
  };

  {
    let old_destroy = Unit.prototype.destroy;
    Unit.prototype.destroy = function(user_was_removed) {
      old_destroy.call(this);
      if (this.owner.id === me) {
        for (let group of Object.values(selection_groups)) {
          delete group[this.id];
        }
        delete selected[this.id];
      }
      if (!user_was_removed && Object.values(arena.users).length != 1) {
        if (Object.values(moi().units).length === 0) {
          el('c').style.backgroundColor = '#781A05';
        } else if (Object.values(arena.units).filter((unit) => unit.owner.id != me).length === 0) {
          el('c').style.backgroundColor = '#078219';
        }
      }
    }
  }

  draw_triangle = ([x, y], size, rotation) => {
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.moveTo(0, -size);
    ctx.lineTo(size, size);
    ctx.lineTo(-size, size);
    ctx.fill();
    ctx.rotate(-rotation);
    ctx.translate(-x, -y);
  }

  Unit.prototype.draw = function() {
    let [x, y] = game_to_screen(this.position);
    let other;
    if (other = arena.units[this.target_id]) {
      if (leng(add(this.position, inv(other.position))) < this.weapon_range()) {
        ctx.strokeStyle = this.owner.color;
        ctx.beginPath();
        ctx.lineWidth = 4;
        ctx.moveTo(...[x, y]);
        ctx.lineTo(...game_to_screen(other.position));
        ctx.stroke();
      }
    }
    // ctx.beginPath();
    ctx.fillStyle = this.owner.color;
    draw_triangle([x, y], this.radius() / 2, this.rotation);
    // ctx.arc(Math.round(x), Math.round(y), this.radius() / zoom, 0, Math.PI * 2);
    // ctx.fillStyle = this.color();
    // ctx.fill();
    // ctx.beginPath();
    // ctx.strokeStyle = this.owner.color;
    // ctx.lineWidth = 3;
    // ctx.arc(Math.round(x), Math.round(y), this.radius() / zoom, 0, Math.PI * 2);
    // ctx.stroke();
    if (selected[this.id]) {
      ctx.beginPath();
      ctx.strokeStyle = 'orange'
      ctx.lineWidth = 1;
      ctx.arc(Math.round(x), Math.round(y), this.radius() / zoom + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
    resource_display.innerText = moi() && moi().resources.map(Math.floor);
  }

  let draw = () => {
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    let rng = new RNG(42);
    for (let i=0; i<300; i++) {
      ctx.beginPath();
      ctx.arc(rng.random()*ctx.canvas.width, rng.random()*ctx.canvas.height, 1+rng.random(), 0, Math.PI * 2);
      ctx.fillStyle = 'white';
      ctx.fill();
    }
    ctx.strokeStyle = 'white';
    if(selection_start !== null && cursor_location !== null) {
      ctx.strokeRect(...game_to_screen(selection_start), ...add(game_to_screen(cursor_location), inv(game_to_screen(selection_start))));
    }
    if (arena) {
      Object.values(arena.units).forEach((unit) => unit.draw());
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

  init = () => {
    el = (id) => document.getElementById(id);
    socket = io({ upgrade: false, transports: ["websocket"] });
    let command = (...args) => socket.emit('command', args)
    canvas = el('c');
    resource_display = el('resources');
    ctx = canvas.getContext('2d');
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
        let cost = [slider_vals.r, slider_vals.g, slider_vals.b];
        let subtracted = moi().subtracted_resources(...cost);
        if (subtracted != '0,0,0') {
          moi().resources = subtracted;
          command(Object.values(selected)[0].id, 'create', cost);
        }
      }
    };

    selection_start = null;

    canvas.addEventListener('contextmenu', (event) => { event.preventDefault(); });

    canvas.addEventListener('mousedown', (event) => {
      cursor_location = screen_to_game([event.x, event.y]);
      if(event.button === 0) {
        selection_start = cursor_location;
      }
    });

    canvas.addEventListener('mousemove', (event) => {
      cursor_location = screen_to_game([event.x, event.y]);
    });

    canvas.addEventListener('mouseup', (event) => {
      event.preventDefault();
      cursor_location = screen_to_game([event.x, event.y]);
      if (event.button === 0) {
        if(selection_start === null) selection_start = cursor_location;
        selected = {};
        let item;
        if (moi()) {
          for (let unit of Object.values(arena.users[me].units)) {
            if (in_rounded_rectangle(unit.position, unit.radius() / zoom, cursor_location, selection_start)) {
              selected[unit.id] = unit;
            }
          }
        }
        selection_start = null;
      } else if (event.button === 2) {
        let offset = [0, 0]
        let target = Object.values(arena.units).find((unit) =>
          in_rounded_rectangle(unit.position, unit.radius() / zoom, cursor_location, cursor_location) && unit.owner.id !== me);

        for (var unit of Object.values(selected)) {
          if (target) {
            command(unit.id, 'set_target', target.id);
          } else {
            offset = add(offset, [unit.radius() + 2, 0]);
            if (!event.altKey) {
              command(unit.id, 'clear_waypoints');
            }
            command(unit.id, 'add_waypoint', add(cursor_location, offset));
            offset = add(offset, [unit.radius() + 2, 0]);
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

    document.addEventListener('wheel', (event) => {
      // TODO: make this zoom maybe a little more nicely?
      if(event.deltaY > 0) {
        zoom *= event.deltaY / 5;
      } else {
        zoom /= -event.deltaY / 5;
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
