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
var mapSize = 1000;

//players
var ids = [],
    players = [],
    qtdPlayers = 0;

//essences
var essences = [],
    qtdEssences = 100;

//stones
var stones = [],
    qtdStones = 100;

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
    width: 10,
    height: 10
  }
}

//stones
for (var i=0; i<qtdStones; ++i){
  stones[i] = {
    x: getRandomInt(-mapSize, mapSize),
    y: getRandomInt(-mapSize, mapSize),
    width: 50,
    height: 50,
    velocity: 10,
    onGround: true,
    rangeUp: 0,
    rangeDown: 0,
    rangeLeft: 0,
    rangeRigth: 0
  }
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
    x: 0,
    y: 0,
    width: 48,
    height: 72,
    velocity: 5,
    qtdEssences: 0,
    stone: -1
  };

  //send player id
  socket.emit('id', socket.id);

  //put log
  chatPut('[*] user \''+players[qtdPlayers].nickname+'\' connected', 'green');

  ++qtdPlayers;

  //send chat history
  chatSend();

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

    //\command
    if (msg.substring(0, 1) == '\\'){

      //nickname config
      if(msg.substring(1, 5) == 'nick' && msg.substring(6, msg.length) != ''){
        players[id].nickname = msg.substring(6, 26);
        chatPut('[*] user \''+players[id].nickname+'\' connected', 'green');
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

    //the current player will be the reference of the last player connected
    ids[players[qtdPlayers-1].socket] = id;
    players[id] = players[qtdPlayers-1];

    //when a new player connect, the last player will be overwritten
    --qtdPlayers;

    //put log
    chatPut('[*] user \''+players[id].nickname+'\' disconnected', 'red');

    //send chat history
    chatSend();

  });

});

//main function
function loop(){
  inputs();
  animateStones();

  for (var i=0; i<qtdPlayers; ++i){

    //collision between player and essence
    for (var j=0; j<qtdEssences;++j){
      if (checkCollision(players[i], essences[j])){
        players[i].qtdEssences += 1;
        essences[j].x = getRandomInt(-mapSize, mapSize);
        essences[j].y = getRandomInt(-mapSize, mapSize);
      }
    }

    for (var j=0; j<qtdStones;++j){

      //collision between player and stone (pick)
      if (checkCollision(players[i], stones[j]) && players[i].stone < 0 && stones[j].onGround){
         players[i].stone = j;
         stones[j].onGround = false;
         stones[j].x = players[i].x;
         stones[j].y = players[i].y;
       }

       //collision between player and stone (shoot)
       if (checkCollision(players[i], stones[j]) && !stones[j].onGround && players[i].stone != j){
        if (players[i].stone > -1) stones[players[i].stone].onGround = true;
        players[i] = {
            socket: players[i].socket,
            nickname: players[i].nickname,
            x: 0,
           y: 0,
            width: players[i].width,
            height: players[i].height,
           velocity: players[i].velocity,
           qtdEssences: 0,
           stone: -1
          }
        }

    }

  }

  

  io.emit('att', {
    players: players,
    qtdPlayers: qtdPlayers,
    essences: essences,
    qtdEssences: qtdEssences,
    stones: stones,
    qtdStones: qtdStones
  });
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
      if (players[i].x - players[i].velocity > -mapSize){
        players[i].x -= players[i].velocity;
        if (players[i].stone > -1) stones[players[i].stone].x -= players[i].velocity;
      }
    }
    //d
    if (key[i][68]){
      if (players[i].x + players[i].velocity + players[i].width < mapSize){
        players[i].x += players[i].velocity;
        if (players[i].stone > -1) stones[players[i].stone].x += players[i].velocity;
      }
    }
    //s
    if (key[i][83]){
      if (players[i].y - players[i].velocity + players[i].height < mapSize){
        players[i].y += players[i].velocity;
        if (players[i].stone > -1) stones[players[i].stone].y += players[i].velocity;
      }
    }
    //w
    if (key[i][87]){
      if (players[i].y - players[i].velocity > -mapSize){
        players[i].y -= players[i].velocity;
        if (players[i].stone > -1) stones[players[i].stone].y -= players[i].velocity;
      }
    }
    //i
    if (key[i][73] && players[i].stone > -1){
      shoot(i, 'UP');
      key[i][73] = false;
    }
    //j
    if (key[i][74] && players[i].stone > -1){
      shoot(i, 'LEFT');
      key[i][74] = false;
    }
    //k
    if (key[i][75] && players[i].stone > -1){
      shoot(i, 'DOWN');
      key[i][75] = false;
    }
    //l
    if (key[i][76] && players[i].stone > -1){
      shoot(i, 'RIGTH');
      key[i][76] = false;
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

//throw animation of the stones
function animateStones(){
  for (var i=0; i<qtdStones; ++i){

    if (stones[i].rangeUp > 0){
      stones[i].y -= stones[i].velocity;
      stones[i].rangeUp -= stones[i].velocity;
      if (stones[i].rangeUp <= 0){
        resetStone(i);
      }
    }
    else if (stones[i].rangeDown > 0){
      stones[i].y += stones[i].velocity;
      stones[i].rangeDown -= stones[i].velocity;
      if (stones[i].rangeDown <= 0){
        resetStone(i);
      }
    }
    else if (stones[i].rangeLeft > 0){
      stones[i].x -= stones[i].velocity;
      stones[i].rangeLeft -= stones[i].velocity;
      if (stones[i].rangeLeft <= 0){
        resetStone(i);
      }
    }
    else if (stones[i].rangeRigth > 0){
      stones[i].x += stones[i].velocity;
      stones[i].rangeRigth -= stones[i].velocity;
      if (stones[i].rangeRigth <= 0){
        resetStone(i);
      }
    }

  }
}

//
function resetStone(stone){
  stones[stone].onGround = true;
}

//set the stone state to shoot
function shoot(player, direction){
  var stone = players[player].stone;

  if (direction == 'UP'){
     stones[stone].y -= stones[stone].height;
     stones[stone].rangeUp = 300;
  }
  else if (direction == 'LEFT'){
    stones[stone].x -= stones[stone].height;
    stones[stone].rangeLeft = 300;
  }
  else if (direction == 'DOWN'){
    stones[stone].y += players[player].height;
    stones[stone].rangeDown = 300;
  }
  else if (direction == 'RIGTH'){
    stones[stone].x += players[player].width;
    stones[stone].rangeRigth = 300;
  }

  players[player].stone = -1;
}