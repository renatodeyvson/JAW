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
var ip = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;
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
var chatHis = [ '', '', '', ''];

//Inputs
var key = [];

/******************************************************************************
*                                Socket.io                                    *
******************************************************************************/

//When connected
io.on('connection', function(socket){

  //Send chat history
  socket.emit('chat listen', chatHis);

  //Prepare key listener
  key[qtdPlayers] = [];

  //Save player's data
  ids[socket.id] = qtdPlayers;
  players[qtdPlayers] = {
    socket: socket.id,
    nickname: '?'
  };

  ++qtdPlayers;

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
      if(msg.substring(1, 5) == 'nick'){
        players[id].nickname = msg.substring(6, msg.length);
        if (players[id].nickname != '') chatPut('[*] user \''+players[id].nickname+'\' connected');
      }

    }
    //Normal message
    else chatPut('['+players[id].nickname+'] '+msg);

    //Update chat
    socket.emit('chat listen', chatHis);
    socket.broadcast.emit('chat listen', chatHis);

  });

  //Ending
  socket.on('disconnect', function(){

    var id = ids[socket.id];

    //The current player will be the reference of the last player connected
    ids[players[qtdPlayers-1].socket] = id;
    players[id].socket = players[qtdPlayers-1].socket;

    //When a new player connect, the last player will be overwritten
    --qtdPlayers;

  });

});

//Main function
function loop(){
  inputs();
  io.emit('att');
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

  }
}

//Adding a new message into chat history
function chatPut(msg){
  chatHis[0] = chatHis[1];
  chatHis[1] = chatHis[2];
  chatHis[2] = chatHis[3];
  chatHis[3] = msg;
}
