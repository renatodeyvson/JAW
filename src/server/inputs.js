'use strict';

//imports
const util = require('../server/util');

module.exports = (io, key, players, qtdPlayers, stones, qtdStones, objects, qtdObjects, mapSize) => {
    //for each player
    for (let i=0; i<qtdPlayers; ++i){
        //a
        if (key[i][65]){
            if (players[i].x - players[i].velocity > -mapSize && !util.objectsCollisionPredict(players[i], 'LEFT', objects, qtdObjects)){
                players[i].x -= players[i].velocity;
                players[i].walking = true;
                players[i].indexY = 1;
                players[i].direction = 'LEFT';

                util.playersSend(io, players, qtdPlayers);
                if (players[i].stone > -1){
                    stones[players[i].stone].x -= players[i].velocity;

                    util.stonesSend(io, stones, qtdStones);
                }
            }
        }
        //d
        if (key[i][68]){
            if (players[i].x + players[i].velocity + players[i].width < mapSize && !util.objectsCollisionPredict(players[i], 'RIGHT', objects, qtdObjects)){
                players[i].x += players[i].velocity;
                players[i].walking = true;
                players[i].indexY = 0;
                players[i].direction = 'RIGHT';

                util.playersSend(io, players, qtdPlayers);
                if (players[i].stone > -1){
                    stones[players[i].stone].x += players[i].velocity;

                    util.stonesSend(io, stones, qtdStones);
                }
            }
        }
        //s
        if (key[i][83]){
            if (players[i].y - players[i].velocity + players[i].height < mapSize && !util.objectsCollisionPredict(players[i], 'DOWN', objects, qtdObjects)){
                players[i].y += players[i].velocity;
                players[i].walking = true;
                players[i].direction = 'DOWN';

                util.playersSend(io, players, qtdPlayers);
                if (players[i].stone > -1){
                    stones[players[i].stone].y += players[i].velocity;

                    util.stonesSend(io, stones, qtdStones);
                }
            }
        }
        //w
        if (key[i][87]){
            if (players[i].y - players[i].velocity > -mapSize && !util.objectsCollisionPredict(players[i], 'UP', objects, qtdObjects)){
                players[i].y -= players[i].velocity;
                players[i].walking = true;
                players[i].direction = 'UP';

                util.playersSend(io, players, qtdPlayers);
                if (players[i].stone > -1){
                    stones[players[i].stone].y -= players[i].velocity;

                    util.stonesSend(io, stones, qtdStones);
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
            util.playersSend(io, players, qtdPlayers);
        }
        //p
        if(key[i][80] && players[i].stone > -1){
            util.shoot(io, i, players[i].direction, players, qtdPlayers, stones, qtdStones);
            key[i][80] = false;
        }
    }
}