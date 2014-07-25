
var states = Object.freeze({
   SplashScreen: 0,
   GameScreen: 1,
   ScoreScreen: 2,
   CountScreen: 3
});

var currentstate;
var currentNum;

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
var soundGo = new buzz.sound("assets/sounds/go.wav");
var carSound = new buzz.sound("assets/sounds/carSound.mp3");
var carSound1 = new buzz.sound("assets/sounds/carSound2.mp3");
var carSound2 = new buzz.sound("assets/sounds/peopleRun.mp3");
buzz.all().setVolume(volume);

//loops1
var loopGameloop;
var loopPipeloop;

var temp;
var arrive;

$(document).ready(function() {
   //get userName
   var arrParameter = [];
   arrParameter = parseParameter(document.URL);
   var userName = getParaValue(arrParameter,"userName");
   comLogin(userName, 0,function(num){
      console.log("num = " + num );
      currentNum = num;
   });

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
   $(".animated").css('animation-play-state', 'paused');
   $(".animated").css('-webkit-animation-play-state', 'paused');

   //fade in the splash
   $("#splash").transition({ opacity: 1 }, 2000, 'ease');
}

function startGame()
{
   currentstate = states.GameScreen;

   loopGameloop = setInterval(gameloop, 100);
   loopPipeloop = setInterval(updatePipes, 10000);
   comSetMoveCallback(updatePlayerPosition);
}

function updatePlayer(player)
{
   console.log('initial player position');
   //console.dir(player);
   //console.log("position="+player.selector);
  
   if(player.selector === "#player1") 
   {
   	$(player).css({ left: 0, width: origwidth, height: origheight});
   }
   else if(player.selector === "#player2") 
   {
   	$(player).css({ left: 0, width: origwidth, height: origheight});
   }
   else {
   	$(player).css({ left: 0, width: origwidth, height: origheight});
   }
}
function updatePlayerPosition(lanenum,position){
   console.log('update player position');
   // console.log(lanenum);
   console.log(position);

   var i = position.indexOf(Math.max.apply(Math, position));

   var maxposition = Math.max.apply(null, position);
   console.log(i);
   console.log(maxposition);


   if(maxposition<5){
      arrive = 100;
   } else if (maxposition>5 && maxposition < 15){
      arrive = 200;
   } else if(maxposition>15 && maxposition < 25) {
      arrive = 300;
   }

   temp = arrive/maxposition;



   if(i==0){
      $("#player").css({ left: arrive, width: origwidth, height: origheight});
      if((position[0]-position[1])>10){
         $("#player1").css({ left: -250, width: origwidth, height: origheight});
      } else {
         $("#player1").css({ left: temp*position[1]*0.7, width: origwidth, height: origheight});
      }
      if((position[0]-position[2])>10){
         $("#player2").css({ left: -250, width: origwidth, height: origheight});
      } else {
         $("#player2").css({ left: temp*position[2]*0.7, width: origwidth, height: origheight});
      }

   } else if (i==1){
      $("#player1").css({ left: arrive, width: origwidth, height: origheight});

      if((position[1]-position[0])>10){
         $("#player").css({ left: -250, width: origwidth, height: origheight});
      } else {
         $("#player").css({ left: temp*position[0]*0.7, width: origwidth, height: origheight});
      }
       if((position[1]-position[2])>10){
         $("#player2").css({ left: -250, width: origwidth, height: origheight});
      } else {
         $("#player2").css({ left: temp*position[2]*0.7, width: origwidth, height: origheight});
      }
   } else {
      $("#player2").css({ left: arrive, width: origwidth, height: origheight});

      if((position[2]-position[0])>10){
         $("#player").css({ left: -250, width: origwidth, height: origheight});
      } else {
         $("#player").css({ left: temp*position[0]*0.7, width: origwidth, height: origheight});
      }
       if((position[2]-position[1])>10){
         $("#player1").css({ left: -250, width: origwidth, height: origheight});
       } else {
         $("#player1").css({ left: temp*position[1]*0.7, width: origwidth, height: origheight});
      }
   }




   

}

function checkEnd(box) {
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


function gameloop() {
  var box;
  box = document.getElementById('player').getBoundingClientRect();
  checkEnd(box);
  box = document.getElementById('player1').getBoundingClientRect();
  checkEnd(box);
  box = document.getElementById('player2').getBoundingClientRect();
  checkEnd(box);
}


//Handle space bar
$(document).keydown(function(e){
   console.log("e.keyCode=" + e.keyCode);
   if( e.keyCode == 81)
   {
	playerJump(0);
   }
   else if( e.keyCode == 87)
   {
	playerJump(1);
   }
   else if( e.keyCode == 69)
   {
	playerJump(2);
   }
});

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
      playerJump(currentNum);
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
             comSetGoCallback();
	     startGame();
           }, 1000);

           comReady();
         }
      }).start();
   }
}

