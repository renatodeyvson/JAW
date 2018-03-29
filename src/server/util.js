'use strict';

//execute the animation of the stones
const animateStones = (io, stones, numStones, mapSize) => {
    for (let j=0; j<numStones; ++j){

        if (stones[j].rangeUp > 0){
            stones[j].y -= stones[j].velocity;
            stones[j].rangeUp -= stones[j].velocity;
            if (stones[j].rangeUp <= 0){
                resetStone(io, stones, numStones, j, mapSize);
            }

            stonesSend(io, stones, numStones);
        }
        else if (stones[j].rangeDown > 0){
            stones[j].y += stones[j].velocity;
            stones[j].rangeDown -= stones[j].velocity;
            if (stones[j].rangeDown <= 0){
                resetStone(io, stones, numStones, j, mapSize);
            }

            stonesSend(io, stones, numStones);
        }
        if (stones[j].rangeLeft > 0){
            stones[j].x -= stones[j].velocity;
            stones[j].rangeLeft -= stones[j].velocity;
            if (stones[j].rangeLeft <= 0){
                resetStone(io, stones, numStones, j, mapSize);
            }

            stonesSend(io, stones, numStones);
        }
        else if (stones[j].rangeRigth > 0){
            stones[j].x += stones[j].velocity;
            stones[j].rangeRigth -= stones[j].velocity;
            if (stones[j].rangeRigth <= 0){
                resetStone(io, stones, numStones, j, mapSize);
            }

            stonesSend(io, stones, numStones);
        }

    }
};

//adding a new message into chat history
const chatPut = (msg, color, chatHis, chatHisColor) => {
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

    return { chatHis: chatHis, chatHisColor: chatHisColor };
};

//send messages
const chatSend = (io, chatHis, chatHisColor) => {
    io.emit('chat listen', { msg: chatHis, color: chatHisColor });
};

//check collision between two objects
const checkCollision = (obj1, obj2) => {
    if (obj1 != undefined && obj2 != undefined
        && obj1.x + obj1.width > obj2.x && obj1.x < obj2.x + obj2.width
        && obj1.y + obj1.height > obj2.y && obj1.y < obj2.y + obj2.height){
        return true;
    }
    return false;
};
  
//check collision between two objects "in the future" WOOOOWWW
const checkCollisionPredict = (obj1, obj2, direction) => {

    if(direction == 'LEFT'){
        if (obj1 != undefined && obj2 != undefined
            && obj1.x - obj1.velocity + obj1.width > obj2.x && obj1.x - obj1.velocity < obj2.x + obj2.width
            && obj1.y + obj1.height > obj2.y && obj1.y < obj2.y + obj2.height)
            return true;
    }
    else if(direction == 'RIGHT'){
        if (obj1 != undefined && obj2 != undefined
            && obj1.x + obj1.velocity + obj1.width > obj2.x && obj1.x + obj1.velocity < obj2.x + obj2.width
            && obj1.y + obj1.height > obj2.y && obj1.y < obj2.y + obj2.height)
            return true;
    }
    else if(direction == 'DOWN'){
        if (obj1 != undefined && obj2 != undefined
            && obj1.x + obj1.width > obj2.x && obj1.x < obj2.x + obj2.width
            && obj1.y + obj1.velocity + obj1.height > obj2.y && obj1.y + obj1.velocity < obj2.y + obj2.height)
            return true;
    }
    else if(direction == 'UP'){
        if (obj1 != undefined && obj2 != undefined
            && obj1.x + obj1.width > obj2.x && obj1.x < obj2.x + obj2.width
            && obj1.y - obj1.velocity + obj1.height > obj2.y && obj1.y - obj1.velocity < obj2.y + obj2.height)
            return true;
    }

    return false;
};

//send essences
const essencesSend = (io, essences, numEssences) => {
    io.emit('essences listen', { numEssences: numEssences, essences: essences.map((a) => {
        let b = {};
        b.x = a.x;
        b.y = a.y;
        return b;
    })});
};

//random number between min and max
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};

//check collision between a object and all the others
const objectsCollision = (obj1, objects, numObjects) => {
    for(let i=0; i<numObjects; ++i){
        if(checkCollision(obj1, objects[i])) return true;
    }

    return false;
};

//check "future" collision between a object and all the others
const objectsCollisionPredict = (obj1, direction, objects, numObjects) => {
    for(let i=0; i<numObjects; ++i){
        if(checkCollisionPredict(obj1, objects[i], direction)) return true;
    }

    return false;
};

//send players
const playersSend = (io, players, numPlayers) => {
    io.emit('players listen', { numPlayers: numPlayers, players: players.map((a) => {
        let b = {};
        b.socket = a.socket;
        b.nickname = a.nickname;
        b.x = a.x;
        b.y = a.y;
        b.numEssences = a.numEssences;
        b.stone = a.stone;
        b.kills = a.kills;
        b.deaths = a.deaths;
        b.walking = a.walking;
        b.indexY = a.indexY;
        return b;
    })});
};

//set the stone state to default
const resetStone = (io, stones, numStones, stone, mapSize, fatal) => {
    stones[stone].onGround = true;
    stones[stone].owner = -1;
    stones[stone].rangeLeft = 0;
    stones[stone].rangeRigth = 0;
    stones[stone].rangeDown = 0;
    stones[stone].rangeUp = 0;
    if(stones[stone].x < -mapSize || stones[stone].y < -mapSize || stones[stone].x > mapSize || stones[stone].y > mapSize || fatal){
        stones[stone].x = getRandomInt(-mapSize, mapSize);
        stones[stone].y = getRandomInt(-mapSize, mapSize);
    }
    stonesSend(io, stones, numStones);
};

//set the stone state to shoot
const shoot = (io, player, direction, players, numPlayers, stones, numStones) => {
    let stone = players[player].stone;

    if (direction == 'UP' || direction == 'UPLEFT' || direction == 'UPRIGHT'){
        stones[stone].y -= stones[stone].height;
        stones[stone].rangeUp = 200;
    }
    else if (direction == 'DOWN' || direction == 'DOWNLEFT' || direction == 'DOWNRIGHT'){
        stones[stone].y += players[player].height;
        stones[stone].rangeDown = 200;
    }
    if (direction == 'LEFT' || direction == 'UPLEFT' || direction == 'DOWNLEFT'){
        stones[stone].x -= stones[stone].height;
        stones[stone].rangeLeft = 200;
    }
    else if (direction == 'RIGHT' || direction == 'UPRIGHT' || direction == 'DOWNRIGHT'){
        stones[stone].x += players[player].width;
        stones[stone].rangeRigth = 200;
    }

    players[player].stone = -1;

    stonesSend(io, stones, numStones);
    playersSend(io, players, numPlayers);
};

//send stones
const stonesSend = (io, stones, numStones) => {
    io.emit('stones listen', { numStones: numStones, stones: stones.map((a) => {
        let b = {};
        b.x = a.x;
        b.y = a.y;
        b.onGround = a.onGround;
        b.owner = a.owner;
        return b;
    })});
};

//exports
exports.animateStones = animateStones;
exports.chatPut = chatPut;
exports.chatSend = chatSend;
exports.checkCollision = checkCollision;
exports.checkCollisionPredict = checkCollisionPredict;
exports.essencesSend = essencesSend;
exports.getRandomInt = getRandomInt;
exports.objectsCollision = objectsCollision;
exports.objectsCollisionPredict = objectsCollisionPredict;
exports.playersSend = playersSend;
exports.resetStone = resetStone;
exports.shoot = shoot;
exports.stonesSend = stonesSend;