/******************************************************************************
*                                  globals                                    *
******************************************************************************/

//game state
var id = '',
    players = [],
    qtdPlayers = 0,
    essences = [],
    qtdEssences = 0,
    stones = [],
    qtdStones = 0,
    myScore = 0,
    topScore1 = '',
    topScore2 = '',
    topScore3 = '';

//images
var world_img = new Image(),
    l_img = new Image(),
    stone_img = new Image(),
    essence_img = new Image();

world_img.src = '../img/world/map.png';
l_img.src = '../img/char/l.png';
stone_img.src = '../img/stone/rock.png';
essence_img.src = '../img/essence/thing.png';

/******************************************************************************
*                                socket.io                                    *
******************************************************************************/

socket.on('start', function(params){
  id = params.id;
  players = params.players;
  qtdPlayers = params.qtdPlayers;
  essences = params.essences;
  qtdEssences = params.qtdEssences;
  stones = params.stones;
  qtdStones = params.qtdStones;

  render();
});

socket.on('players listen', function(params){
  qtdPlayers = params.qtdPlayers;

  var a = params.players;
  players = players.map(function(b, i){
    b.socket = a[i].socket;
    b.nickname = a[i].nickname;
    b.x = a[i].x;
    b.y = a[i].y;
    b.qtdEssences = a[i].qtdEssences;
    b.stone = a[i].stone;
    return b;
  })
});

socket.on('stones listen', function(params){
  qtdStones = params.qtdStones;

  var a = params.stones;
  stones = stones.map(function(b, i){
    b.x = a[i].x;
    b.y = a[i].y;
    b.onGround = a[i].onGround;
    return b;
  });
});

socket.on('essences listen', function(params){
  qtdEssences = params.qtdEssences;

  var a = params.essences;
  essences = essences.map(function(b, i){
    b.x = a[i].x;
    b.y = a[i].y;
    return b;
  });
});

/******************************************************************************
*                                   setup                                     *
******************************************************************************/

//config animation frame
window.requestAnimFrame = (function() {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.msRequestAnimationFrame     ||
            function( callback ) {
                window.setTimeout(callback, 1000 / 60);
            };
})();

/******************************************************************************
*                                   Aux                                       *
******************************************************************************/

//render the game on screen
function render(){

  cameraFollowStart();

  printWorld();
  printPlayers();
  printEssences();
  printStones();

  cameraFollowStop();

  inputs();
  printQtdPlayers();
  calculateScore();
  printScore();
  attChat();

  window.requestAnimFrame(render);

}

//show the world on map (clean the screen)
function printWorld(){
  ctx.drawImage(world_img, -1500, -1500);
}

//show the players on map
function printPlayers(){
  for (var i=0; i<qtdPlayers; ++i){
    if (players[i] != undefined){
      ctx.drawImage(l_img, players[i].x, players[i].y);
      ctx.fillStyle = 'blue';
      var nickX = players[i].x+(players[i].width/2)-(ctx.measureText(players[i].nickname).width/2),
          nickY = players[i].y-5;
      ctx.fillText(players[i].nickname, nickX, nickY);
    }
  }
}

//show the stones on map
function printStones(){
  for (var j=0; j<qtdStones; ++j){
    ctx.drawImage(stone_img, stones[j].x, stones[j].y);
  }
}

//show the essences on map
function printEssences(){
  for (var i=0; i<qtdEssences; ++i){
    ctx.drawImage(essence_img, essences[i].x, essences[i].y);
  }
}

//show qtd of players on screen
function printQtdPlayers(){
  ctx.fillText('online: '+qtdPlayers, 830, 30);
}

//show the score on screen
function printScore(){
  //personal score
  ctx.fillStyle = 'black';
  ctx.fillText(myScore, 830, 535);

  //global score
  ctx.fillText(topScore1, 20, 30);
  ctx.fillText(topScore2, 20, 45);
  ctx.fillText(topScore3, 20, 60);
}

//calculate the personal and global score
function calculateScore(){
  for (var i=0; i<qtdPlayers; ++i){

    //personal score
    if (players[i] != undefined && players[i].socket == id) myScore = 'essences: '+players[i].qtdEssences;

    //global score
    players.sort(function(a, b){
      return b.qtdEssences - a.qtdEssences;
    });

    if (players[0] != undefined) topScore1 = '#1 '+players[0].nickname+': '+players[0].qtdEssences;
    if (players[1] != undefined) topScore2 = '#2 '+players[1].nickname+': '+players[1].qtdEssences;
    if (players[2] != undefined) topScore3 = '#3 '+players[2].nickname+': '+players[2].qtdEssences;

  }
}

//translate camera
function cameraFollowStart(){
  for (var i=0; i<qtdPlayers; ++i){
    if (players[i] != undefined && players[i].socket == id){
      ctx.save();
      ctx.translate(-players[i].x + 480 - (players[i].width/2),
                      -players[i].y + 280 - (players[i].height/2));
    }
  }
}
function cameraFollowStop(){
  ctx.restore();
}
