const TEXT_SIZE = 50;
const SEND_TEXT_SIZE = 40;

var socket;

var room;
var canvas_bottom;
var msg_bottom = [];
var roomUsers = [];

function setup() {
  // top canvas for users stats
  // bottom canvas for message
  const canvas = createCanvas(windowWidth, TEXT_SIZE * 9);
  canvas_bottom = createGraphics(windowWidth, TEXT_SIZE * 4)
  // add hit enter function to input form
  // canvas.style('display', 'block');
  console.log("client run")
  var webAddr;
  if (location.hostname === "localhost" || location.hostname === "127.0.0.1") {
    webAddr = "http://localhost:5000";
  } else {
    webAddr = "https://rpsonline123.herokuapp.com/";
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
  room = new Room();
  noLoop();
}

function Room(id) {
  // 0 room selection, 1 waiting
  this.stage = 0
  this.name = "";
  this.user = "";
  this.err = false;

  this.leftBuf = 30;
  this.topBuf = 30;

  this.switchTo = function (stage) {
    if (this.stage === stage) return;
    this.stage = stage;
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
        e.html(this.user + " : Waiting Users")
        e = select('#roomNo-area');
        e.hide();
        e = select('#ready-area');
        e.hide();
        break;
      // Pick your choice
      case 3:
        e = select('#headMsg');
        e.html(this.user + " : Pick!")
        e = select('#roomNo-area');
        e.hide();
        e = select('#ready-area');
        e.hide();
        e = select('#button-area');
        e.show();
        break;
      // Lost
      case 4:
        e = select('#headMsg');
        e.html("You Lost!")
        e = select('#button-area');
        e.hide();
        addToMsgBox("Wait for winner to rematch!");
        break;
      case 5:
        e = select('#headMsg');
        e.html("You WIN!")
        e = select('#button-area');
        e.hide();
        break;
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
    for (var i = 0; i < roomUsers.length; i++) {
      var status = roomUsers[i].status;
      const name = roomUsers[i].name;
      var c = color(30, 175, 30);
      if (status.slice(0, 1) === 'L') {
        c = color(175, 30, 30);
        status = status.slice(1);
      } else if (status.slice(0, 1) === 'W') {
        status = status.slice(1);
      }
      switch (status) {
        case "Not Ready":
          c = color(175, 30, 30);
          break;
      }
      const msg = name + "  :" + status;
      fill(c);
      rect(0, TEXT_SIZE * (i), windowWidth, TEXT_SIZE);
      fill(75);
      text(msg, 0, TEXT_SIZE * (i));
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
      addToMsgBox(`You are in ${room.name}`);
      break;
    case "user ready":
      room.switchTo(2);
      break;
    case "room hot":
      room.switchTo(3);
      break;
    case "reset":
      room.switchTo(1);
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
  redraw();
}

function requestJoinRoom() {
  const id = select('#roomNo');
  const number = Number(id.value());
  console.log(`request join a room ${number}`);
  socket.emit("requestJoinRoom", room.name, number);
}

function requestReady() {
  console.log('request Ready')
  socket.emit("requestReady");
}

function requestRock() {
  console.log("rock")
  socket.emit("requestChoice", "rock");
}

function requestPaper() {
  console.log("paper")
  socket.emit("requestChoice", "paper");
}

function requestScissor() {
  console.log("scissor")
  socket.emit("requestChoice", "scissor");
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
  // ellipse(mouseX, mouseY, 30, 30);
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
      msg = "Only numbers 1 - 1000";
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

function writeMsg() {
  const c = color(100, 200, 150);
  canvas_bottom.background(c);
  canvas_bottom.fill(0);
  for (var i = 0; i < msg_bottom.length; i++) {
    canvas_bottom.text(msg_bottom[i], 0, i * SEND_TEXT_SIZE);
  }
}