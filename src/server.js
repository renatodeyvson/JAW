//Imports
var express = require('express'),
    app = express(),
    http = require('http').Server(app),
    io = require('socket.io')(http);

//Router
app.use(express.static(__dirname + '/client'));

//Socket.io
io.on('connection', function(socket){
  socket.on('test', function(msg){
    socket.emit('test', '.'+msg);
  });
});

//Listen
var ip = process.env.OPENSHIFT_NODEJS_IP || process.env.IP || '127.0.0.1';
var port = process.env.OPENSHIFT_NODEJS_PORT || process.env.PORT || 3000;
http.listen(port, ip, function(){
  console.log('on %s:%d', ip, port);
});
