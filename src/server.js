'use strict';

/******************************************************************************
*                                  globals                                    *
******************************************************************************/

const

//imports
express = require('express'),
app = express(),
http = require('http').Server(app),
io = require('socket.io')(http),
util = require('./server/util'),
inputs = require('./server/inputs'),
initialize = require('./server/initialize')(),

//listen
port = process.env.PORT || 3000,

//map
mapSize = initialize.mapSize,
safeSize = initialize.safeSize;

let

//players
ids = initialize.ids,
players = initialize.players,
qtdPlayers = initialize.qtdPlayers,

//essences
essences = initialize.essences,
qtdEssences = initialize.qtdEssences,

//stones
stones = initialize.stones,
qtdStones = initialize.qtdStones,

//objects
objects = initialize.objects,
qtdObjects = initialize.qtdObjects,

//chat
chatHis = initialize.chatHis,
chatHisColor = initialize.chatHisColor,

//inputs
key = initialize.key;

/******************************************************************************
*                                   setup                                     *
******************************************************************************/

//router
app.use(express.static(__dirname + '/client'));

//listen
http.listen(port, () => {
    console.log('server is running on port %d', port);
});

/******************************************************************************
*                                socket.io                                    *
******************************************************************************/

//when connected
io.on('connection', (socket) => {

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
        velocity: 4,
        qtdEssences: 0,
        kills: 0,
        deaths: 0,
        stone: -1,
        walking: false,
        indexY: 0,
        direction: 'RIGHT'
    };

    //put log
    const chatUpdate = util.chatPut('['+players[qtdPlayers].nickname+'] connected', 'green', chatHis, chatHisColor);
    chatHis = chatUpdate.chatHis;
    chatHisColor = chatUpdate.chatHisColor;

    ++qtdPlayers;

    //send chat history
    util.chatSend(io, chatHis, chatHisColor);

    //send player id and atual state
    socket.emit('id', { id: socket.id });
    io.emit('start', {
        players: players,
        qtdPlayers: qtdPlayers,
        essences: essences,
        qtdEssences: qtdEssences,
        stones: stones,
        qtdStones: qtdStones,
        objects: objects.map((a) => {
            let b = {};
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
    socket.on('keydown', (msg) => {
        let id = ids[socket.id];
        key[id][msg] = true;
    });

    //input up
    socket.on('keyup', (msg) => {
        let id = ids[socket.id];
        key[id][msg] = false;
    });

    //chat
    socket.on('chat push', (msg) => {

        let id = ids[socket.id];

        //?command
        if (msg.substring(0, 1) == '?'){

            //nickname config
            if(msg.substring(1, msg.length) != ''){
                players[id].nickname = msg.substring(1, 16);

                const chatUpdate = util.chatPut('['+players[id].nickname+'] connected', 'green', chatHis, chatHisColor);
                chatHis = chatUpdate.chatHis;
                chatHisColor = chatUpdate.chatHisColor;

                util.playersSend(io, players, qtdPlayers);
            }

        }
        //normal message
        else if (msg != ''){
            const chatUpdate = util.chatPut('['+players[id].nickname+'] '+msg, 'black', chatHis, chatHisColor);
            chatHis = chatUpdate.chatHis;
            chatHisColor = chatUpdate.chatHisColor;
        }

        //send chat history
        util.chatSend(io, chatHis, chatHisColor);

    });

    //ending
    socket.on('disconnect', () => {

        let id = ids[socket.id];

        //reset stone
        if (players[id].stone > -1) resetStone(io, stones, qtdStones, players[id].stone, mapSize);

        //the current player will be the reference of the last player connected
        ids[players[qtdPlayers-1].socket] = id;
        players[id] = players[qtdPlayers-1];

        //when a new player connect, the last player will be overwritten
        --qtdPlayers;

        //put log
        const chatUpdate = util.chatPut('['+players[id].nickname+'] disconnected', 'red', chatHis, chatHisColor);
        chatHis = chatUpdate.chatHis;
        chatHisColor = chatUpdate.chatHisColor;

        //send chat history
        util.chatSend(io, chatHis, chatHisColor);

        util.playersSend(io, players, qtdPlayers);
    });

});

/******************************************************************************
*                                   main                                      *
******************************************************************************/

//main function
const loop = () => {
    inputs(io, key, players, qtdPlayers, stones, qtdStones, objects, qtdObjects, mapSize);
    util.animateStones(io, stones, qtdStones, mapSize);

    for(let i=0; i<qtdStones; ++i){
        if(util.objectsCollision(stones[i], objects, qtdObjects)) util.resetStone(io, stones, qtdStones, i, mapSize, true);
    }

    for (let i=0; i<qtdPlayers; ++i){

        //collision between player and essence
        for (let j=0; j<qtdEssences;++j){
            if (util.checkCollision(players[i], essences[j])){
                players[i].qtdEssences += 1;
                if(players[i].velocity < 6) players[i].velocity += 0.1; 
                essences[j].x = util.getRandomInt(-mapSize, mapSize);
                essences[j].y = util.getRandomInt(-mapSize, mapSize);

                util.playersSend(io, players, qtdPlayers);
                util.essencesSend(io, essences, qtdEssences);
            }
        }

        for (let j=0; j<qtdStones;++j){

            //collision between player and stone (pick)
            if (util.checkCollision(players[i], stones[j]) && players[i].stone < 0 && stones[j].onGround){
                players[i].stone = j;
                stones[j].onGround = false;
                stones[j].owner = i;
                stones[j].x = players[i].x;
                stones[j].y = players[i].y;

                util.playersSend(io, players, qtdPlayers);
                util.stonesSend(io, stones, qtdStones);
            }

            //collision between player and stone (shoot)
            if (util.checkCollision(players[i], stones[j]) && !stones[j].onGround
                && players[i].stone != j && (players[i].x > safeSize || players[i].y > safeSize
                || players[i].x+players[i].width < -safeSize || players[i].y+players[i].height < -safeSize)){

                if (players[i].stone > -1){
                    stones[players[i].stone].onGround = true;

                    util.stonesSend(io, stones, qtdStones);
                }
                players[stones[j].owner].kills += 1;
                players[i] = {
                    socket: players[i].socket,
                    nickname: players[i].nickname,
                    x: -players[i].width/2,
                    y: -players[i].height/2,
                    width: players[i].width,
                    height: players[i].height,
                    velocity: 4,
                    qtdEssences: 0,
                    kills: players[i].kills,
                    deaths: players[i].deaths+1,
                    stone: -1,
                    walking: false,
                    indexY: 0,
                    direction: 'RIGHT'
                }

                util.playersSend(io, players, qtdPlayers);
            }

        }

    }
}

//infinit loop
setInterval(loop, 15);