//imports
var canvas = document.getElementById('canvasid'),
    ctx = canvas.getContext('2d'),
    socket = io();

//config
ctx.font = 'bold 15px Courier';
//ctx.scale(0.2, 0.2); //god vision

//globals
var prompt = false,
    showTutorial = true;
    key = [];

//input Listener
window.addEventListener('keydown', function(e) {
  key[e.keyCode] = true;
  showTutorial = false;
  if (!prompt) socket.emit('keydown', e.keyCode);
});
window.addEventListener('keyup', function(e){
  key[e.keyCode] = false;
  if (!prompt) socket.emit('keyup', e.keyCode);
});
