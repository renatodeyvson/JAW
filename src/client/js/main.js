//socket.io
socket.on('att', function(params){

  var players = params.players,
      qtdPlayers = params.qtdPlayers;

  //clear screen
  ctx.clearRect(0, 0, 960, 560);

  //print players (test)
  for (var i=0; i<qtdPlayers;++i){
    ctx.fillStyle = 'blue';
    ctx.fillRect(players[i].x, players[i].y, players[i].width, players[i].height);
    ctx.fillStyle = 'green';
    ctx.fillText(players[i].nickname, players[i].x, players[i].y-5);
  }

  //prompt
  inputs();
  attChat();

});
