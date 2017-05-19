//Socket.io
socket.on('att', function(params){

  var players = params.players,
      qtdPlayers = params.qtdPlayers;

  //Clear screen
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, 960, 560);

  //Print players (teste)
  for (var i=0; i<qtdPlayers;++i){
    ctx.fillStyle = 'blue';
    ctx.fillRect(players[i].x, players[i].y, players[i].width, players[i].height);
    ctx.fillStyle = 'green';
    ctx.fillText(players[i].nickname, players[i].x, players[i].y-5);
  }

  //Prompt
  inputs();
  attChat();

});
