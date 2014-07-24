
var states = Object.freeze({
   SplashScreen: 0,
   GameScreen: 1,
   ScoreScreen: 2,
   CountScreen: 3
});

var currentstate;

var origwidth = 358.0;
var origheight = 142.0;

var pipeheight = 350;
var pipewidth = 52;
var pipes = new Array();

//sounds
var volume = 100;
var soundJump = new buzz.sound("assets/sounds/sfx_wing.ogg");
var soundScore = new buzz.sound("assets/sounds/sfx_point.ogg");
var soundHit = new buzz.sound("assets/sounds/sfx_hit.ogg");
var soundDie = new buzz.sound("assets/sounds/sfx_die.ogg");
var soundSwoosh = new buzz.sound("assets/sounds/sfx_swooshing.ogg");
var hungry = new buzz.sound("assets/sounds/_3_m4a.mp3");
var bgm = new buzz.sound("assets/sounds/ringtone (1).mp3");
var soundGo = new buzz.sound("assets/sounds/go.wav");
buzz.all().setVolume(volume);

//loops1
var loopGameloop;
var loopPipeloop;

$(document).ready(function() {
   //start with the splash screen
   showSplash();
});

function showSplash()
{
   currentstate = states.SplashScreen;

   //update the player in preparation for the next game
   $("#player").css({ y: 0, x: 0});
   updatePlayer($("#player"));
   $("#player1").css({ y: 0, x: 0});
   updatePlayer($("#player1"));
   $("#player2").css({ y: 0, x: 0});
   updatePlayer($("#player2"));
	 
   soundSwoosh.stop();
   soundSwoosh.play();

   //clear out all the pipes if there are any
   $(".pipe").remove();
   pipes = new Array();

   //make everything animated again
   $(".animated").css('animation-play-state', 'running');
   $(".animated").css('-webkit-animation-play-state', 'running');

   //fade in the splash
   $("#splash").transition({ opacity: 1 }, 2000, 'ease');
}

function startGame()
{
   currentstate = states.GameScreen;

   //start up our loops
   var updaterate = 1000.0 / 60.0 ; //60 times a second
   loopGameloop = setInterval(gameloop, updaterate);
   loopPipeloop = setInterval(updatePipes, 5000);
}

function updatePlayer(player)
{

   //console.dir(player);
   //console.log("position="+player.selector);
  
   if(player.selector === "#player1") 
   {
   	$(player).css({ left: 60, width: origwidth, height: origheight});
   }
   else if(player.selector === "#player2") 
   {
   	$(player).css({ left: 60, width: origwidth, height: origheight});
   }
   else {
   	$(player).css({ left: 60, width: origwidth, height: origheight});
   }
}

function gameloop() {
   var player = $("#player");

   //update the player
   updatePlayer(player);

   //create the bounding box
   var box = document.getElementById('player').getBoundingClientRect();

   var boxwidth = origwidth;
   var boxheight = (origheight + box.height) / 2;
   var boxleft = ((box.width - boxwidth) / 2) + box.left;
   var boxtop = ((box.height - boxheight) / 2) + box.top;
   var boxright = boxleft + boxwidth;
   var boxbottom = boxtop + boxheight;

   //we can't go any further without a pipe
   if(pipes[0] == null)
      return;

   //determine the bounding box of the next pipes inner area
   var nextpipe = pipes[0];
   var nextpipeupper = nextpipe.children(".pipe_upper");

   var pipetop = nextpipeupper.offset().top + nextpipeupper.height() +25;
   var pipeleft = nextpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
   var piperight = pipeleft + pipewidth;
   var pipebottom = pipetop + pipeheight -50;

   //have we gotten inside the pipe yet?
   if(boxright > pipeleft)
   {
      //we're within the pipe, have we passed between upper and lower pipes?
      if(boxtop > pipetop && boxbottom < pipebottom)
      {
         //yeah! we're within bounds
      }
      else
      {
         //no! we touched the pipe
         playerDead();
         return;
      }
   }

}

/*
//Handle space bar
$(document).keydown(function(e){
   //space bar!
   if(e.keyCode == 32)
   {
      //in ScoreScreen, hitting space should click the "replay" button. else it's just a regular spacebar hit
      if(currentstate != states.ScoreScreen)
         screenClick();
   }
});*/

