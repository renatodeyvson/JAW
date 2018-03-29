'use strict';

/******************************************************************************
*                                  globals                                    *
******************************************************************************/

const canvas = document.getElementById('canvasid');
const socket = io();

//chat
let chatHis = [ '', '', '', ''];
let chatHisColor = [ 'black', 'black', 'black', 'black'];
let command = '';

//config
let ctx = canvas.getContext('2d');

//game state
let myDeaths = 0;
let myKills = 0;
let myScore = 0;
let essences = [];
let numEssences = 0;
let objects = [];
let numObjects = 0;
let id = '';
let players = [];
let numPlayers = 0;
let stones = [];
let numStones = 0;
let topScore1 = '';
let topScore2 = '';
let topScore3 = '';

//globals
let key = [];
let prompt = false;
let showTutorial = true;

//images
let char_img = new Image();
let essence_img = new Image();
let stone_img = new Image();
let world_img = new Image();

/******************************************************************************
*                                   setup                                     *
******************************************************************************/

//animation frame
window.requestAnimFrame = (() => {
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            window.msRequestAnimationFrame     ||
            (callback => {
                window.setTimeout(callback, 1000/60);
            });
})();

//font
ctx.font = 'bold 15px Courier';

//images
char_img.src = '../img/char/l.png';
essence_img.src = '../img/essence/gold_thing.png';
stone_img.src = '../img/stone/pumpkin.png';
world_img.src = '../img/world/map.png';

//input Listener
window.addEventListener('keydown', (e) => {
    key[e.keyCode] = true;
    showTutorial = false;
    if (!prompt) socket.emit('keydown', e.keyCode);
});
window.addEventListener('keyup', (e) => {
    key[e.keyCode] = false;
    if (!prompt) socket.emit('keyup', e.keyCode);
});

/******************************************************************************
*                                   aux                                       *
******************************************************************************/

//render the game on screen
const render = () => {

    cameraFollowStart();

    updateSprites();
    printWorld();
    printPlayers();
    printEssences();
    printStones();
    printObjects();

    cameraFollowStop();

    inputs();
    printnumPlayers();
    calculateScore();
    printScore();
    if(showTutorial) printTutorial();
    attChat();

    window.requestAnimFrame(render);

};

//show the tutorial on screen
const printTutorial = () => {
    ctx.fillStyle = 'white';
    ctx.font = 'bold 30px Courier';
    ctx.fillText('move with \'w\' \'a\' \'s\' \'d\'', 250, 460);
    ctx.fillText('shoot with \'p\'', 350, 490);
    //ctx.fillText('change your name with \'n\'', 250, 520);
    ctx.font = 'bold 15px Courier';
};

//show the world on map (clean the screen)
const printWorld = () => {
    ctx.drawImage(world_img, -1500, -1500);
};

//show the players on map
const printPlayers = () => {
    for (let i=0; i<numPlayers; ++i){
        let p = players[i];
        if (p != undefined){
        ctx.drawImage(char_img, p.index*p.width, p.indexY*p.height, p.width, p.height, p.x, p.y, p.width, p.height);
            /*ctx.fillStyle = 'blue';
            let nickX = p.x+(p.width/2)-(ctx.measureText(p.nickname).width/2),
                nickY = p.y-5;
            ctx.fillText(p.nickname, nickX, nickY);*/
        }
    }
};

//show the stones on map
const printStones = () => {
    for (let j=0; j<numStones; ++j){
        let s = stones[j];
        ctx.drawImage(stone_img, s.index*s.width, 0, s.width, s.height, s.x, s.y, s.width, s.height);
    }
};

//show the essences on map
const printEssences = () => {
    for (let i=0; i<numEssences; ++i){
        let e = essences[i];
        ctx.drawImage(essence_img, e.index*e.width, 0, e.width, e.height, e.x, e.y, e.width, e.height);
    }
};

//show the objects on map
const printObjects = () => {
    for(let i=0; i<numObjects; ++i){
        let o = objects[i];
        ctx.drawImage(o.img, o.x, o.y, o.width, o.height);
    }
};

//show qtd of players on screen
const printnumPlayers = () => {
    ctx.fillText('online: '+numPlayers, 830, 30);
};

//show the score on screen
const printScore = () => {
    //global score
    ctx.fillText(topScore1, 20, 30);
    ctx.fillText(topScore2, 20, 45);
    ctx.fillText(topScore3, 20, 60);

    //personal score
    ctx.fillStyle = 'black';
    ctx.fillText(myScore, 830, 505);
    ctx.fillText(myKills, 830, 520);
    ctx.fillText(myDeaths, 830, 535);
};

//calculate the global and personal score
const calculateScore = () => {
    for (let i=0; i<numPlayers; ++i){

        //global score
        players.sort((a, b) => {
            return b.kills - a.kills;
        });

        if (players[0] != undefined) topScore1 = '#1 '+players[0].nickname+': '+players[0].kills+' / '+players[0].deaths+' ('+players[0].numEssences+')';
        else topScore1 = '';
        if (players[1] != undefined && numPlayers > 1) topScore2 = '#2 '+players[1].nickname+': '+players[1].kills+' / '+players[1].deaths+' ('+players[1].numEssences+')';
        else topScore2 = '';
        if (players[2] != undefined && numPlayers > 2) topScore3 = '#3 '+players[2].nickname+': '+players[2].kills+' / '+players[2].deaths+' ('+players[2].numEssences+')';
        else topScore3 = '';

        //personal score
        if (players[i] != undefined && players[i].socket == id){
            myScore = 'essences: '+players[i].numEssences;
            myKills = 'kills: '+players[i].kills;
            myDeaths = 'deaths: '+players[i].deaths;
        }

    }
};

