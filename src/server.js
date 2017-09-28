/******************************************************************************
*                                   setup                                     *
******************************************************************************/

//imports
var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

//router
app.use(express.static(__dirname + '/client'));

//listen
var port = process.env.PORT || 3000;
http.listen(port, function(){
  console.log('port: %d', port);
});

/******************************************************************************
*                                  globals                                    *
******************************************************************************/

//map
var mapSize = 1000,
    safeSize = 100;

//players
var ids = [],
    players = [],
    qtdPlayers = 0;

//essences
var essences = [],
    qtdEssences = 100;

//stones
var stones = [],
    qtdStones = 30;

//objects
var objects = [],
    qtdObjects = 5;

//chat
var chatHis = [ '', '', '', ''],
    chatHisColor = [ 'black', 'black', 'black', 'black'];

//inputs
var key = [];

/******************************************************************************
*                                   start                                     *
******************************************************************************/

//essences
for (var i=0; i<qtdEssences; ++i){
  essences[i] = {
    x: getRandomInt(-mapSize, mapSize),
    y: getRandomInt(-mapSize, mapSize),
    width: 20,
    height: 20
  }
}

//stones
for (var i=0; i<qtdStones; ++i){
  stones[i] = {
    x: getRandomInt(-mapSize, mapSize),
    y: getRandomInt(-mapSize, mapSize),
    width: 48,
    height: 48,
    velocity: 10,
    onGround: true,
    rangeUp: 0,
    rangeDown: 0,
    rangeLeft: 0,
    rangeRigth: 0,
    owner: -1,
  }
}

//objects
objects[0] = {
  x: -500,
  y: -500,
  width: 144,
  height: 96,
  rX: -500-68,
  rY: -500-304,
  rWidth: 300,
  rHeight: 400,
  obj: 'tree'
}
objects[1] = {
  x: 200,
  y: -300,
  width: 144,
  height: 96,
  rX: 200-68,
  rY: -300-304,
  rWidth: 300,
  rHeight: 400,
  obj: 'tree'
}
objects[2] = {
  x: -250,
  y: -50,
  width: 144,
  height: 96,
  rX: -250-68,
  rY: -50-304,
  rWidth: 300,
  rHeight: 400,
  obj: 'tree'
}
objects[3] = {
  x: 400,
  y: 400,
  width: 144,
  height: 96,
  rX: 400-68,
  rY: 400-304,
  rWidth: 300,
  rHeight: 400,
  obj: 'tree'
}
objects[4] = {
  x: -600,
  y: 600,
  width: 144,
  height: 96,
  rX: -600-68,
  rY: 600-304,
  rWidth: 300,
  rHeight: 400,
  obj: 'tree'
}

/******************************************************************************
*                                socket.io                                    *
******************************************************************************/

//when connected
io.on('connection', function(socket){

  //prepare key listener
  key[qtdPlayers] = [];

  //save player's data
  ids[socket.id] = qtdPlayers;
  players[qtdPlayers] = {
    socket: socket.id,
    nickname: 'anonymous',
    x: -24,
    y: -36,
    width: 48,
    height: 72,
    velocity: 5,
    qtdEssences: 0,
    kills: 0,
    deaths: 0,
    stone: -1,
    walking: false,
    indexY: 0,
    direction: 'RIGHT'
  };

  //put log
  chatPut('['+players[qtdPlayers].nickname+'] connected', 'green');

  ++qtdPlayers;

  //send chat history
  chatSend();

  //send player id and atual state
  socket.emit('id', { id: socket.id });
  io.emit('start', {
    players: players,
    qtdPlayers: qtdPlayers,
    essences: essences,
    qtdEssences: qtdEssences,
    stones: stones,
    qtdStones: qtdStones,
    objects: objects.map(function(a){
      var b = {};
      b.x = a.rX;
      b.y = a.rY;
      b.width = a.rWidth;
      b.height = a.rHeight;
      b.img = '../img/object/'+a.obj+'.png';
      return b;
    }),
    qtdObjects: qtdObjects
  });

  //input down
  socket.on('keydown', function(msg){
    var id = ids[socket.id];
    key[id][msg] = true;
  });

  //input up
  socket.on('keyup', function(msg){
    var id = ids[socket.id];
    key[id][msg] = false;
  });

  //chat
  socket.on('chat push', function(msg){

    var id = ids[socket.id];

    //?command
    if (msg.substring(0, 1) == '?'){

      //nickname config
      if(msg.substring(1, msg.length) != ''){
        players[id].nickname = msg.substring(1, 16);
        chatPut('['+players[id].nickname+'] connected', 'green');
        playersSend();
      }

    }
    //normal message
    else if (msg != '') chatPut('['+players[id].nickname+'] '+msg, 'black');

    //send chat history
    chatSend();

  });

  //ending
  socket.on('disconnect', function(){

    var id = ids[socket.id];

    //reset stone
    if (players[id].stone > -1) resetStone(players[id].stone);

    //the current player will be the reference of the last player connected
    ids[players[qtdPlayers-1].socket] = id;
    players[id] = players[qtdPlayers-1];

    //when a new player connect, the last player will be overwritten
    --qtdPlayers;

    //put log
    chatPut('['+players[id].nickname+'] disconnected', 'red');

    //send chat history
    chatSend();

    playersSend();
  });

});

