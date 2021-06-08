const NOT_READY = 0;
const READY = 1;
const ROCK_LOST = 4;
const PAPER_LOST = 5;
const SCISSOR_LOST = 6;
const PICK = 7;
const ROCK = 14;
const PAPER = 15;
const SCISSOR = 16;
const ROCK_TIE = 24;
const PAPER_TIE = 25;
const SCISSOR_TIE = 26;
const ROCK_WIN = 34;
const PAPER_WIN = 35;
const SCISSOR_WIN = 36;
const PICKED = 10;
const LOST = 30;

const express = require("express");
const app = express();
const server = app.listen(process.env.PORT || 5000);
const { addUser, getUser, removeUser, getUsers, judgeUsers } = require('./manager');

app.use(express.static('public'));

console.log("Server is running ");

const socket = require("socket.io");
const io = socket(server);

var userCounter = 0;
io.sockets.on("connection", Connection);

function Connection(socket) {
  userCounter += 1;
  console.log(`New connection: ${userCounter}`);

  // If room does not exist, create a room. Create a username and add it to the room
  socket.on("requestJoinRoom", function (name, roomId) {
    console.log(`request Join Room ${roomId} from ${socket.id}`);
    const { user, err } = addUser(socket.id, name, roomId);
    if (err) {
      switch (err) {
        case "invalid room id":
          console.log(`Invalid room Id. Try it again : ${roomId}`);
          socket.emit("error", "invalid room id");
          break;
        // existing by id
        case "existing user":
          console.log("existing user");
          break;
        case "room occupied":
          console.log("room occupied");
          socket.emit("error", "room occupied");
          break;
        case "Locked":
          console.log("Locked");
          socket.emit("error", "Locked");
          break;
        case "name taken":
          console.log("name taken");
          socket.emit("error", "name taken");
      }
    } else {
      // if success, add the use to the room
      socket.join(user.room);
      // send User joined message to everyone in the room except for the user who just joined
      socket.to(user.room).emit('notification', `User ${user.name} joined!`);
      // server takes care of name and room name for the client who joined
      // in case the error occurs
      socket.emit("success", { id: "join room", name: user.room, user: user.name });
      // stats are client side specific users format
      // server does not send all the users data as is
      const stats = roomUsersStatusUpdate(user.room);
      // package stats and send all room users the package
      sendStatsToRoom(user.room, stats);
      console.log(`User ${user.name} added to ${user.room}`);
    }
  });
  // Client ready
  socket.on('requestReady', function () {
    const user = getUser(socket.id);
    if (!user) return;
    // if (!isUserValid(socket.id)) return;
    const { roomState } = setUserReady(user);
    if (roomState === 'alone') {
      socket.emit("error", "alone");
      return;
    } else if (roomState === 'no state change') {
      return;
    } else if (roomState === "Locked") {
      socket.emit("error", "Locked");
      return;
    } else if (roomState === "hot") {
      const roomUsers = getUsers(user.room);
      setUsersPickState(roomUsers);
    }
    socket.to(user.room).emit('notification', `User ${user.name} is READY!`);
    const stats = roomUsersStatusUpdate(user.room);
    sendStatsToRoom(user.room, stats);
    if (roomState === "hot") {
      io.in(user.room).emit('success', { id: 'room hot' });
      io.in(user.room).emit('notification', "Room is hot! Ready to rock paper scissors!");
    } else {
      socket.emit("success", { id: "user ready" });
    }
  });
  // User made a choice
  socket.on('requestChoice', function (pick) {
    const user = getUser(socket.id);
    if (!user) return;
    // if (!isUserValid(socket.id)) return;
    const state = getState(pick);
    if (typeof state === "undefined") return;
    const { err } = setUserState(user, state);
    if (err === 'no state change') return;
    socket.to(user.room).emit('notification', `${user.name} made a choice`);
    socket.emit("success", { id: "choice", pick: pick });
    // hide users choice by replacing with Picked
    const roomUsers = getUsers(user.room);
    dummyUsers = createPickedState(roomUsers);
    const dummyStats = statusUpdate(dummyUsers);
    var msgData = { id: "user update", users: dummyStats };
    socket.to(user.room).emit("success", msgData);
    // for those requested, show its own choice
    for (var dUser of dummyStats) {
      if (dUser.name === user.name) {
        var { name, status, countWin } = setStatus(user)
        dUser.status = status;
      }
    }
    msgData = { id: "user update", users: dummyStats };
    socket.emit("success", msgData);
    // check if all room users have made a chocie
    const count = countUsersChoice(roomUsers);
    if (count != roomUsers.length) {
      socket.emit("success", { id: "wait" });
      return;
    }
    // There coulbe be a winner, losers, lost users
    const { winner, losers, ties } = judgeUsers(roomUsers);
    // if no winner, game continue
    // losers get notified
    // ties get notified
    if (typeof winner != "undefined") {
      winner.countWin += 1;
    }
    const stats = roomUsersStatusUpdate(user.room);
    sendStatsToRoom(user.room, stats);
    for (var loser of losers) {
      io.to(loser.id).emit("success", { id: "lost" });
      loser.state = LOST;
    }
    for (var tie of ties) {
      io.to(tie.id).emit("success", { id: "tie" });
    }
    setUsersPickStateUnlessLost(roomUsers);
    if (typeof winner != "undefined") {
      console.log(`Winner is ${winner.name} in ${winner.room}!`)
      io.to(winner.id).emit("success", { id: "win" });
      io.in(user.room).emit("notification", `Winner is ${winner.name}!`);
      io.in(user.room).emit("success", { id: "game over" });
    }
  });

  // Rematch request
  socket.on('requestRematch', function () {
    const user = getUser(socket.id);
    if (typeof user === "undefined") return;
    console.log("Rematch");
    var roomUsers = getUsers(user.room);
    setUsersPickState(roomUsers);
    io.in(user.room).emit('success', { id: "room hot" });
    const stats = roomUsersStatusUpdate(user.room);
    sendStatsToRoom(user.room, stats);
    socket.to(user.room).emit("notification", `${user.name} requested Rematch!`)
  });

  // Disconnection
  socket.on('disconnect', function () {
    const user = removeUser(socket.id);
    userCounter -= 1;
    console.log(`Disconnect: ${userCounter}`);
    if (user != -1) {
      // if room users are already engaged, reset them all
      if (user.state >= PICK && user.state != LOST) {
        console.log("Reset")
        resetRoomUsersState(user.room);
        socket.to(user.room).emit('success', { id: "reset" });
      }
      const stats = roomUsersStatusUpdate(user.room);
      sendStatsToRoom(user.room, stats);
      socket.to(user.room).emit('notification', `${user.name} left the room`);
    }
  });

  socket.on("requestSendMessage", function (msg) {
    if (typeof msg === "undefined") return;
    const user = getUser(socket.id);
    if (typeof user === "undefined") return;
    io.in(user.room).emit("notification", `${user.name} :` + msg);
  });
}

