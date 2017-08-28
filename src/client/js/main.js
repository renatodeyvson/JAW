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
      qtdEssences = params.qtdEssences,
      stones = params.stones,
      qtdStones = params.qtdStones;

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
    ctx.fillStyle = 'yellow';
    ctx.fillRect(essences[i].x, essences[i].y, essences[i].width, essences[i].height);
  }

  //print stone (test)
  for (var j=0; j<qtdStones; ++j){
    ctx.fillStyle = "red";
    ctx.fillRect(stones[j].x, stones[j].y, stones[j].width, stones[j].height);
  }

  //print score (test)
  for (var i=0; i<qtdPlayers; ++i){

    ctx.fillStyle = 'black';

    //personal score
    if (players[i].socket == id){
      ctx.fillText(players[i].qtdEssences, players[i].x+20, players[i].y+30);
    }

    //global score
    players.sort(function(a, b){
      return b.qtdEssences - a.qtdEssences;
    });
    
    if (players[0] != undefined) ctx.fillText('#1 '+players[0].nickname+': '+players[0].qtdEssences, players[i].x+20, players[i].y+50);
    if (players[1] != undefined) ctx.fillText('#2 '+players[1].nickname+': '+players[1].qtdEssences, players[i].x+20, players[i].y+60);
    if (players[2] != undefined) ctx.fillText('#3 '+players[2].nickname+': '+players[2].qtdEssences, players[i].x+20, players[i].y+70);

  }

  //restore context
  ctx.restore();

  //prompt
  inputs();
  attChat();

});
