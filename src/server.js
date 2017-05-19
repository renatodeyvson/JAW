/******************************************************************************
*                                   Setup                                     *
******************************************************************************/

//Imports
var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

//Router
app.use(express.static(__dirname + '/client'));

//Listen
var ip = process.env.IP || '127.0.0.1';
var port = process.env.PORT || 3000;
http.listen(port, ip, function(){
  console.log('on %s:%d', ip, port);
});

/******************************************************************************
*                                  Globals                                    *
******************************************************************************/

//Players
var ids = [],
    players = [],
    qtdPlayers = 0;

//Chat
var chatHis = [ '', '', '', ''],
    chatHisColor = [ 'black', 'black', 'black', 'black'];

//Inputs
var key = [];

/******************************************************************************
*                                Socket.io                                    *
******************************************************************************/

//When connected
io.on('connection', function(socket){

  //Prepare key listener
  key[qtdPlayers] = [];

  //Save player's data
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

  //Put log
  chatPut('[*] user \''+players[qtdPlayers].nickname+'\' connected', 'green');

  ++qtdPlayers;

  //Send chat history
  chatSend();

  //Input down
  socket.on('keydown', function(msg){
    var id = ids[socket.id];
    key[id][msg] = true;
  });

  //Input up
  socket.on('keyup', function(msg){
    var id = ids[socket.id];
    key[id][msg] = false;
  });

  //Chat
  socket.on('chat push', function(msg){

    var id = ids[socket.id];

    //\Command
    if (msg.substring(0, 1) == '\\'){

      //Nickname config
      if(msg.substring(1, 5) == 'nick' && msg.substring(6, msg.length) != ''){
        players[id].nickname = msg.substring(6, 26);
        chatPut('[*] user \''+players[id].nickname+'\' connected', 'green');
      }

    }
    //Normal message
    else if (msg != '') chatPut('['+players[id].nickname+'] '+msg, 'black');

    //Send chat history
    chatSend();

  });

  //Ending
  socket.on('disconnect', function(){

    var id = ids[socket.id];

    //The current player will be the reference of the last player connected
    ids[players[qtdPlayers-1].socket] = id;
    players[id] = players[qtdPlayers-1];

    //When a new player connect, the last player will be overwritten
    --qtdPlayers;

    //Put log
    chatPut('[*] user \''+players[id].nickname+'\' disconnected', 'red');

    //Send chat history
    chatSend();

  });

});

//Main function
function loop(){
  inputs();
  io.emit('att', { players: players, qtdPlayers: qtdPlayers});
}

//Infinit loop
setInterval(loop, 15);

/******************************************************************************
*                                   Aux                                       *
******************************************************************************/

//Inputs
function inputs(){
  //For each player
  for (var i=0; i<qtdPlayers; ++i){
    //A
    if (key[i][65]){
      players[i].x -= players[i].velocity;
    }
    //D
    if (key[i][68]){
      players[i].x += players[i].velocity;
    }
    //S
    if (key[i][83]){
      players[i].y += players[i].velocity;
    }
    //W
    if (key[i][87]){
      players[i].y -= players[i].velocity;
    }
  }
}

//Adding a new message into chat history
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

function chatSend(){
  io.emit('chat listen', { msg: chatHis, color: chatHisColor});
}
