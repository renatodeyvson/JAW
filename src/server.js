/******************************************************************************
*                                   Setup                                     *
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
*                                  Globals                                    *
******************************************************************************/

//players
var ids = [],
    players = [],
    qtdPlayers = 0;

//chat
var chatHis = [ '', '', '', ''],
    chatHisColor = [ 'black', 'black', 'black', 'black'];

//inputs
var key = [];

/******************************************************************************
*                                Socket.io                                    *
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
    x: 480,
    y: 280,
    width: 50,
    height: 75,
    velocity: 5
  };

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
  io.emit('att', { players: players, qtdPlayers: qtdPlayers});
}

//infinit loop
setInterval(loop, 15);

/******************************************************************************
*                                   Aux                                       *
******************************************************************************/

//inputs
function inputs(){
  //for each player
  for (var i=0; i<qtdPlayers; ++i){
    //a
    if (key[i][65]){
      players[i].x -= players[i].velocity;
    }
    //d
    if (key[i][68]){
      players[i].x += players[i].velocity;
    }
    //s
    if (key[i][83]){
      players[i].y += players[i].velocity;
    }
    //w
    if (key[i][87]){
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