function roomUsersStatusUpdate(room) {
  const roomUsers = getUsers(room);
  return statusUpdate(roomUsers);
}

function statusUpdate(roomUsers) {
  var usersStats = [];
  for (var user of roomUsers) {
    var { name, status, countWin } = setStatus(user);
    usersStats.push({ name: name, status: status, countWin: countWin });
  }
  return usersStats;
}

function setStatus(user) {
  var countWin = user.countWin;
  var name = user.name;
  var status = "";
  switch (user.state) {
    case NOT_READY:
      status = "Not Ready";
      break;
    case READY:
      status = "Ready";
      break;
    case ROCK_LOST:
      status = "LRock";
      break;
    case PAPER_LOST:
      status = "LPaper";
      break;
    case SCISSOR_LOST:
      status = "LScissors";
      break;
    case PICK:
      status = "Pick";
      break;
    case ROCK:
      status = "Rock";
      break;
    case PAPER:
      status = "Paper";
      break;
    case SCISSOR:
      status = "Scissors";
      break;
    case ROCK_TIE:
      status = "TRock";
      break;
    case PAPER_TIE:
      status = "TPaper";
      break;
    case SCISSOR_TIE:
      status = "TScissors";
      break;
    case ROCK_WIN:
      status = "WRock";
      break;
    case PAPER_WIN:
      status = "WPaper";
      break;
    case SCISSOR_WIN:
      status = "WScissors";
      break;
    case PICKED:
      status = "Picked";
      break;
    case LOST:
      status = "LLOST";
  }
  return { name, status, countWin }
}

function sendStatsToRoom(room, stats) {
  const msgData = { id: "user update", users: stats };
  io.in(room).emit("success", msgData);
}

// if server went down unexpectedly, server lose client info, causing crash.
function isUserValid(socketId) {
  var user = getUser(socketId);
  return (typeof user === "undefined") ? false : user;
}

function getState(pick) {
  if (pick === 'rock') {
    return ROCK;
  } else if (pick === 'paper') {
    return PAPER;
  } else if (pick === 'scissor') {
    return SCISSOR;
  }
  return;
}

function createPickedState(roomUsers) {
  var dummyUsers = [];
  for (u of roomUsers) {
    var id = u.id;
    var name = u.name;
    var room = u.room;
    var state = u.state;
    var countWin = u.countWin;
    // more than LOST values are ROCK PAPER SCISSOR
    if (u.state > PICK) {
      if (u.state != LOST) state = PICKED;
    }
    dummyUsers.push({ id: id, name: name, room: room, state: state, countWin: countWin });
  }
  return dummyUsers;
}

function setUsersPickState(roomUsers) {
  for (var user of roomUsers) {
    user.state = PICK;
  }
}

function setUsersPickStateUnlessLost(roomUsers) {
  for (var user of roomUsers) {
    if (user.state != LOST) user.state = PICK;
  }
}

function setUserState(user, choice) {
  var err = "";
  if (user.state != choice) {
    user.state = choice;
  } else {
    err = 'no state change';
  }
  return { user, err };
}

function countUsersChoice (roomUsers) {
  var count = 0;
  for (user of roomUsers) {
    if (user.state > PICK) count += 1;
  }
  return count;
}

const setUserReady = function (user) {
  // const user = getUser(id);
  if (user.state > READY) return { roomState: "Locked" };
  const roomUsers = getUsers(user.room);
  var roomState = "";
  if (roomUsers.length == 1) return { roomState: "alone" };
  if (user.state === READY) return { roomState: 'no state change' };
  user.state = READY;
  // if all users are ready, room is hot
  const readyCount = roomUsers.filter(user => user.state === READY).length;
  const roomUsersCount = roomUsers.length;
  if (readyCount === roomUsersCount) {
    roomState = 'hot';
  } else {
    roomState = 'cold';
  }
  return { roomState };
}

const resetRoomUsersState = function (room) {
  setRoomUsersState(room, NOT_READY);
  return;
}

function setRoomUsersState(room, state) {
  const roomUsers = getUsers(room);
  for (var user of roomUsers) {
    user.state = state;
  }
}

