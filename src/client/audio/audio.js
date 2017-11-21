myAudio = new Audio('audio/lula_jaw.mpeg'); 
myAudio.addEventListener('ended', function() {
    this.currentTime = 0;
    this.play();
}, false);
myAudio.play();