var OldGX = 0;
var OldGY = 0;
var OldGZ = 0;
window.addEventListener("devicemotion",
    function handleMotionEvent(event){
      var x = event.accelerationIncludingGravity.x;
      var y = event.accelerationIncludingGravity.y;
      var z = event.accelerationIncludingGravity.z;
      if(currentstate == states.ScoreScreen)
        return;

      if( OldGX != 0 || OldGY != 0 || OldGZ != 0){
        var vDiffX = x - OldGX;
        var vDiffY = y - OldGY;
        var vDiffZ = z - OldGZ;
        var vAbs = Math.sqrt(vDiffX * vDiffX + vDiffY * vDiffY + vDiffZ * vDiffZ);
        if(vAbs > 3.0){
          screenClick();
        }
      }

      OldGX = x;
      OldGY = y;
      OldGZ = z;
   }, true);


//Handle mouse down OR touch start
if("ontouchstart" in window)
   $(document).on("touchstart", screenClick);
else
   $(document).on("mousedown", screenClick);

function screenClick()
{
   var count = 0;
   if(currentstate == states.GameScreen)
   {
      playerJump();
   }
   else if(currentstate == states.SplashScreen)
   {
      currentstate = states.CountScreen;
      $("#splash").stop();
      $("#splash").transition({ opacity: 0 }, 500, 'ease');

      var stop=window.setInterval(function(){
         count++;
         console.log(count);
         soundHit.play();

         if(count==2){
            console.log('stop');
            window.clearInterval(stop);
            count=0;
          }
      }, 1000);

      $("#countdown").countdown360({
         radius      : 60,
         seconds     : 3,
         fontColor   : '#FFFFFF',
         autostart   : false,
      	 onComplete  : function () { 
           $("#countdown").hide();
           $("#goicon").show();
           soundGo.play();

           setTimeout(function() {
             $("#goicon").hide();
	     startGame();
           }, 1000);
         }
      }).start();
   }
}

function playerJump()
{
   //play jump sound
   soundJump.stop();
   soundJump.play();

   $(".animated").css('animation-play-state', 'running');
   $(".animated").css('-webkit-animation-play-state', 'running');
   setTimeout(function() { 
     $(".animated").css('animation-play-state', 'paused');
     $(".animated").css('-webkit-animation-play-state', 'paused');
   }, 2000);

}

function playerDead()
{
   //stop animating everything!
   $(".animated").css('animation-play-state', 'paused');
   $(".animated").css('-webkit-animation-play-state', 'paused');

   //it's time to change states. as of now we're considered ScoreScreen to disable left click/flying
   currentstate = states.ScoreScreen;

   //destroy our gameloops
   clearInterval(loopGameloop);
   clearInterval(loopPipeloop);
   loopGameloop = null;
   loopPipeloop = null;

   //mobile browsers don't support buzz bindOnce event
   if(isIncompatible.any())
   {
      //skip right to showing score
      showScore();
   }
   else
   {
      //play the hit sound (then the dead sound) and then show score
      soundHit.play().bindOnce("ended", function() {
         soundDie.play().bindOnce("ended", function() {
            showScore();
         });
      });
   }
}

function showScore()
{
   //unhide us
   $("#scoreboard").css("display", "block");

   //SWOOSH!
   soundSwoosh.stop();
   soundSwoosh.play();

   //show the scoreboard
   $("#scoreboard").css({ y: '40px', opacity: 0 }); //move it down so we can slide it up
   $("#scoreboard").transition({ y: '0px', opacity: 1}, 600, 'ease', function() {
      soundSwoosh.stop();
      soundSwoosh.play();
   });

}

function updatePipes()
{
   clearInterval(loopPipeloop);

   var topheight = 380;
   var newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height: ' + topheight + 'px;"></div></div>');
   $("#flyarea").append(newpipe);
   pipes.push(newpipe);
}


var isIncompatible = {
   Android: function() {
   return navigator.userAgent.match(/Android/i);
   },
   BlackBerry: function() {
   return navigator.userAgent.match(/BlackBerry/i);
   },
   iOS: function() {
   return navigator.userAgent.match(/iPhone|iPad|iPod/i);
   },
   Opera: function() {
   return navigator.userAgent.match(/Opera Mini/i);
   },
   Safari: function() {
   return (navigator.userAgent.match(/OS X.*Safari/) && ! navigator.userAgent.match(/Chrome/));
   },
   Windows: function() {
   return navigator.userAgent.match(/IEMobile/i);
   },
   any: function() {
   return (isIncompatible.Android() || isIncompatible.BlackBerry() || isIncompatible.iOS() || isIncompatible.Opera() || isIncompatible.Safari() || isIncompatible.Windows());
   }
};