//translate camera
const cameraFollowStart = () => {
    for (let i=0; i<numPlayers; ++i){
        if (players[i] != undefined && players[i].socket == id){
            ctx.save();
            ctx.translate(-players[i].x + 480 - (players[i].width/2),
                -players[i].y + 280 - (players[i].height/2));
        }
    }
};
const cameraFollowStop = () => {
    ctx.restore();
};

//Sprite Sheet
const updateSprite = (obj) => {
    obj.auxTime += 1;
        
    if (obj.auxTime > obj.time){
        obj.auxTime = 0;

        if (obj.index+1 < obj.frames){
            obj.index += 1;
        } else {
            obj.index = 0;
        }
    }

    return obj;
};
const updateSprites = () => {
    for(let i=0; i<numPlayers; ++i){
        if(players[i] != undefined && players[i].walking) players[i] = updateSprite(players[i]);
        else if(players[i] != undefined) players[i].index = 0;
    }

    for(let i=0; i<numEssences; ++i){
        essences[i] = updateSprite(essences[i]);
    }

    for(let i=0; i<numStones; ++i){
        stones[i] = updateSprite(stones[i]);
    }
};

//random number between min and max
const getRandomInt = (min, max) => {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
};

//write the key in the prompt
const addCommand = (code) => {
    if (key[code]){
        command = command+String.fromCharCode(code).toLowerCase();
        key[code] = false;
    }
};

//prompt
const attChat = () => {
    ctx.fillStyle = chatHisColor[0];
    ctx.fillText(chatHis[0], 20, 470);
    ctx.fillStyle = chatHisColor[1];
    ctx.fillText(chatHis[1], 20, 490);
    ctx.fillStyle = chatHisColor[2];
    ctx.fillText(chatHis[2], 20, 510);
    ctx.fillStyle = chatHisColor[3];
    ctx.fillText(chatHis[3], 20, 530);
    if (prompt) ctx.fillStyle = 'blue';
    else ctx.fillStyle = 'black';
    ctx.fillText('> '+command, 5, 550);
};

//inputs
const inputs = () => {

    //enter
    if (key[13]){
        key[13] = false;
        prompt = !prompt;

        if (!prompt){
            socket.emit('chat push', command);
            command = '';
        }

    }

    if (prompt){

        //backspace
        if (key[8]){
            command = command.substring(0, command.length-1);
            key[8] = false;
        }

        if(command.length < 50){
            //a~z
            for(let i=65; i<=90; ++i){
                addCommand(i);
            }

            //space
            addCommand(32);

            //'?'
            if (key[18] && key[87] || key[16] && key[193]){
                command = command+'?';
                key[87] = false;
                key[193] = false;
            }
        }

    } else {
        //n
        if(key[78]){
            key[78] = false;
            prompt = true;
            command = '?';
        }
    }

};

/******************************************************************************
*                                socket.io                                    *
******************************************************************************/

socket.on('chat listen', (params) => {
    chatHis = params.msg;
    chatHisColor = params.color;
});

socket.on('id', (params) => {
    id = params.id;
});

socket.on('start', (params) => {
    players = params.players;
    numPlayers = params.numPlayers;
    essences = params.essences;
    numEssences = params.numEssences;
    stones = params.stones;
    numStones = params.numStones;
    objects = params.objects;
    numObjects = params.numObjects;

    for(let i=0; i<numPlayers; ++i){
        players[i].frames = 4;
        players[i].index = 0;
        players[i].time = 4;
        players[i].auxTime = 0;
    }

    for(let i=0; i<numEssences; ++i){
        essences[i].frames = 3;
        essences[i].index = getRandomInt(0, 3);
        essences[i].time = 10;
        essences[i].auxTime = 0;
    }

    for(let i=0; i<numStones; ++i){
        stones[i].frames = 2;
        stones[i].index = getRandomInt(0, 2);
        stones[i].time = getRandomInt(10, 200);
        stones[i].auxTime = 0;
    }

    for(let i=0; i<numObjects; ++i){
        let imgObj = new Image();
        imgObj.src = objects[i].img;
        objects[i].img = imgObj;
    }

    render();
});

socket.on('essences listen', (params) => {
    numEssences = params.numEssences;

    let a = params.essences;
    essences = essences.map((b, i) => {
        b.x = a[i].x;
        b.y = a[i].y;
        return b;
    });
});

socket.on('players listen', (params) => {
    numPlayers = params.numPlayers;

    let a = params.players;
    players = players.map((b, i) => {
        b.socket = a[i].socket;
        b.nickname = a[i].nickname;
        b.x = a[i].x;
        b.y = a[i].y;
        b.numEssences = a[i].numEssences;
        b.stone = a[i].stone;
        b.kills = a[i].kills;
        b.deaths = a[i].deaths;
        b.walking = a[i].walking;
        b.indexY = a[i].indexY;
        return b;
    });
});

socket.on('stones listen', (params) => {
    numStones = params.numStones;

    let a = params.stones;
    stones = stones.map((b, i) => {
        b.x = a[i].x;
        b.y = a[i].y;
        b.onGround = a[i].onGround;
        b.owner = a[i].owner;
        return b;
    });
});