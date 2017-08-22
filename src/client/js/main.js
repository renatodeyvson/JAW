//globals
var id;

//socket.io
socket.on('id', function(params){
  id = params;
});

socket.on('att', function(params){

  var players = params.players,
      qtdPlayers = params.qtdPlayers,
      essences = params.essences,
      qtdEssences = params.qtdEssences;

  //clear screen
  ctx.clearRect(0, 0, 960, 560);

  //translate context
  for (var i=0; i<qtdPlayers; ++i){
    if (players[i].socket == id){
      ctx.save();
      ctx.translate(-players[i].x + 480 - (players[i].width/2),
                      -players[i].y + 280 - (players[i].height/2));
    }
  }

  //print players (test)
  for (var i=0; i<qtdPlayers; ++i){
    ctx.fillStyle = 'blue';
    ctx.fillRect(players[i].x, players[i].y, players[i].width, players[i].height);
    ctx.fillStyle = 'green';
    ctx.fillText(players[i].nickname, players[i].x, players[i].y-5);
  }

  //print essences (test)
  for (var i=0; i<qtdEssences; ++i){
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(essences[i].x, essences[i].y, essences[i].radius, 0, 2*Math.PI);
    ctx.fillStyle = 'yellow';
    ctx.fill();
    ctx.stroke();
  }

  //restore context
  ctx.restore();

  //prompt
  inputs();
  attChat();

});
