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

//players
var ids = [],
    players = [],
    qtdPlayers = 0;

//essences
var essences = [],
    qtdEssences = 1000;

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
    x: getRandomInt(-4000, 4000),
    y: getRandomInt(-4000, 4000),
    width: 100,
    height: 100
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
    width: 50,
    height: 75,
    velocity: 5,
    qtdEssences: 0
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

  for (var i=0; i<qtdPlayers; ++i){
    for (var j=0; j<qtdEssences;++j){
      if (checkCollision(players[i], essences[j])){
        players[i].qtdEssences += 1;
        essences[j].x = getRandomInt(-4000, 4000);
        essences[j].y = getRandomInt(-4000, 4000);
      }
    }
  }

  io.emit('att', {
    players: players,
    qtdPlayers: qtdPlayers,
    essences: essences,
    qtdEssences: qtdEssences
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
      if (players[i].x - players[i].velocity > -4000)
        players[i].x -= players[i].velocity;
    }
    //d
    if (key[i][68]){
      if (players[i].x + players[i].velocity < 4000)
        players[i].x += players[i].velocity;
    }
    //s
    if (key[i][83]){
      if (players[i].y - players[i].velocity < 4000)
        players[i].y += players[i].velocity;
    }
    //w
    if (key[i][87]){
      if (players[i].y - players[i].velocity > -4000)
        players[i].y -= players[i].velocity;
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

function checkCollision(obj1, obj2){
  if (obj1 != undefined && obj2 != undefined
    && obj1.x + obj1.width > obj2.x && obj1.x < obj2.x + obj2.width
    && obj1.y + obj1.height > obj2.y && obj1.y < obj2.y + obj2.height){
    return true;
  }
  return false;
}