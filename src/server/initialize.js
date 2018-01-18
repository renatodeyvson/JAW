'use strict';

const

//imports
util = require('../server/util'),

//map
mapSize = 1000,
safeSize = 100;

let

//players
ids = [],
players = [],
qtdPlayers = 0,

//essences
essences = [],
qtdEssences = 5,

//stones
stones = [],
qtdStones = 10,

//objects
objects = [],
qtdObjects = 5,

//chat
chatHis = [ '', '', '', ''],
chatHisColor = [ 'black', 'black', 'black', 'black'],

//inputs
key = [];

module.exports = () => {
    //essences
    for (let i=0; i<qtdEssences; ++i){
        essences[i] = {
            x: util.getRandomInt(-mapSize, mapSize),
            y: util.getRandomInt(-mapSize, mapSize),
            width: 20,
            height: 20
        };
    }
    
    //stones
    for (let i=0; i<qtdStones; ++i){
        stones[i] = {
            x: util.getRandomInt(-mapSize, mapSize),
            y: util.getRandomInt(-mapSize, mapSize),
            width: 48,
            height: 48,
            velocity: 10,
            onGround: true,
            rangeUp: 0,
            rangeDown: 0,
            rangeLeft: 0,
            rangeRigth: 0,
            owner: -1,
        };
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
    };
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
    };
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
    };
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
    };
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
    };

    return {
        mapSize: mapSize,
        safeSize: safeSize,
        ids: ids,
        players: players,
        qtdPlayers: qtdPlayers,
        essences: essences,
        qtdEssences: qtdEssences,
        stones: stones,
        qtdStones: qtdStones,
        objects: objects,
        qtdObjects: qtdObjects,
        chatHis: chatHis,
        chatHisColor: chatHisColor,
        key: key
    };
}