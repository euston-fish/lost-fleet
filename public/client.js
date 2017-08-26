let socket, mothership;

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
