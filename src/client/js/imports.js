//imports
var canvas = document.getElementById('canvasid'),
    ctx = canvas.getContext('2d'),
    socket = io();

//globals
var prompt = false;
    key = [];

//input Listener
window.addEventListener('keydown', function(e) {
  key[e.keyCode] = true;
  if (!prompt) socket.emit('keydown', e.keyCode);
});
window.addEventListener('keyup', function(e){
  key[e.keyCode] = false;
  if (!prompt) socket.emit('keyup', e.keyCode);
});
