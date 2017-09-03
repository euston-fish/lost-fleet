let start_game = (socket, on_finished) => {
  let me, mothership, cursor_location, selected = {};
  let selection_groups = {};
  let arena;
  let view_center = [0, 0];
  let moi = () => arena.users[me];
  let pressed_keys = {};
  let ui_state = { mode: 'NONE' };
  let el = (id) => document.getElementById(id);
  let resource_display = el('resources');;
  let canvas = el('c');
  let ctx = canvas.getContext('2d');
  let add_event_listener = (object, ...args) => object.addEventListener(...args);
  let w = window;

  let game_to_screen = (game_pos, view_center_) => {
    let vc = view_center_ || view_center
    let screen_dimensions = [ctx.canvas.width, ctx.canvas.height];
    let center = scale(screen_dimensions, 0.5);
    let dist_from_center = sub(game_pos, vc);
    let screen_coordinate = add(center, dist_from_center);
    return screen_coordinate;
  };


  let screen_to_game = (screen_pos, view_center_) => {
    let vc = view_center_ || view_center
    let screen_dimensions = [ctx.canvas.width, ctx.canvas.height];
    let center = scale(screen_dimensions, 0.5);
    return add(sub(screen_pos, center), vc);
  };


  let attrs = [ { short: 'Rn', title: 'Range' }, { short: 'Pw', title: 'Power' },
    { short: 'Ef', title: 'Efficiency' } ]; 
  let pickers = create_pickers({ Attack: attrs, Mine: attrs, Construct: attrs, Misc: [
      { short: 'Ac', title: 'Acceleration' },
      { short: 'De', title: 'Defence' },
      { short: 'Cp', title: 'Capacity' },
      { short: 'Tr', title: 'Transfer' } ]
  }, ['Attack', 'Mine', 'Construct', 'Misc']);

  {
    let old_destroy = Unit.prototype.destroy;
    Unit.prototype.destroy = function(user_was_removed) {
      old_destroy.call(this);
      if (this.owner.id === me) {
        for (let group of selection_groups.values()) {
          delete group[this.id];
        }
        delete selected[this.id];
      }
      if (!user_was_removed && arena.users.values().length != 1) {
        if (moi().units.values().length === 0) {
          el('q').style.backgroundColor = '#781A05';
        } else if (arena.units.values().filter((unit) => unit.owner.id != me).length === 0) {
          el('q').style.backgroundColor = '#078219';
        }
      }
    }
  }

  CanvasRenderingContext2D.prototype.circle = function(pos, radius) {
    this.arc(...pos, radius, 0, Math.PI * 2);
  }

  let scale_path = (rate, ...path) => path.map(([x, y]) => [rate * x, rate * y]);
  let let_path = (...args) => (func) => func(...args);

  let ship_shapes = [
    (unit) => [{
      body: {
        fillStyle: unit.owner.color,
        strokeStyle: selected[unit.id] ? 'orange' : 'grey',
        lineWidth: 3,
        paths: [scale_path(unit.radius(), [0, -1], [1, 1], [-1, 1])]
      },
      flames: {
        fillStyle: 'orange',
        paths: [
          let_path(unit.radius(),
            leng(unit.current_acceleration || [0,0]) * 7
          )((r, s) => [[0, r + s], [r / 2, r], [-r / 2, r]])
        ]
      }
    }],
    (unit) => [{
      body: {
        fillStyle: unit.owner.color,
        strokeStyle: selected[unit.id] ? 'orange' : 'grey',
        lineWidth: 3,
        paths: [scale_path(unit.radius(), [0, -1], [1, 1], [-1, 1])]
      },
      flames: {
        fillStyle: 'orange',
        paths: let_path(unit.radius(), leng(unit.current_acceleration || [0,0]) * 7)(
          (r, s) => [
            [[3, r], [3 + r / 2, r + s], [r - 3, r]],
            [[-3, r], [-r / 2 - 3, r + s], [-r + 3, r]]
          ]
        )
      }
    }]
  ]

  // Draw base of ship, below any lasers
  Unit.prototype.draw_lower = function() {
    let ship_shape = ship_shapes[this.shape_id](this)[0];
    ['flames', 'body'].forEach((component) => {
      let info = ship_shape[component];
      // Exit early if no info for component
      if (!info) return;
      ctx.beginPath();
      info.paths.forEach((path) => {
        ctx.moveTo(...path.shift());
        path.forEach((pos) => ctx.lineTo(...pos));
        ctx.closePath();
      })
      ctx.fillStyle = info.fillStyle;
      ctx.strokeStyle = info.strokeStyle;
      ctx.lineWidth = info.lineWidth;
      if (info.fillStyle) ctx.fill();
      if (info.strokeStyle) ctx.stroke();
    })
  }

  // Stuff that is above the lasers
  Unit.prototype.draw_upper = function() {
    ctx.beginPath();
    ctx.circle([0,0], 5);
    ctx.closePath();
    ctx.fillStyle = 'black';
    ctx.fill();
  }

  Unit.prototype.draw = function() {
    let size = this.radius();
    let pos = game_to_screen(this.pos);
    ctx.save();
    ctx.translate(...pos);
    ctx.rotate(this.rotation);
    this.draw_lower();
    let other;
    if (this.command) {
      ctx.restore();
      if (this.command.type === 'attack') {
        let target = this.arena.units[this.command.target_id];
        if (target && this.laser) {
          ctx.strokeStyle = 'rgb('+this.laser+')';
          ctx.beginPath();
          ctx.lineWidth = 2;
          ctx.moveTo(...pos);
          ctx.lineTo(...game_to_screen(target.pos));
          ctx.stroke();
        }
      } else if (this.command.type === 'mine') {
        let target = this.arena.asteroid_field.asteroid(...this.command.target_id);
        if (target && this.laser) {
          ctx.strokeStyle = 'rgb('+this.laser+')';
          ctx.beginPath();
          ctx.lineWidth = 4;
          ctx.moveTo(...pos);
          ctx.lineTo(...game_to_screen(target.pos));
          ctx.stroke();
        }
      }
      ctx.save();
      ctx.translate(...pos);
      ctx.rotate(this.rotation);
    }
    this.draw_upper();
    ctx.restore();

    //resource_display.innerText = moi() && moi().resources.map((num) => Math.floor(num / 10));
    resource_display.innerText = this.hold;
  }

  Asteroid.prototype.draw = function() {
    ctx.beginPath();
    ctx.save();
    //ctx.translate(...game_to_screen(this.position));
    //ctx.rotate(this.rotation);
    ctx.moveTo(...game_to_screen(this.shape()[0]));
    this.shape().forEach((pos) => ctx.lineTo(...game_to_screen(pos)))
    ctx.closePath();
    let shade = Math.floor(this.stats.reduce(nums.add, 0) / 30);
    //let color = this.stats.map((num) => Math.floor(num / 10));
    let color = '#ddd'; // TODO: asteroid color depending on alpha and beta
    ctx.fillStyle = 'rgb(' + [shade, shade, shade] + ')';
    ctx.strokeStyle = 'rgb(' + color + ')';
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  let draw_stars = (e, s, min, max) => {
    let star_canvas = el(e);
    let star_ctx = star_canvas.getContext('2d');

    let master = new RNG(15784 + s + min + max);
    let x_coefficient = master.random_int();
    let y_coefficient = master.random_int();
    let constant = master.random_int();
    const block_size = 200;

    let previous_view_center = null;

    let resize = () => {
      star_canvas.width = window.innerWidth;
      star_canvas.height = window.innerHeight;
      previous_view_center = null;
    }
    add_event_listener(w, 'resize', resize);
    resize();

    let round_to = (type, block) => ((x) => type(x / block) * block);
    let round_to_floor = round_to(Math.floor, block_size);
    let round_to_ceil = round_to(Math.ceil, block_size);

    return () => {
      if(previous_view_center + '' !== view_center + '') {
        star_ctx.clearRect(0, 0, star_canvas.width, star_canvas.height);
        let star_center = scale(view_center, s);
        for (let x = round_to_floor(star_center[0] - star_canvas.width / 2); x < round_to_ceil(star_center[0] + star_canvas.width / 2); x += block_size) {
          for (let y = round_to_floor(star_center[1] - star_canvas.height / 2); y < round_to_ceil(star_center[1] + star_canvas.height / 2); y += block_size) {

            let rng = new RNG(x_coefficient*x/block_size + y_coefficient*y/block_size + constant);
            let num_stars = Math.round(mix(rng.random(), min, max));
            while(num_stars--) {
              let radius = 1+rng.random()*0.5;
              let pos = game_to_screen([x + rng.random()*block_size, y + rng.random()*block_size], star_center);
              star_ctx.beginPath();
              star_ctx.circle(pos, radius);
              star_ctx.fillStyle = 'white';
              star_ctx.fill();
            }
          }
        }
      }
      previous_view_center = view_center;
    }
  }

  let draw_near_stars = draw_stars('near_stars', 0.15, 2, 5);
  let draw_min_stars = draw_stars('mid_stars', 0.10, 3, 7);
  let draw_far_stars = draw_stars('far_stars', 0.05, 2, 5);

  let resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  add_event_listener(w, "resize", resize);
  resize();

  let previous_time = null;
  let draw = (time) => {
    if(previous_time) {
      dt = time - previous_time;
      let scroll_dir = [0, 0];
      const arrows = [['a', [-1, 0]], ['d', [1, 0]], ['w', [0, -1]], ['s', [0, 1]]];
      arrows.forEach(([name, dir]) => {
        if (pressed_keys[name]) scroll_dir = add(scroll_dir, dir);
      });
      view_center = add(view_center, scale(norm(scroll_dir), dt));
    }
    previous_time = time;
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    draw_near_stars();
    draw_min_stars();
    draw_far_stars();
    ctx.strokeStyle = 'white';
    if(ui_state.mode === 'SELECT') {
      ctx.strokeRect(...ui_state.origin, ...sub(cursor_location, ui_state.origin));
    }
    if (arena) {
      arena.units.values().forEach((unit) => unit.draw());
      arena.asteroid_field
        .in_range(view_center[1] - canvas.height, view_center[0] - canvas.width, view_center[1] + canvas.height, view_center[0] + canvas.width)
        .values()
        .forEach((asteroid) => asteroid.draw());
      arena.users.values().forEach((user) => {
        let d = sub(user.centroid(), view_center);
        if(Math.abs(d[0]) > canvas.width/2 || Math.abs(d[1]) > canvas.height/2) {
          ctx.beginPath();
          ctx.moveTo(...add(scale(d, (canvas.height/2)/Math.abs(d[1])), [canvas.width/2-25, canvas.height/2]));
          ctx.lineTo(...add(scale(d, (canvas.height/2)/Math.abs(d[1])), [canvas.width/2+25, canvas.height/2]));
          ctx.strokeStyle = user.color;
          ctx.lineWidth = 10;
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(...add(scale(d, (canvas.width/2)/Math.abs(d[0])), [canvas.width/2, canvas.height/2-25]));
          ctx.lineTo(...add(scale(d, (canvas.width/2)/Math.abs(d[0])), [canvas.width/2, canvas.height/2+25]));
          ctx.strokeStyle = user.color;
          ctx.lineWidth = 10;
          ctx.stroke();
          ctx.beginPath();
        }
      });
    }
    window.requestAnimationFrame(draw);
  }

  function handle_tick(commands) {
    for (var command of commands) {
      arena.receive(command);
    }
    arena.tick();
  }

  let command = (...args) => socket.emit('command', args)
  socket.on('tick', handle_tick);

  let create_button = el('create');
  create_button.onclick = () => {
    if (selected.values()[0]) {
      // TODO Re-implement this
    }
  };

  add_event_listener(w, 'contextmenu', (event) => event.preventDefault());
  add_event_listener(canvas, 'mousedown', (event) => cursor_location = [event.x, event.y]);
  add_event_listener(canvas, 'mousemove', (event) => cursor_location = [event.x, event.y]);
  add_event_listener(canvas, 'mouseup', (event) => cursor_location = [event.x, event.y]);

  add_event_listener(canvas, 'mousedown', (event) => {
    if ((event.button === 0 && pressed_keys['p']) || event.button === 1) {
      ui_state = { mode: 'PAN', origin: cursor_location, original_view_center: view_center };
    } else if (event.button === 0) {
      ui_state = { mode: 'SELECT', origin: cursor_location, additive: pressed_keys['shift'] };
    }
  });

  add_event_listener(canvas, 'mousemove', (event) => {
    if (ui_state.mode === 'PAN') {
      view_center = add(ui_state.original_view_center, sub(ui_state.origin, cursor_location));
    }
  });

  add_event_listener(canvas, 'mouseup', (event) => {
    let game_cursor = screen_to_game(cursor_location);
    if (ui_state.mode === 'SELECT') {
      if (!ui_state.additive) selected = {};
      // Take all of our units
      (moi() ? moi().units.values() : [])
        // Filter to just the ones in the rounded rectangle specified by the cursor location and selection origin
        .filter((unit) => in_rounded_rectangle(unit.pos, unit.radius(), screen_to_game(cursor_location), screen_to_game(ui_state.origin)))
        // Put each of these units into the selected set
        .forEach((unit) => selected[unit.id] = unit);
    } else if (event.button === 2) {
      let offset = [0, 0];
      let target_id;
      let target_type = 'unit';
      let target = arena.units.values()
        .find((unit) =>
          in_rounded_rectangle(unit.pos, unit.radius(), game_cursor)
        );
      if (target) {
        target_id = target.id;
      } else {
        target_type = 'asteroid';
        
        target = arena.asteroid_field.in_range(
          view_center[1] - canvas.height/2,
          view_center[0] - canvas.width/2,
          view_center[1] + canvas.height/2,
          view_center[0] + canvas.width/2).values().find((ast) => ast.point_in(game_cursor));
        if (target) {
          target_id = target.get_index();
        }
      }
      selected.values()
        .forEach((unit) => {
          if (target) {
            if (target_type == 'unit' && target.owner.id == me) {
              //command(unit.id, 'set_parent', target_id)
              //TODO: reimplement this
            } else {
              //command(unit.id, 'set_target', target_id, target_type);
              //TODO: reimplement this
              if (target_type == 'unit') {
                command(unit.id, 'set_command', { type: 'attack', target_id: target_id });
                //unit.events.hold_full.register(() => {
                  //alert('hold full');
                //});
                unit.events.out_of_range.register(() => {
                  command(unit.id, 'set_destination', add(target.pos, scale(norm(sub(unit.pos, target.pos)), unit.stats.Attack.Rn)));
                });
              } else if (target_type == 'asteroid') {
                command(unit.id, 'set_command', { type: 'mine', target_id: target_id });
                unit.events.out_of_range.register(() => {
                  command(unit.id, 'set_destination', add(target.pos, scale(norm(sub(unit.pos, target.pos)), unit.stats.Mine.Rn)));
                });
              }
            }
          } else {
            if (!event.altKey) {
              //command(unit.id, 'clear_waypoints');
            }
            //command(unit.id, 'add_waypoint', add(screen_to_game(cursor_location), offset));
            command(unit.id, 'set_destination', add(screen_to_game(cursor_location), offset));
            offset = add(offset, [36, 0]);
          }
        });
    }
  });

  add_event_listener(canvas, 'mouseup', (event) => ui_state = { mode: 'NONE' });

  let shortcut_map = {
    e: () => selected = Object.assign({}, arena.users[me].units),
    q: () => selected = {},
    c: create_button.onclick,
    // TODO: reimplement deletion
    " ": () =>  { if (selected.values()[0]) view_center = selected.values()[0].pos; },
    Tab: (event) => {
      event.preventDefault();
      pickers.select_in_n(1)();
    },
    "S-Tab": (event) => {
      event.preventDefault();
      pickers.select_in_n(-1)();
    }
  };

  add_event_listener(w, 'keydown', (event) => {
    pressed_keys[event.key] = event;
    let shortcut_description = '';
    if (event.ctrlKey) {
      shortcut_description += 'C-';
      pressed_keys['ctrl'] = event;
    }
    if (event.altKey) {
      shortcut_description += 'M-';
      pressed_keys['alt'] = event;
    }
    if (event.shiftKey) {
      shortcut_description += 'S-';
      pressed_keys['shift'] = event;
    }

    if(/^\d$/.test(event.key)) {
      if (event.ctrlKey) {
        selection_groups[event.key] = Object.assign({}, selected);
      } else {
        selected = Object.assign({}, selection_groups[event.key] || {});
      }
    } else {
      shortcut_description += event.key;
      if (shortcut_map[shortcut_description]) shortcut_map[shortcut_description](event);
    }
  });

  add_event_listener(w, 'keyup', (event) => {
    delete pressed_keys[event.key];
    if (!event.shiftKey) delete pressed_keys['shift'];
    if (!event.ctrlKey) delete pressed_keys['ctrl'];
    if (!event.altKey) delete pressed_keys['alt'];
  });

  socket.on('connected', (arena_, me_) => {
    console.log(arena_);
    arena = new Arena(arena_);
    me = me_;
    view_center = moi().centroid();
    console.log('connected', arena, me);
  });

  socket.on("error", () => {
    console.log("error")
  });
  window.requestAnimationFrame(draw);
};
