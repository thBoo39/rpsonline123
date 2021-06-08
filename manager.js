const MAX_OCCUPANTS = 5;
const MAX_ROOMS = 99999;

var users = [];
const NOT_READY = 0;
const READY = 1;
const PICK = 7;
const ROCK_LOST = 4;
const PAPER_LOST = 5;
const SCISSOR_LOST = 6;
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

const addUser = function (id, name, roomId) {
  // check client side input is valid and does not exceed MAX room numbers
  if (!isValidRoomId(roomId)) return { err: "invalid room id" };
  if (existingUser(id)) return { err: "existing user" };
  const room = "Room" + roomId;
  const roomUsers = users.filter(x => x.room === room);
  if (roomUsers.length + 1 > MAX_OCCUPANTS) return { err: "room occupied" };
  // if room users exist, and already fight in progress
  if (roomUsers.length > 0) {
    if (roomUsers[0].state > 1) return { err: "Locked" };
  }
  if (!isNameUniqueAmong(name, roomUsers)) {
    name = name + "2";
  }
  // if name is blank, create a unique name
  if (!name) {
    name = createUniqueNameAmong(roomUsers);
  } else {
    if (name.length > 12) {name = name.slice(0, 12)};
  }
  const user = { id: id, name: name, room: room, state: NOT_READY, countWin: 0 };
  users.push(user);
  return { user };
}

const getUser = function (id) {
  return (users.find(user => user.id === id));
}

const getUsers = function (room) {
  return (users.filter(user => user.room === room));
}

const removeUser = function (id) {
  const index = users.findIndex(user => user.id === id);
  if (index > -1) {
    return (users.splice(index, 1)[0]);
  }
  return -1;
}

const judgeUsers = function (roomUsers) {
  var winner = undefined;
  var losers = [];
  var ties = [];
  const { rock, paper, scissor } = getCombination(roomUsers);
  if (existTie({ rock, paper, scissor })) {
    for (var user of roomUsers) {
      if ((user.state > PICK) && (user.state != LOST)) {
        user.state += 10;
        ties.push(user);
      }
    }
    // ties = roomUsers.filter( user => (user.state > PICK) && (user.state != LOST))
    return { winner, losers, ties };
  }
  if (rock && scissor) {
    ties = roomUsers.filter(user => user.state === ROCK);
    for (var tie of ties) { tie.state = ROCK_TIE; }
    losers = roomUsers.filter(user => user.state === SCISSOR);
    for (var loser of losers) { loser.state = SCISSOR_LOST; }
  } else if (paper && rock) {
    ties = roomUsers.filter(user => user.state === PAPER);
    for (var tie of ties) { tie.state = PAPER_TIE; }
    losers = roomUsers.filter(user => user.state === ROCK);
    for (var loser of losers) { loser.state = ROCK_LOST; }
  } else if (scissor && paper) {
    ties = roomUsers.filter(user => user.state === SCISSOR);
    for (var tie of ties) { tie.state = SCISSOR_TIE; }
    losers = roomUsers.filter(user => user.state === PAPER);
    for (var loser of losers) { loser.state = PAPER_LOST; }
  }
  // count LOST users if still in the room
  var lostCount = countLostRoomUsers(roomUsers);
  if (losers.length + lostCount + 1 === roomUsers.length) {
    winner = roomUsers.find(user => (user.state > PICK) && (user.state != LOST));
    winner.state += 10;
    roomState = "winner";
  }
  return { winner, losers, ties, roomState };
}

function existTie({ rock, paper, scissor }) {
  if (rock && paper && scissor) return true;
  if (rock && !paper && !scissor) return true;
  if (!rock && paper && !scissor) return true;
  if (!rock && !paper && scissor) return true;
  return false;
}

function getCombination(roomUsers) {
  var rock = (typeof (roomUsers.find(user => user.state === ROCK)) != "undefined") ? true : false;
  var paper = (typeof (roomUsers.find(user => user.state === PAPER)) != "undefined") ? true : false;
  var scissor = (typeof (roomUsers.find(user => user.state === SCISSOR)) != "undefined") ? true : false;
  return { rock, paper, scissor };
}

function countLostRoomUsers(roomUsers) {
  return (roomUsers.filter(user => user.state === LOST).length);
}

function isValidRoomId(id) {
  if (!isNumber(id)) return false;
  return (id > 0 && id < MAX_ROOMS);
}

function existingUser(id) {
  const user = users.find(user => user.id === id);
  return (user);
}

function isNameUniqueAmong(name, roomUsers) {
  if (typeof roomUsers.find(user => user.name === name) === "undefined") {
    return true;
  }
  return false;
}

function createUniqueNameAmong(roomUsers) {
  var pool = [...Array(MAX_OCCUPANTS).keys()];
  var index = Math.floor(Math.random() * pool.length)
  var name = "USER " + pool[index];
  while (!isNameUniqueAmong(name, roomUsers)) {
    pool.splice(index, 1);
    index = Math.floor(Math.random() * pool.length)
    name = "USER " + pool[index];
  }
  return name;
}
// utility
function isNumber(value) {
  return (typeof value === 'number' && isFinite(value));
}


module.exports = {
  addUser, getUser, removeUser, getUsers, judgeUsers
};
