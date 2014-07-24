var SOCKET = null;
/* 登入時呼叫這個，傳入的是名字, car 是車子的代碼
 * 回傳一個代碼，代表在第幾賽道  **** 更新，用 callback 傳回 ****
 */
function login(name, car, callback){
 SOCKET = new WebSockt("http://10.62.46.48:20666/");
 MSG_CALLBACKS.login = callback;
 SOCKET.onmessage(serverMsg);
}


/* 可以開賽時會呼叫 callback 準備換畫面
/* callback 會傳入 [{'name': name, 'car': carNo}, {'name': name, 'car': carNo}, ....]
 * 如果 login 時回傳的賽道是 0，則上面資料參賽者陣列的第 0 個就是自己的資料
 * 分別是第一台車、第二台車 */
function setGameOpenCallback(callBack){
  MSG_CALLBACKS.open = callback;
}

/* 3、2、1 然後呼叫這個 */
function ready(){
}

/* 大家都倒數完，可以開始了 */
function setGoCallback(callback){
  MSG_CALLBACKS.go = callback;
}

/* 宣告自己移動的位置 0 ~ 100 */
function move(position){
}

/* 當有其他人移動時，就會呼叫這個 callback 傳入值：賽道、position */
function setMoveCallback(callback){
  MSG_CALLBACKS.move = callback;
}

/* 比賽結束，排行資訊
/* 結束時，callback 會接收到排行資訊
 * 傳入內容如下：[{'name': name, 'car': carNo, 'sec': sec}, {'name': name, 'car': carNo, 'sec': sec}, ....]
 * 陣列順序依排名
 * WebSocket 在這時會自動斷線
 * */
function setGameOverCallback(callback){
  MSG_CALLBACKS.over = callback;
}

var MSG_CALLBACKS = {
  'login':null,
  'open':null,
  'go':null,
  'move':null,
  'over':null
}

var cmdHandlers = {
  'open': function(msg){
    if(MSG_CALLBACKS.open != null){
      MSG_CALLBACKS.open(msg.info);
    }
  },
  'lane': function(msg){
    if(MSG_CALLBACKS.login != null){
      MSG_CALLBACKS.login(msg.lane);
    }
  },
  'go': function(msg){
    if(MSG_CALLBACKS.go != null){
      MSG_CALLBACKS.go();
    }
  },
  'pos': function(msg){
    if(MSG_CALLBACKS.move != null){
      MSG_CALLBACKS.move(msg.lane, msg.pos);
    }
  },
  'over': function(over){
    if(MSG_CALLBACKS.over != null){
      MSG_CALLBACKS.over(msg.rank);
    }
    socket.close();
    socket = null;
  }
};

function serverMsg(e){
  cmd = JSON.parse(e.data);
  if(cmdHandlers.hasAttribute(cmd['act'])){
    cmdHandlers[cmd['act']]();
  }else{
    console.err('unkown cmd: %s', e.data);
  }
}
