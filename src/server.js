'use strict';

/******************************************************************************
*                                  globals                                    *
******************************************************************************/

//imports
const express = require('express');
const app = express();
const http = require('http').Server(app);
const initialize = require('./server/initialize')();
const inputs = require('./server/inputs');
const util = require('./server/util');
const io = require('socket.io')(http);

//listen
const port = process.env.PORT || 3000;

//map
const mapSize = initialize.mapSize;
const safeSize = initialize.safeSize;

//chat
let chatHis = initialize.chatHis;
let chatHisColor = initialize.chatHisColor;

//imputs
let key = initialize.key;

//essences
let essences = initialize.essences;
let numEssences = initialize.numEssences;

//objects
let objects = initialize.objects;
let numObjects = initialize.numObjects;

//players
let ids = initialize.ids;
let players = initialize.players;
let numPlayers = initialize.numPlayers;

//stones
let stones = initialize.stones;
let numStones = initialize.numStones;

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
    key[numPlayers] = [];

    //save player's data
    ids[socket.id] = numPlayers;
    players[numPlayers] = {
        socket: socket.id,
        nickname: 'anonymous',
        x: -18,
        y: -18,
        width: 36,
        height: 36,
        velocity: 5,
        numEssences: 0,
        kills: 0,
        deaths: 0,
        stone: -1,
        walking: false,
        indexY: 0,
        direction: 'RIGHT'
    };

    //put log
    const chatUpdate = util.chatPut('['+players[numPlayers].nickname+'] connected', 'green', chatHis, chatHisColor);
    chatHis = chatUpdate.chatHis;
    chatHisColor = chatUpdate.chatHisColor;

    ++numPlayers;

    //send chat history
    util.chatSend(io, chatHis, chatHisColor);

    //send player id and atual state
    socket.emit('id', { id: socket.id });
    io.emit('start', {
        players: players,
        numPlayers: numPlayers,
        essences: essences,
        numEssences: numEssences,
        stones: stones,
        numStones: numStones,
        objects: objects.map((a) => {
            let b = {};
            b.x = a.rX;
            b.y = a.rY;
            b.width = a.rWidth;
            b.height = a.rHeight;
            b.img = '../img/object/'+a.obj+'.png';
            return b;
        }),
        numObjects: numObjects
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

                util.playersSend(io, players, numPlayers);
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
        if (players[id].stone > -1) util.resetStone(io, stones, numStones, players[id].stone, mapSize);

        //the current player will be the reference of the last player connected
        ids[players[numPlayers-1].socket] = id;
        players[id] = players[numPlayers-1];

        //when a new player connect, the last player will be overwritten
        --numPlayers;

        //put log
        const chatUpdate = util.chatPut('['+players[id].nickname+'] disconnected', 'red', chatHis, chatHisColor);
        chatHis = chatUpdate.chatHis;
        chatHisColor = chatUpdate.chatHisColor;

        //send chat history
        util.chatSend(io, chatHis, chatHisColor);

        util.playersSend(io, players, numPlayers);
    });

});

/******************************************************************************
*                                   main                                      *
******************************************************************************/

//main function
const loop = () => {
    inputs(io, key, players, numPlayers, stones, numStones, objects, numObjects, mapSize);
    util.animateStones(io, stones, numStones, mapSize);

    for(let i=0; i<numStones; ++i){
        if(util.objectsCollision(stones[i], objects, numObjects)) util.resetStone(io, stones, numStones, i, mapSize, true);
    }

    for (let i=0; i<numPlayers; ++i){

        //collision between player and essence
        for (let j=0; j<numEssences;++j){
            if (util.checkCollision(players[i], essences[j])){
                players[i].numEssences += 1;
                if(players[i].velocity < 6) players[i].velocity += 0.1; 
                essences[j].x = util.getRandomInt(-mapSize, mapSize);
                essences[j].y = util.getRandomInt(-mapSize, mapSize);

                util.playersSend(io, players, numPlayers);
                util.essencesSend(io, essences, numEssences);
            }
        }

        for (let j=0; j<numStones;++j){

            //collision between player and stone (pick)
            if (util.checkCollision(players[i], stones[j]) && players[i].stone < 0 && stones[j].onGround){
                players[i].stone = j;
                stones[j].onGround = false;
                stones[j].owner = i;
                stones[j].x = players[i].x;
                stones[j].y = players[i].y;

                util.playersSend(io, players, numPlayers);
                util.stonesSend(io, stones, numStones);
            }

            //collision between player and stone (shoot)
            if (util.checkCollision(players[i], stones[j]) && !stones[j].onGround
                && players[i].stone != j && (players[i].x > safeSize || players[i].y > safeSize
                || players[i].x+players[i].width < -safeSize || players[i].y+players[i].height < -safeSize)){

                if (players[i].stone > -1){
                    stones[players[i].stone].onGround = true;

                    util.stonesSend(io, stones, numStones);
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
                    numEssences: 0,
                    kills: players[i].kills,
                    deaths: players[i].deaths+1,
                    stone: -1,
                    walking: false,
                    indexY: 0,
                    direction: 'RIGHT'
                };

                util.playersSend(io, players, numPlayers);
            }

        }

    }
};

//infinit loop
setInterval(loop, 15);