(function() {
  let socket, ctx, me, mothership, cursor_location, selected = {};
  let selection_groups = {};
  let slider_vals, el;
  let arena;
  let view_center = [0, 0];
  let zoom = 1;
  let resource_display;
  let moi = () => arena.users[me];
  let pressed_keys = {};
  let ui_state = { mode: 'NONE' };
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

  stroke_triangle = ([x, y], size, rotation) => {
    ctx.beginPath();
    ctx.translate(x, y);
    ctx.rotate(rotation);
    ctx.moveTo(0, -size);
    ctx.lineTo(size, size);
    ctx.lineTo(-size, size);
    ctx.rotate(-rotation);
    ctx.translate(-x, -y);
    ctx.closePath();
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
    stroke_triangle([x, y], this.radius(), this.rotation);
    ctx.fillStyle = this.owner.color;
    ctx.fill();
    // ctx.arc(Math.round(x), Math.round(y), this.radius() / zoom, 0, Math.PI * 2);
    // ctx.fillStyle = this.color();
    // ctx.fill();
    // ctx.beginPath();
    // ctx.strokeStyle = this.owner.color;
    // ctx.lineWidth = 3;
    // ctx.arc(Math.round(x), Math.round(y), this.radius() / zoom, 0, Math.PI * 2);
    // ctx.stroke();
    stroke_triangle([x, y], this.radius(), this.rotation);
    ctx.strokeStyle = selected[this.id] ? 'orange' : 'grey';
    ctx.lineWidth = 3;
    ctx.stroke();
    resource_display.innerText = moi() && moi().resources.map(Math.floor);
  }

  let draw_stars;
  {
    let master = new RNG(15784);
    let x_coefficient = master.random_int();
    let y_coefficient = master.random_int();
    let constant = master.random_int();
    let block_size = 200;

    draw_stars = () => {
      for (let x = Math.floor((view_center[0] - canvas.width / 2) / block_size)*block_size; x < Math.ceil((view_center[0] + canvas.width/2) / block_size)*block_size; x += block_size) {
        for (let y = Math.floor((view_center[1] - canvas.height / 2) / block_size)*block_size; y < Math.ceil((view_center[1] + canvas.height/2)/block_size)*block_size; y += block_size) {
          let rng = new RNG(x_coefficient*x/block_size + y_coefficient*y/block_size + constant);
          let num_stars = Math.round(mix(rng.random(), 3, 30));
          for (let i = 0; i < num_stars; i++) {
            ctx.beginPath();
            ctx.arc(...game_to_screen([x + rng.random()*block_size, y + rng.random()*block_size]), 1+rng.random(), 0, Math.PI * 2);
            ctx.fillStyle = 'white';
            ctx.fill();
          }
          //ctx.beginPath();
          //ctx.arc(...game_to_screen([x, y]), 5, 0, Math.PI * 2);
          //ctx.strokeStyle = 'orange';
          //ctx.stroke();
        }
      }
    }
  }

  let previous_time = null;
  let draw = (time) => {
    if(previous_time) {
      dt = time - previous_time;
      let scroll_dir = [0, 0];
      if (pressed_keys["ArrowLeft"]) {
        scroll_dir = add(scroll_dir, [-1, 0]);
      }
      if (pressed_keys["ArrowRight"]) {
        scroll_dir = add(scroll_dir, [1, 0]);
      }
      if (pressed_keys["ArrowUp"]) {
        scroll_dir = add(scroll_dir, [0, -1]);
      }
      if (pressed_keys["ArrowDown"]) {
        scroll_dir = add(scroll_dir, [0, 1]);
      }
      view_center = add(view_center, scale(norm(scroll_dir), dt));
    }
    previous_time = time;
    ctx.canvas.width = window.innerWidth;
    ctx.canvas.height = window.innerHeight;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    draw_stars();
    ctx.strokeStyle = 'white';
    if(ui_state.mode === 'SELECT') {
      ctx.strokeRect(...ui_state.origin, ...add(cursor_location, inv(ui_state.origin)));
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

    canvas.addEventListener('contextmenu', (event) => event.preventDefault());

    canvas.addEventListener('mousedown', (event) => {
      cursor_location = [event.x, event.y];
    });
    canvas.addEventListener('mousemove', (event) => cursor_location = [event.x, event.y]);
    canvas.addEventListener('mouseup', (event) => {
      cursor_location = [event.x, event.y]
    });

    canvas.addEventListener('mousemove', (event) => {
      if (ui_state.mode === 'PAN') {
        view_center = add(ui_state.original_view_center, sub(ui_state.origin, cursor_location));
      }
    });

    canvas.addEventListener('mousedown', (event) => {
      console.log('mousedown');
      if(event.button === 0) {
        if(pressed_keys['p']) {
          ui_state = { mode: 'PAN', origin: cursor_location, original_view_center: view_center };
        } else {
          ui_state = { mode: 'SELECT', origin: cursor_location };
        }
      }
      console.log(ui_state);
    });

    canvas.addEventListener('mousemove', (event) => {
    });

    canvas.addEventListener('mouseup', (event) => {
      console.log('mouseup');
      console.log(ui_state);
      if (ui_state.mode === 'SELECT') {
        selected = {};
        let item;
        if (moi()) {
          for (let unit of Object.values(arena.users[me].units)) {
            if (in_rounded_rectangle(unit.position, unit.radius() / zoom, screen_to_game(cursor_location), screen_to_game(ui_state.origin))) {
              selected[unit.id] = unit;
            }
          }
        }
      } else if (event.button === 2) {
        let offset = [0, 0]
        let target = Object.values(arena.units).find((unit) =>
          in_rounded_rectangle(unit.position, unit.radius() / zoom, screen_to_game(cursor_location), screen_to_game(cursor_location)) && unit.owner.id !== me);

        for (var unit of Object.values(selected)) {
          if (target) {
            command(unit.id, 'set_target', target.id);
          } else {
            if (!event.altKey) {
              command(unit.id, 'clear_waypoints');
            }
            command(unit.id, 'add_waypoint', add(screen_to_game(cursor_location), offset));
            offset = add(offset, [36, 0]);
          }
        }
      }
    });

    canvas.addEventListener('mouseup', (event) => ui_state = { mode: 'NONE' });

    document.addEventListener('keydown', (event) => {
      pressed_keys[event.key] = event;
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

    document.addEventListener('keyup', (event) => {
      delete pressed_keys[event.key];
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
