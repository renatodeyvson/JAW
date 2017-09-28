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
    objects = [],
    qtdObjects = 0,
    myScore = 0,
    myKills = 0,
    myDeaths = 0,
    topScore1 = '',
    topScore2 = '',
    topScore3 = '';

//images
var world_img = new Image(),
    char_img = new Image(),
    stone_img = new Image(),
    essence_img = new Image();

world_img.src = '../img/world/map.png';
char_img.src = '../img/char/l.png';
stone_img.src = '../img/stone/pumpkin.png';
essence_img.src = '../img/essence/thing.png';

/******************************************************************************
*                                socket.io                                    *
******************************************************************************/

socket.on('id', function(params){
  id = params.id;
});

socket.on('start', function(params){
  players = params.players;
  qtdPlayers = params.qtdPlayers;
  essences = params.essences;
  qtdEssences = params.qtdEssences;
  stones = params.stones;
  qtdStones = params.qtdStones;
  objects = params.objects;
  qtdObjects = params.qtdObjects;

  for(var i=0; i<qtdPlayers; ++i){
    players[i].frames = 4;
    players[i].index = 0;
    players[i].time = 4;
    players[i].auxTime = 0;
  }

  for(var i=0; i<qtdEssences; ++i){
    essences[i].frames = 3;
    essences[i].index = getRandomInt(0, 3);
    essences[i].time = 10;
    essences[i].auxTime = 0;
  }

  for(var i=0; i<qtdStones; ++i){
    stones[i].frames = 2;
    stones[i].index = getRandomInt(0, 2);
    stones[i].time = getRandomInt(10, 200);
    stones[i].auxTime = 0;
  }

  for(var i=0; i<qtdObjects; ++i){
    var imgObj = new Image();
    imgObj.src = objects[i].img;
    objects[i].img = imgObj;
  }

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
    b.kills = a[i].kills;
    b.deaths = a[i].deaths;
    b.walking = a[i].walking;
    b.indexY = a[i].indexY;
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
    b.owner = a[i].owner;
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

  updateSprites();
  printWorld();
  printPlayers();
  printEssences();
  printStones();
  printObjects();

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
    var p = players[i];
    if (p != undefined){
      ctx.drawImage(char_img, p.index*p.width, p.indexY*p.height, p.width, p.height, p.x, p.y, p.width, p.height);
      //ctx.fillStyle = 'blue';
      //var nickX = p.x+(p.width/2)-(ctx.measureText(p.nickname).width/2),
      //    nickY = p.y-5;
      //ctx.fillText(p.nickname, nickX, nickY);
    }
  }
}

//show the stones on map
function printStones(){
  for (var j=0; j<qtdStones; ++j){
    var s = stones[j];
    ctx.drawImage(stone_img, s.index*s.width, 0, s.width, s.height, s.x, s.y, s.width, s.height);
  }
}

//show the essences on map
function printEssences(){
  for (var i=0; i<qtdEssences; ++i){
    var e = essences[i];
    ctx.drawImage(essence_img, e.index*e.width, 0, e.width, e.height, e.x, e.y, e.width, e.height);
  }
}

//show the objects on map
function printObjects(){
  for(var i=0; i<qtdObjects; ++i){
    var o = objects[i];
    ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
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
  ctx.fillText(myScore, 830, 505);
  ctx.fillText(myKills, 830, 520);
  ctx.fillText(myDeaths, 830, 535);

  //global score
  ctx.fillText(topScore1, 20, 30);
  ctx.fillText(topScore2, 20, 45);
  ctx.fillText(topScore3, 20, 60);
}

//calculate the personal and global score
function calculateScore(){
  for (var i=0; i<qtdPlayers; ++i){

    //personal score
    if (players[i] != undefined && players[i].socket == id){
      myScore = 'essences: '+players[i].qtdEssences;
      myKills = 'kills: '+players[i].kills;
      myDeaths = 'deaths: '+players[i].deaths;
    }

    //global score
    players.sort(function(a, b){
      return b.kills - a.kills;
    });

    if (players[0] != undefined) topScore1 = '#1 '+players[0].nickname+': '+players[0].kills+' / '+players[0].deaths+' ('+players[0].qtdEssences+')';
    if (players[1] != undefined) topScore2 = '#2 '+players[1].nickname+': '+players[1].kills+' / '+players[1].deaths+' ('+players[1].qtdEssences+')';
    if (players[2] != undefined) topScore3 = '#3 '+players[2].nickname+': '+players[2].kills+' / '+players[2].deaths+' ('+players[2].qtdEssences+')';

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

//Sprite Sheet
function updateSprites(){
  for(var i=0; i<qtdPlayers; ++i){
    if(players[i] != undefined && players[i].walking) players[i] = updateSprite(players[i]);
    else if(players[i] != undefined) players[i].index = 0;
  }

  for(var i=0; i<qtdEssences; ++i){
    essences[i] = updateSprite(essences[i]);
  }

  for(var i=0; i<qtdStones; ++i){
    stones[i] = updateSprite(stones[i]);
  }
}
function updateSprite(obj){
  obj.auxTime += 1;
    
  if (obj.auxTime > obj.time){
    obj.auxTime = 0;

    if (obj.index+1 < obj.frames){
      obj.index += 1;
    } else {
      obj.index = 0;
    }
  }

  return obj;
}

//random number between min and max
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}