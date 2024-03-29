const TEXT_SIZE = 50;
const SEND_TEXT_SIZE = 40;

var socket;

var room;
var canvas_bottom;
var msg_bottom = [];
var roomUsers = [];

function setup() {
  // top canvas for users stats
  const cbHeight = SEND_TEXT_SIZE * 5;
  const cHeight = cbHeight + TEXT_SIZE * 5;
  const canvas = createCanvas(windowWidth, cHeight);
  // bottom canvas for message
  canvas_bottom = createGraphics(windowWidth, cbHeight);
  // add hit enter function to input form
  // canvas.style('display', 'block');
  console.log("client run")
  var webAddr;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    webAddr = "http://localhost:5000";
  } else {
    webAddr = "https://rpsonline123.azurewebsites.net/";
  }
  socket = io.connect(webAddr);
  socket.on("error", handleError);
  socket.on("success", handleSuccess);
  socket.on("notification", handleNotification);

  canvas.parent('sketch');
  textSize(TEXT_SIZE);
  textAlign(LEFT, TOP);
  canvas_bottom.textSize(SEND_TEXT_SIZE);
  canvas_bottom.textAlign(LEFT, TOP);
  // can do this without creating an object
  room = new Room();
  // add initial messages
  addToMsgBox("Welcome to Rock Paper Scissors online!");
  addToMsgBox("Human vs Human up to 5 people");
  addToMsgBox("Have the shared room number 1 - 99999 ready!")
  addToMsgBox("")
  addToMsgBox("Enjoy!")

  noLoop();
}

function Room(id) {
  // 0 room selection, 1 waiting
  this.stage = 0
  this.name = "";
  this.user = "";
  this.err = false;

  this.switchTo = function (stage) {
    if (this.stage === stage) return;
    this.stage = stage;
    // e .. element
    var e;
    switch (this.stage) {
      // Click when Ready
      case 1:
        e = select('#headMsg');
        e.html(this.user + " : Click when");
        e = select('#roomNo-area');
        e.hide();
        e = select('#ready-area');
        e.show();
        e = select('#button-area');
        e.hide();
        e = select('#button-rematch');
        e.hide();
        break;
      // Wait for other users ready
      case 2:
        e = select('#headMsg');
        e.html(this.user + " : Waiting...")
        e = select('#roomNo-area');
        e.hide();
        e = select('#ready-area');
        e.hide();
        break;
      // Pick your choice
      case 3:
        e = select('#headMsg');
        e.html("Pick!")
        e = select('#roomNo-area');
        e.hide();
        e = select('#ready-area');
        e.hide();
        e = select('#button-area');
        e.show();
        e = select('#button-rematch');
        e.hide();
        break;
      // Lost
      case 4:
        e = select('#headMsg');
        e.html("You Lost!")
        e = select('#button-area');
        e.hide();
        addToMsgBox("Wait for winner to rematch!");
        break;
      // Win
      case 5:
        e = select('#headMsg');
        e.html("You WIN!")
        e = select('#button-area');
        e.hide();
        break;
      // Rematch
      case 6:
        e = select('#button-rematch');
        e.show();
        break;
    }
    redraw();
  }

  this.draw = function () {
    this.update();
  }

  this.update = function () {
    var cName = color('yellow');
    // binking screen effect when tie
    if (this.blinking > 0) this.blinking -= 1;
    for (var i = 0; i < roomUsers.length; i++) {
      var countWin = roomUsers[i].countWin.toString();
      var status = roomUsers[i].status;
      var name = roomUsers[i].name;
      var c = color(210, 210, 60);
      if (status.slice(0, 1) === 'L') {
        c = color("crimson");
        status = status.slice(1);
      } else if (status.slice(0, 1) === 'T') {
        if (this.blinking > 0) {
          if (this.blinking % 2) {
            c = color(40, 40, 210);
          } else {
            c = color(210, 210, 40);
          }
        } else {
          c = color(210, 210, 40);
          noLoop();
        }
        status = status.slice(1);
      } else if (status.slice(0, 1) === 'W') {
        c = color(30, 175, 30);
        status = status.slice(1);
      }
      switch (status) {
        case "Not Ready":
          c = color("crimson");
          break;
        case "Ready":
          c = color(30, 175, 30);
          break;
        case "Pick":
          c = color(210, 210, 40);
          break;
      }
      // Draw users status on canvas
      name = name + "  ";
      fill(c);
      rect(0, TEXT_SIZE * (i), windowWidth, TEXT_SIZE);
      fill(cName);
      rect(0, TEXT_SIZE * (i), textWidth(name), TEXT_SIZE);
      fill(30)
      textAlign(LEFT);
      text(name, 0, TEXT_SIZE * (i));
      fill(30);
      textAlign(CENTER);
      text(status, windowWidth / 2, TEXT_SIZE * (i));
      textAlign(RIGHT);
      text(countWin, windowWidth-20, TEXT_SIZE * (i));
    }
  }
}

