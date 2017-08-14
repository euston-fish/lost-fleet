let elem = document.getElementById('c');
let c = elem.getContext('2d');
c.canvas.width  = window.innerWidth;
c.canvas.height = window.innerHeight;

elem.onclick = (event) => {
  console.log(event);
}
c.fillRect(0, 0, 100, 100);
