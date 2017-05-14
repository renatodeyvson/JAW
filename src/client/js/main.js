//Socket.io
socket.on('att', function(){

  //Clear screen
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 960, 560);

  //Prompt
  inputs();
  attChat();

});