//main function
function loop(){
  inputs();
  animateStones();

  for(var i=0; i<qtdStones; ++i){
    if(objectsCollision(stones[i])) resetStone(i, true);
  }

  for (var i=0; i<qtdPlayers; ++i){

    //collision between player and essence
    for (var j=0; j<qtdEssences;++j){
      if (checkCollision(players[i], essences[j])){
        players[i].qtdEssences += 1;
        essences[j].x = getRandomInt(-mapSize, mapSize);
        essences[j].y = getRandomInt(-mapSize, mapSize);

        playersSend();
        essencesSend();
      }
    }

    for (var j=0; j<qtdStones;++j){

      //collision between player and stone (pick)
      if (checkCollision(players[i], stones[j]) && players[i].stone < 0 && stones[j].onGround){
         players[i].stone = j;
         stones[j].onGround = false;
         stones[j].owner = i;
         stones[j].x = players[i].x;
         stones[j].y = players[i].y;

         playersSend();
         stonesSend();
       }

       //collision between player and stone (shoot)
      if (checkCollision(players[i], stones[j]) && !stones[j].onGround
        && players[i].stone != j && (players[i].x > safeSize || players[i].y > safeSize
        || players[i].x+players[i].width < -safeSize || players[i].y+players[i].height < -safeSize)){

        if (players[i].stone > -1){
          stones[players[i].stone].onGround = true;

          stonesSend();
        }
        players[stones[j].owner].kills += 1;
        players[i] = {
          socket: players[i].socket,
          nickname: players[i].nickname,
          x: -players[i].width/2,
          y: -players[i].height/2,
          width: players[i].width,
          height: players[i].height,
          velocity: players[i].velocity,
          qtdEssences: 0,
          kills: players[i].kills,
          deaths: players[i].deaths+1,
          stone: -1,
          walking: false,
          indexY: 0,
          direction: 'RIGHT'
        }

        playersSend();
      }

    }

  }
}

//infinit loop
setInterval(loop, 15);

/******************************************************************************
*                                   aux                                       *
******************************************************************************/

