/*
   Copyright 2014 Nebez Briefkani
   floppybird - main.js

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

var debugmode = false;

var states = Object.freeze({
   SplashScreen: 0,
   GameScreen: 1,
   ScoreScreen: 2
});

var currentstate;

var gravity = 0.25;
var velocity = 0;
var position = 180;
var rotation = 0;
var jump = -4.6;

var fruitscore = 0;
var score = 0;
var highscore = 0;
var time = 0;

var pipeheight = 350;
var pipewidth = 52;
var fruitheight = 44;
var fruitwidth = 44;
var pipes = new Array();
var fruits = new Array();

var replayclickable = false;

   var origwidth = 34.0;
   var origheight = 24.0;
   
//sounds
var volume = 30;
var soundJump = new buzz.sound("assets/sounds/sfx_wing.ogg");
var soundScore = new buzz.sound("assets/sounds/sfx_point.ogg");
var soundHit = new buzz.sound("assets/sounds/sfx_hit.ogg");
var soundDie = new buzz.sound("assets/sounds/sfx_die.ogg");
var soundSwoosh = new buzz.sound("assets/sounds/sfx_swooshing.ogg");
var hungry = new buzz.sound("assets/sounds/_3_m4a.mp3");
var bgm = new buzz.sound("assets/sounds/ringtone (1).mp3");
buzz.all().setVolume(volume);

//loops1
var loopGameloop;
var loopPipeloop;
var loopFruitloop;

$(document).ready(function() {
   if(window.location.search == "?debug")
      debugmode = true;
   if(window.location.search == "?easy")
      pipeheight = 200;
   
   //get the highscore
   var savedscore = getCookie("highscore");
   if(savedscore != "")
      highscore = parseInt(savedscore);
   
   //get userName
   var arrParameter = [];
   arrParameter = parseParameter(document.URL);
   var userName = getParaValue(arrParameter,"userName");
   comLogin(userName, 0, null);


   //start with the splash screen
   showSplash();
});

function getCookie(cname)
{
   var name = cname + "=";
   var ca = document.cookie.split(';');
   for(var i=0; i<ca.length; i++) 
   {
      var c = ca[i].trim();
      if (c.indexOf(name)==0) return c.substring(name.length,c.length);
   }
   return "";
}

function setCookie(cname,cvalue,exdays)
{
   var d = new Date();
   d.setTime(d.getTime()+(exdays*24*60*60*1000));
   var expires = "expires="+d.toGMTString();
   document.cookie = cname + "=" + cvalue + "; " + expires;
}

function showSplash()
{
   currentstate = states.SplashScreen;
   
   //set the defaults (again)
   velocity = 0;
   position = 180;
   rotation = 0;
   score = 0;
   fruitscore = 0;
   
   //origwidth = 41.0;
   //origheight = 29.0;
   //update the player in preparation for the next game
   $("#player").css({ y: 0, x: 0}); 
   updatePlayer($("#player"));
   
   $('.bird').css("background-image", "url('./assets/bird.png')");
   $('.bird').css("-webkit-animation", "animBird 300ms steps(4) infinite");
   $('.bird').css("animation", "animBird 300ms steps(4) infinite");
   
   soundSwoosh.stop();
   soundSwoosh.play();
   
   //clear out all the pipes if there are any
   $(".pipe").remove();
   pipes = new Array();
   $(".fruit").remove();
   f = new Array();
   
   //make everything animated again
   $(".animated").css('animation-play-state', 'running');
   $(".animated").css('-webkit-animation-play-state', 'running');
   
   //fade in the splash
   $("#splash").transition({ opacity: 1 }, 2000, 'ease');
}

function startGame()
{
   currentstate = states.GameScreen;
   
   //fade out the splash
   $("#splash").stop();
   $("#splash").transition({ opacity: 0 }, 500, 'ease');
   
   //update the big score
   setBigScore();
   
   //debug mode?
   if(debugmode)
   {
      //show the bounding boxes
      $(".boundingbox").show();
   }

   //start up our loops
   var updaterate = 1000.0 / 60.0 ; //60 times a second
   loopGameloop = setInterval(gameloop, updaterate);
   loopPipeloop = setInterval(updatePipes, 1400);
   loopFruitloop = setInterval(updateFruits, 5000);
   //jump from the start!
   playerJump();
}

function updatePlayer(player)
{
   //rotation
   rotation = Math.min((velocity / 10) * 90, 90);
   
   //apply rotation and position
   $(player).css({ rotate: rotation, top: position, width: origwidth, height: origheight});
}

function gameloop() {
	time += 1;
   var player = $("#player");
   
   //update the player speed/position
   velocity += gravity;
   position += velocity;
   
   //update the player
   updatePlayer(player);
   
   //create the bounding box
   var box = document.getElementById('player').getBoundingClientRect();
   
   var boxwidth = origwidth - (Math.sin(Math.abs(rotation) / 90) * 8);
   var boxheight = (origheight + box.height) / 2;
   var boxleft = ((box.width - boxwidth) / 2) + box.left;
   var boxtop = ((box.height - boxheight) / 2) + box.top;
   var boxright = boxleft + boxwidth;
   var boxbottom = boxtop + boxheight;
   
   //if we're in debug mode, draw the bounding box
   if(debugmode)
   {
      var boundingbox = $("#playerbox");
      boundingbox.css('left', boxleft);
      boundingbox.css('top', boxtop);
      boundingbox.css('height', boxheight);
      boundingbox.css('width', boxwidth);
   }
   
   //did we hit the ground?
   if(box.bottom >= $("#land").offset().top)
   {
      playerDead();
      return;
   }
   
   //have they tried to escape through the ceiling? :o
   var ceiling = $("#ceiling");
   if(boxtop <= (ceiling.offset().top + ceiling.height()))
      position = 0;
   
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
   
   var nextfruit = fruits[0];
   
   var fruittop = nextfruit.offset().top;
   var fruitleft = nextfruit.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
   var fruitright = fruitleft + fruitwidth;
   var fruitbottom = fruittop + fruitheight;
   
   if(debugmode)
   {
      var boundingbox = $("#pipebox");
      boundingbox.css('left', pipeleft);
      boundingbox.css('top', pipetop);
      boundingbox.css('height', pipeheight -50);
      boundingbox.css('width', pipewidth);
   }
   
   if(debugmode)
   {
      var boundingbox = $("#fruitbox");
      boundingbox.css('left', fruitleft);
      boundingbox.css('top', fruittop);
      boundingbox.css('height', fruitheight);
      boundingbox.css('width', fruitwidth);
   }
   
   //have we gotten inside the pipe yet?
   if(boxright > fruitleft)
   {
      //we're within the pipe, have we passed between upper and lower pipes?
      if(boxbottom < fruittop || boxtop > fruitbottom)
      {
         //yeah! we're within bounds
         
      }
      else
      {
         //no! we touched the pipe
         $(fruits.shift()).remove();
         fruitscore += 1;
         	
         	if((fruitscore % 3) == 0){
         		hungry.stop();
         		hungry.play();
         	}
         	if(fruitscore < 10){
         	$('.bird').css("background-image", "url('./assets/bird" + fruitscore + ".png')");
         	$('.bird').css("-webkit-animation", "animBird" + fruitscore + " 300ms steps(4) infinite");
         	$('.bird').css("animation", "animBird" + fruitscore + " 300ms steps(4) infinite");
   		origwidth= Math.round(origwidth*1.2);
   		origheight = Math.round(origheight*1.2);
   		}
         return;
      }
   }
   
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
   
   
   //have we passed the imminent danger?
   if(boxleft > fruitright)
   {
      //yes, remove it
      fruits.splice(0, 1);
   }
   
   //have we passed the imminent danger?
   if(boxleft > piperight)
   {
      //yes, remove it
      pipes.splice(0, 1);
      
      //and score a point
      playerScore();
   }
}

//Handle space bar
$(document).keydown(function(e){
   //space bar!
   if(e.keyCode == 32)
   {
      //in ScoreScreen, hitting space should click the "replay" button. else it's just a regular spacebar hit
      if(currentstate == states.ScoreScreen)
         $("#replay").click();
      else
         screenClick();
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
   if(currentstate == states.GameScreen)
   {
      playerJump();
   }
   else if(currentstate == states.SplashScreen)
   {
      startGame();
   }
}

function playerJump()
{
   velocity = jump;
   //play jump sound
   soundJump.stop();
   soundJump.play();
}

function setBigScore(erase)
{
   var elemscore = $("#bigscore");
   elemscore.empty();
   
   if(erase)
      return;
   
   var digits = score.toString().split('');
   for(var i = 0; i < digits.length; i++)
      elemscore.append("<img src='assets/font_big_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setSmallScore()
{
   var elemscore = $("#currentscore");
   elemscore.empty();
   
   var digits = score.toString().split('');
   for(var i = 0; i < digits.length; i++)
      elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setHighScore()
{
   var elemscore = $("#highscore");
   elemscore.empty();
   
   var digits = highscore.toString().split('');
   for(var i = 0; i < digits.length; i++)
      elemscore.append("<img src='assets/font_small_" + digits[i] + ".png' alt='" + digits[i] + "'>");
}

function setMedal()
{
   var elemmedal = $("#medal");
   elemmedal.empty();
   
   if(score < 10)
      //signal that no medal has been won
      return false;
   
   if(score >= 10)
      medal = "bronze";
   if(score >= 20)
      medal = "silver";
   if(score >= 30)
      medal = "gold";
   if(score >= 40)
      medal = "platinum";
   
   elemmedal.append('<img src="assets/medal_' + medal +'.png" alt="' + medal +'">');
   
   //signal that a medal has been won
   return true;
}

function playerDead()
{
   //stop animating everything!
   $(".animated").css('animation-play-state', 'paused');
   $(".animated").css('-webkit-animation-play-state', 'paused');
   
   //drop the bird to the floor
   var playerbottom = $("#player").position().top + $("#player").width(); //we use width because he'll be rotated 90 deg
   var floor = $("#flyarea").height();
   var movey = Math.max(0, floor - playerbottom);
   $("#player").transition({ y: movey + 'px', rotate: 90}, 1000, 'easeInOutCubic');
   
   //it's time to change states. as of now we're considered ScoreScreen to disable left click/flying
   currentstate = states.ScoreScreen;

   //destroy our gameloops
   clearInterval(loopGameloop);
   clearInterval(loopPipeloop);
   clearInterval(loopFruitloop);
   loopGameloop = null;
   loopPipeloop = null;
   loopFruitloop = null;

   //direct end.html
   var result = [{'name': 'tony1', 'car': 0, 'pos': 0}, {'name': 'tony2', 'car': 0, 'pos': 1}, 
   {'name': 'tony3', 'car': 0, 'pos': 0}];
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
   
   //remove the big score
   setBigScore(true);
   
   //have they beaten their high score?
   if(score > highscore)
   {
      //yeah!
      highscore = score;
      //save it!
      setCookie("highscore", highscore, 999);
   }
   
   //update the scoreboard
   setSmallScore();
   setHighScore();
   var wonmedal = setMedal();
   
   //SWOOSH!
   soundSwoosh.stop();
   soundSwoosh.play();
   
   //show the scoreboard
   $("#scoreboard").css({ y: '40px', opacity: 0 }); //move it down so we can slide it up
   $("#replay").css({ y: '40px', opacity: 0 });
   $("#scoreboard").transition({ y: '0px', opacity: 1}, 600, 'ease', function() {
      //When the animation is done, animate in the replay button and SWOOSH!
      soundSwoosh.stop();
      soundSwoosh.play();
      $("#replay").transition({ y: '0px', opacity: 1}, 600, 'ease');
      
      //also animate in the MEDAL! WOO!
      if(wonmedal)
      {
         $("#medal").css({ scale: 2, opacity: 0 });
         $("#medal").transition({ opacity: 1, scale: 1 }, 1200, 'ease');
      }
   });
   
   //make the replay button clickable
   replayclickable = true;
}

$("#replay").click(function() {
   //make sure we can only click once
   if(!replayclickable)
      return;
   else
      replayclickable = false;
   //SWOOSH!
   soundSwoosh.stop();
   soundSwoosh.play();
   
   origwidth = 34.0;
   origheight = 24.0;
   time = 0;
   //fade out the scoreboard
   $("#scoreboard").transition({ y: '-40px', opacity: 0}, 1000, 'ease', function() {
      //when that's done, display us back to nothing
      $("#scoreboard").css("display", "none");
      
      //start the game over!
      showSplash();
   });
});

function playerScore()
{
   score += 1;
   //play score sound
   soundScore.stop();
   soundScore.play();
   setBigScore();
}

function updatePipes()
{
   //Do any pipes need removal?
   $(".pipe").filter(function() { return $(this).position().left <= -100; }).remove()
   
   var level = Math.floor(time/450) -1;
   if(level < 0) level = 0;
   var pipeheight = 350 - (level * 50);
   if(pipeheight < 100) pipeheight = 100;
   
   //add a new pipe (top height + bottom height  + pipeheight == 420) and put it in our tracker
   var padding = 60;
   var constraint = 420 - pipeheight - (padding * 2); //double padding (for top and bottom)
   var topheight = Math.floor((Math.random()*constraint) + padding); //add lower padding
   var bottomheight = (420 - pipeheight) - topheight;
   var newpipe = $('<div class="pipe animated"><div class="pipe_upper" style="height: ' + topheight + 'px;"></div><div class="pipe_lower" style="height: ' + bottomheight + 'px;"></div></div>');
   $("#flyarea").append(newpipe);
   pipes.push(newpipe);
}
	
function updateFruits()
{
	clearInterval(loopFruitloop);
   //Do any pipes need removal?
   $(".fruit").filter(function() { return $(this).position().left <= -100; }).remove()
   
	//locate the last pipe
   var lastpipe = pipes[pipes.length -1];
   var lastpipeupper = lastpipe.children(".pipe_upper");
   var pipetop = lastpipeupper.offset().top + lastpipeupper.height();
   var pipeleft = lastpipeupper.offset().left - 2; // for some reason it starts at the inner pipes offset, not the outer pipes.
   var pipebottom = pipetop + pipeheight;
   var top;
   var padding = 20;
   if(pipeleft + pipewidth < 900 && pipeleft + pipewidth > 810){
   		var constraint = 420 - fruitheight - (padding * 2);
   		top = Math.floor((Math.random()*constraint) + padding);
   }else{
   		var constraint = pipeheight - fruitheight;
   		top = Math.floor((Math.random()*constraint) + lastpipeupper.height());
   }
   var newfruit = $('<div class="fruit animated" style="top: ' + top + 'px;"></div>');
   $("#flyarea").append(newfruit);
   fruits.push(newfruit);
   var level = Math.floor(time/300) -1;
   if(level < 0) level = 0;
   var ran = 3000-(level * 500);
   if(ran < 0) ran = 0;
   var min = 2000-(level*250);
   if(min < 500) min = 500;
   loopFruitloop = setInterval(updateFruits, Math.random()*ran + min);
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
