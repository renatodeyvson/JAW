//globals
var id,
    myScore = 0,
    topScore1 = '',
    topScore2 = '',
    topScore3 = '';

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

  //translate context
  for (var i=0; i<qtdPlayers; ++i){
    if (players[i].socket == id){
      ctx.save();
      ctx.translate(-players[i].x + 480 - (players[i].width/2),
                      -players[i].y + 280 - (players[i].height/2));
    }
  }

  //print world (test)
  var world_img = new Image();
  world_img.src = '../img/world/map.png';
  ctx.drawImage(world_img, -1500, -1500);

  //print players (test)
  for (var i=0; i<qtdPlayers; ++i){
    var l_img = new Image();
    l_img.src = '../img/char/l.png';
    ctx.drawImage(l_img, players[i].x, players[i].y);
    ctx.fillStyle = 'black';
    ctx.fillText(players[i].nickname, players[i].x, players[i].y-5);
  }

  //print essences (test)
  for (var i=0; i<qtdEssences; ++i){
    var essence_img = new Image();
    essence_img.src = '../img/essence/thing.png';
    ctx.drawImage(essence_img, essences[i].x, essences[i].y);
  }

  //print stone (test)
  for (var j=0; j<qtdStones; ++j){
    var stone_img = new Image();
    stone_img.src = '../img/stone/rock.png';
    ctx.drawImage(stone_img, stones[j].x, stones[j].y);
  }

  //score (test)
  for (var i=0; i<qtdPlayers; ++i){

    //personal score
    if (players[i].socket == id) myScore = players[i].qtdEssences;

    //global score
    players.sort(function(a, b){
      return b.qtdEssences - a.qtdEssences;
    });
    
    if (players[0] != undefined) topScore1 = '#1 '+players[0].nickname+': '+players[0].qtdEssences;
    if (players[1] != undefined) topScore2 = '#2 '+players[1].nickname+': '+players[1].qtdEssences;
    if (players[2] != undefined) topScore3 = '#3 '+players[2].nickname+': '+players[2].qtdEssences;

  }

  //restore context
  ctx.restore();

  //prompt
  inputs();
  attChat();
  score();

});