//inputs
function inputs(){
  //for each player
  for (var i=0; i<qtdPlayers; ++i){
    //a
    if (key[i][65]){
      if (players[i].x - players[i].velocity > -mapSize && !objectsCollisionPredict(players[i], 'LEFT')){
        players[i].x -= players[i].velocity;
        players[i].walking = true;
        players[i].indexY = 1;
        players[i].direction = 'LEFT';
        
        playersSend();
        if (players[i].stone > -1){
          stones[players[i].stone].x -= players[i].velocity;

          stonesSend();
        }
      }
    }
    //d
    if (key[i][68]){
      if (players[i].x + players[i].velocity + players[i].width < mapSize && !objectsCollisionPredict(players[i], 'RIGHT')){
        players[i].x += players[i].velocity;
        players[i].walking = true;
        players[i].indexY = 0;
        players[i].direction = 'RIGHT';

        playersSend();
        if (players[i].stone > -1){
          stones[players[i].stone].x += players[i].velocity;

          stonesSend();
        }
      }
    }
    //s
    if (key[i][83]){
      if (players[i].y - players[i].velocity + players[i].height < mapSize && !objectsCollisionPredict(players[i], 'DOWN')){
        players[i].y += players[i].velocity;
        players[i].walking = true;
        players[i].direction = 'DOWN';

        playersSend();
        if (players[i].stone > -1){
          stones[players[i].stone].y += players[i].velocity;

          stonesSend();
        }
      }
    }
    //w
    if (key[i][87]){
      if (players[i].y - players[i].velocity > -mapSize && !objectsCollisionPredict(players[i], 'UP')){
        players[i].y -= players[i].velocity;
        players[i].walking = true;
        players[i].direction = 'UP';

        playersSend();
        if (players[i].stone > -1){
          stones[players[i].stone].y -= players[i].velocity;

          stonesSend();
        }
      }
    }
    //w and d
    if(key[i][87] && key[i][68]){
      players[i].direction = 'UPRIGHT';
    }
    //w and a
    if(key[i][87] && key[i][65]){
      players[i].direction = 'UPLEFT';
    }
    //s and d
    if(key[i][83] && key[i][68]){
      players[i].direction = 'DOWNRIGHT';
    }
    //s and a
    if(key[i][83] && key[i][65]){
      players[i].direction = 'DOWNLEFT';
    }
    //static
    if (!key[i][65] && !key[i][68] && !key[i][83] && !key[i][87] && players[i].walking) {
      players[i].walking = false;
      playersSend();
    }
    //p
    if(key[i][80] && players[i].stone > -1){
      shoot(i, players[i].direction);
      key[i][80] = false;
    }
  }
}

//adding a new message into chat history
function chatPut(msg, color){
  if (msg.length <= 50){
    chatHis[0] = chatHis[1];
    chatHis[1] = chatHis[2];
    chatHis[2] = chatHis[3];
    chatHis[3] = msg;

    chatHisColor[0] = chatHisColor[1];
    chatHisColor[1] = chatHisColor[2];
    chatHisColor[2] = chatHisColor[3];
    chatHisColor[3] = color;
  }
}

//send messages
function chatSend(){
  io.emit('chat listen', { msg: chatHis, color: chatHisColor});
}

//send players
function playersSend(){
  io.emit('players listen', { qtdPlayers: qtdPlayers, players: players.map(function(a){
    var b = {};
    b.socket = a.socket;
    b.nickname = a.nickname;
    b.x = a.x;
    b.y = a.y;
    b.qtdEssences = a.qtdEssences;
    b.stone = a.stone;
    b.kills = a.kills;
    b.deaths = a.deaths;
    b.walking = a.walking;
    b.indexY = a.indexY;
    return b;
  })});
}

//send stones
function stonesSend(){
  io.emit('stones listen', { qtdStones: qtdStones, stones: stones.map(function(a){
    var b = {};
    b.x = a.x;
    b.y = a.y;
    b.onGround = a.onGround;
    b.owner = a.owner;
    return b;
  })});
}

//send essences
function essencesSend(){
  io.emit('essences listen', { qtdEssences: qtdEssences, essences: essences.map(function(a) {
    var b = {};
    b.x = a.x;
    b.y = a.y;
    return b;
  })});
}

//random number between min and max
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

//check collision between two objects
function checkCollision(obj1, obj2){
  if (obj1 != undefined && obj2 != undefined
    && obj1.x + obj1.width > obj2.x && obj1.x < obj2.x + obj2.width
    && obj1.y + obj1.height > obj2.y && obj1.y < obj2.y + obj2.height){
    return true;
  }
  return false;
}

//check collision between a object and all the others
function objectsCollision(obj1){
  for(var i=0; i<qtdObjects; ++i){
    if(checkCollision(obj1, objects[i])) return true;
  }

  return false;
}

//check "future" collision between a object and all the others
function objectsCollisionPredict(obj1, direction){
  for(var i=0; i<qtdObjects; ++i){
    if(checkCollisionPredict(obj1, objects[i], direction)) return true;
  }

  return false;
}

