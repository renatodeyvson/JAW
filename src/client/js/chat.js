//Globals
var chatHis = [ '', '', '', ''],
    chatHisColor = [ 'black', 'black', 'black', 'black'],
    command = '';

//Socket.io
socket.on('chat listen', function(params){
  chatHis = params.msg;
  chatHisColor = params.color;
});

//Prompt
function attChat(){
  ctx.fillStyle = chatHisColor[0];
  ctx.fillText(chatHis[0], 10, 470);
  ctx.fillStyle = chatHisColor[1];
  ctx.fillText(chatHis[1], 10, 490);
  ctx.fillStyle = chatHisColor[2];
  ctx.fillText(chatHis[2], 10, 510);
  ctx.fillStyle = chatHisColor[3];
  ctx.fillText(chatHis[3], 10, 530);
  if (prompt) ctx.fillStyle = 'blue';
  else ctx.fillStyle = 'black';
  ctx.fillText('> '+command, 2, 550);
}

//Inputs
function inputs(){

  //Enter
  if (key[13]){
    key[13] = false;
    prompt = !prompt;

    if (!prompt){
      socket.emit('chat push', command);
      command = '';
    }

  }

  if (prompt){

    //Backspace
    if (key[8]){
      command = command.substring(0, command.length-1);
      key[8] = false;
    }

    if(command.length < 50){
      //a~z
      for(var i=65; i<=90; ++i){
        if (!key[18]) addCommand(i);
      }

      //0~9
      for(var i=49; i<=57; ++i){
        if (!key[16]) addCommand(i);
      }

      //Space
      addCommand(32);

      //','
      if (key[188]){
        command = command+',';
        key[188] = false;
      }

      //'.'
      if (key[190]){
        command = command+'.';
        key[190] = false;
      }

      //'?'
      if (key[18] && key [87]){
        command = command+'?';
        key[87] = false;
      }

      //'!'
      if (key[16] && key [49]){
        command = command+'!';
        key[49] = false;
      }

      //\Command
      if (key[226]){
        command = command+'\\';
        key[226] = false;
      }
    }

  }
}

/******************************************************************************
*                                   Aux                                       *
******************************************************************************/

//Write the key in the prompt
function addCommand(code){
  if (key[code]){
    if (key[16]) command = command+String.fromCharCode(code)
    else command = command+String.fromCharCode(code).toLowerCase();
    key[code] = false;
  }
}