function playerJump(num)
{
   if( num == 0)
   {
   	//play jump sound
        comMove(1);
   	carSound.stop();
   	carSound.play();

   	$(".car").css('animation-play-state', 'running');
   	$(".car").css('-webkit-animation-play-state', 'running');
        if( currentstate == states.GameScreen )
	{
   	  $(".sky").css('animation-play-state', 'running');
   	  $(".sky").css('-webkit-animation-play-state', 'running');
	}
   	setTimeout(function() {
     	  $(".car").css('animation-play-state', 'paused');
     	  $(".car").css('-webkit-animation-play-state', 'paused');
	  if( currentstate == states.GameScreen )
       	  {
   	    $(".sky").css('animation-play-state', 'paused');
   	    $(".sky").css('-webkit-animation-play-state', 'paused');
	  }
   	}, 1000);
   }
   else if( num == 1 )
   {
        //play jump sound
        comMove(1);
   	carSound1.stop();
   	carSound1.play();

        $(".car1").css('animation-play-state', 'running');
        $(".car1").css('-webkit-animation-play-state', 'running');
        if( currentstate == states.GameScreen )
        {
   	  $(".sky").css('animation-play-state', 'running');
   	  $(".sky").css('-webkit-animation-play-state', 'running');
	}
        setTimeout(function() {
          $(".car1").css('animation-play-state', 'paused');
          $(".car1").css('-webkit-animation-play-state', 'paused');
	  if( currentstate == states.GameScreen )
          {
   	    $(".sky").css('animation-play-state', 'paused');
   	    $(".sky").css('-webkit-animation-play-state', 'paused');
	  }
        }, 1000);
   }
   else if( num == 2 )
   {
        //play jump sound
        comMove(1);
   	carSound2.stop();
   	carSound2.play();

        $(".car2").css('animation-play-state', 'running');
        $(".car2").css('-webkit-animation-play-state', 'running');
        if( currentstate == states.GameScreen )
        {
   	  $(".sky").css('animation-play-state', 'running');
   	  $(".sky").css('-webkit-animation-play-state', 'running');
	}
        setTimeout(function() {
          $(".car2").css('animation-play-state', 'paused');
          $(".car2").css('-webkit-animation-play-state', 'paused');
	  if( currentstate == states.GameScreen )
          {
   	    $(".sky").css('animation-play-state', 'paused');
   	    $(".sky").css('-webkit-animation-play-state', 'paused');
	  }
        }, 1000);
   }
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


   comSetGameOverCallback(
       function(result){
         console.log(result);
         //mobile browsers don't support buzz bindOnce event
         if(isIncompatible.any())
         {
            //skip right to showing score
            showScore(result);
         }
         else
         {
            //play the hit sound (then the dead sound) and then show score
            soundHit.play().bindOnce("ended", function() {
               soundDie.play().bindOnce("ended", function() {
                  showScore(result);
               });
            });
         }
       });
   comGameOver();
}

function showScore(result)
{
   var parmString = "";
   //alert(result.length);
   for (var i=0; i<result.length; i++) {
      //alert(result[i].name);
      if (i == result.length - 1) {
         parmString = parmString + "userName" + (i+1) + "#" + result[i].name;
      }else {
         parmString = parmString + "userName" + (i+1) + "#" + result[i].name + "&";
      }

   }
   //alert(parmString);
   window.open("end.html" + "?" + parmString, '_self');
}

function updatePipes()
{
   clearInterval(loopPipeloop);

   var newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height: 600px;"></div></div>');
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