//check collision between two objects "in the future" WOOOOWWW
function checkCollisionPredict(obj1, obj2, direction){

  if(direction == 'LEFT'){
    if (obj1 != undefined && obj2 != undefined
      && obj1.x - obj1.velocity + obj1.width > obj2.x && obj1.x - obj1.velocity < obj2.x + obj2.width
      && obj1.y + obj1.height > obj2.y && obj1.y < obj2.y + obj2.height){
      return true;
    }
  }
  else if(direction == 'RIGHT'){
    if (obj1 != undefined && obj2 != undefined
      && obj1.x + obj1.velocity + obj1.width > obj2.x && obj1.x + obj1.velocity < obj2.x + obj2.width
      && obj1.y + obj1.height > obj2.y && obj1.y < obj2.y + obj2.height){
      return true;
    }
  }
  else if(direction == 'DOWN'){
    if (obj1 != undefined && obj2 != undefined
      && obj1.x + obj1.width > obj2.x && obj1.x < obj2.x + obj2.width
      && obj1.y + obj1.velocity + obj1.height > obj2.y && obj1.y + obj1.velocity < obj2.y + obj2.height){
      return true;
    }
  }
  else if(direction == 'UP'){
    if (obj1 != undefined && obj2 != undefined
      && obj1.x + obj1.width > obj2.x && obj1.x < obj2.x + obj2.width
      && obj1.y - obj1.velocity + obj1.height > obj2.y && obj1.y - obj1.velocity < obj2.y + obj2.height){
      return true;
    }
  }

  return false;
}

//execute the animation of the stones
function animateStones(){
  for (var j=0; j<qtdStones; ++j){

    if (stones[j].rangeUp > 0){
      stones[j].y -= stones[j].velocity;
      stones[j].rangeUp -= stones[j].velocity;
      if (stones[j].rangeUp <= 0){
        resetStone(j);
      }

      stonesSend();
    }
    else if (stones[j].rangeDown > 0){
      stones[j].y += stones[j].velocity;
      stones[j].rangeDown -= stones[j].velocity;
      if (stones[j].rangeDown <= 0){
        resetStone(j);
      }

      stonesSend();
    }
    if (stones[j].rangeLeft > 0){
      stones[j].x -= stones[j].velocity;
      stones[j].rangeLeft -= stones[j].velocity;
      if (stones[j].rangeLeft <= 0){
        resetStone(j);
      }

      stonesSend();
    }
    else if (stones[j].rangeRigth > 0){
      stones[j].x += stones[j].velocity;
      stones[j].rangeRigth -= stones[j].velocity;
      if (stones[j].rangeRigth <= 0){
        resetStone(j);
      }

      stonesSend();
    }

  }
}

//set the stone state to default
function resetStone(stone, fatal){
  stones[stone].onGround = true;
  stones[stone].owner = -1;
  stones[stone].rangeLeft = 0;
  stones[stone].rangeRigth = 0;
  stones[stone].rangeDown = 0;
  stones[stone].rangeUp = 0;
  if(stones[stone].x < -mapSize || stones[stone].y < -mapSize || stones[stone].x > mapSize || stones[stone].y > mapSize || fatal){
    stones[stone].x = getRandomInt(-mapSize, mapSize);
    stones[stone].y = getRandomInt(-mapSize, mapSize);
  }
  stonesSend();
}

//set the stone state to shoot
function shoot(player, direction){
  var stone = players[player].stone;

  if (direction == 'UP' || direction == 'UPLEFT' || direction == 'UPRIGHT'){
     stones[stone].y -= stones[stone].height;
     stones[stone].rangeUp = 200;
  }
  else if (direction == 'DOWN' || direction == 'DOWNLEFT' || direction == 'DOWNRIGHT'){
    stones[stone].y += players[player].height;
    stones[stone].rangeDown = 200;
  }
  if (direction == 'LEFT' || direction == 'UPLEFT' || direction == 'DOWNLEFT'){
    stones[stone].x -= stones[stone].height;
    stones[stone].rangeLeft = 200;
  }
  else if (direction == 'RIGHT' || direction == 'UPRIGHT' || direction == 'DOWNRIGHT'){
    stones[stone].x += players[player].width;
    stones[stone].rangeRigth = 200;
  }

  players[player].stone = -1;

  stonesSend();
  playersSend();
}
