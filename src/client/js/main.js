//Imports
var canvas = document.getElementById('canvasid'),
    ctx = canvas.getContext('2d'),
    socket = io();

//Testing socket.io
socket.emit('test', 'jaw');
socket.on('test', function(msg){
  ctx.fillText(msg, 0, 10);
});