function handleSuccess(data) {
  switch (data.id) {
    case "join room":
      room.name = data.name;
      room.user = data.user;
      var e = select('#label-room');
      e.html(room.name);
      room.switchTo(1);
      break;
    case "user ready":
      room.switchTo(2);
      break;
    case "choice":
      changeButtonColor(data.pick);
      break;
    case "room hot":
      clearMsgBox();
      resetButtonColor();
      room.switchTo(3);
      break;
    case "reset":
      clearMsgBox();
      resetButtonColor();
      room.switchTo(1);
      break;
    case "tie":
      e = select('#headMsg');
      e.html("Continue!");
      resetButtonColor();
      room.blinking = 10;
      loop();
      console.log("tie")
      console.log(room.blinking)
      break;
    case "wait":
      e = select('#headMsg');
      e.html("Waiting...");
      break;
    case "lost":
      room.switchTo(4);
      break;
    case "win":
      room.switchTo(5);
      break;
    case "game over":
      room.switchTo(6);
      break;
    case "user update":
      roomUsers = [];
      // rearange users so that client always on top
      var index = data.users.findIndex(user => user.name === room.user);
      roomUsers.push(data.users[index]);
      for (var i = 0; i < data.users.length; i++) {
        if (i != index) roomUsers.push(data.users[i]);
      }
      redraw();
      break;
  }
}

function handleNotification(msg) {
  addToMsgBox(msg);
  redraw();
  return;
}

// When buttons are clicked
function enterName() {
  var e = select('#input-name');
  const msg = e.value();
  room.name = msg;
  e = select('#name-area');
  e.hide();
  e = select('#roomNo-area');
  e.show();
  e = select('#headMsg');
  e.html("Enter your room number!")
  clearMsgBox();
  addToMsgBox("Enter the room number shared with your buddies.");
  addToMsgBox("Note a stranger can be in the room!");
  addToMsgBox("To leave the room, simply reload the page");
  redraw();
}

function requestJoinRoom() {
  const id = select('#roomNo');
  const number = Number(id.value());
  console.log(`request join a room ${number}`);
  socket.emit("requestJoinRoom", room.name, number);
  clearMsgBox();
  addToMsgBox("Wait till your buddies join the room");
  addToMsgBox("Click READY when ready");
  addToMsgBox("To chat, type a message and hit enter");
}

function requestReady() {
  console.log('request Ready')
  socket.emit("requestReady");
}

function requestRock() {
  console.log("rock")
  socket.emit("requestChoice", "rock");
  addToMsgBox("Your choice is Rock");
}

function requestPaper() {
  console.log("paper")
  socket.emit("requestChoice", "paper");
  addToMsgBox("Your choice is Paper");
}

function requestScissor() {
  console.log("scissor")
  socket.emit("requestChoice", "scissor");
  addToMsgBox("Your choice is Scissors");
}

function requestRematch() {
  console.log("request rematch")
  socket.emit("requestRematch");
}

function requestSendMessage(msg) {
  console.log("Request send message");
  socket.emit("requestSendMessage", msg);
}

// Drawing
function draw() {
  background(175);
  room.draw();
  writeMsg();
  image(canvas_bottom, 0, TEXT_SIZE * 5);
}

function keyReleased() {
  if (key === "Enter") {
    const e = select('#message-bottom');
    const msg = e.value();
    if (msg != "") {
      requestSendMessage(msg.slice(0, 25));
    }
    e.value("");
  }
}

// error handling from server
function handleError(id) {
  room.err = true;
  var msg = "";
  switch (id) {
    case "overcrowded":
      msg = "Overcrowded. Try it again later.";
      break;
    case "invalid room id":
      msg = "Only numbers 1 - 99999";
      break;
    case "room occupied":
      msg = "This room is occupied. Try others";
      break;
    case "alone":
      msg = 'You are alone! Wait for users.';
      break;
    case "Locked":
      msg = 'Rock Paper Scissors on Progress!';
      break;
    case "name taken":
      msg = "Your name is already taken.";
  }
  addToMsgBox(msg);
  redraw();
}

function addToMsgBox(msg) {
  if (msg_bottom.length < 5) {
    msg_bottom.push(msg);
  } else {
    msg_bottom.shift();
    msg_bottom.push(msg);
  }
}

function clearMsgBox() {
  msg_bottom = [];
}

function writeMsg() {
  const c = color(150, 230, 140);
  canvas_bottom.background(c);
  canvas_bottom.fill(0);
  for (var i = 0; i < msg_bottom.length; i++) {
    canvas_bottom.text(msg_bottom[i], 0, i * SEND_TEXT_SIZE);
  }
}

function changeButtonColor(pick) {
  const br = "#button-rock";
  const bp = "#button-paper";
  const bs = "#button-scissor";
  var e;
  var eH, eL1, eL2;
  var col;
  switch(pick) {
    case "rock":
      eH = br;
      eL1 = bp;
      eL2 = bs;
      break;
    case "paper":
      eH = bp;
      eL1 = br;
      eL2 = bs;
      break;
    case "scissor":
      eH = bs;
      eL1 = br;
      eL2 = bp;
      break;
  }
  e = select(eH);
  col = color("LightYellow");
  e.style("background-color", col);
  col = color("lightgray");
  e = select(eL1);
  e.style("background-color", col);
  e = select(eL2);
  e.style("background-color", col);
}

function resetButtonColor() {
  const buttons = ["#button-rock", "#button-paper", "#button-scissor"]
  var e;
  const col = color("lightgray");
  for (var b of buttons) {
    e = select(b);
    e.style("background-color", col);
  }
}