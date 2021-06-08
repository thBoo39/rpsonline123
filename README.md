# RPSonline123

Rock Paper Scissors online with chat.

## About
You can play rock paper scissors games with up to 5 people locally or online from all over the world! There is a chat function if you like.

Choose the room number shared with your friends. You can choose a number from 1 to 99999. There is not authentication whatsoever but this is rock paper scissors. Have fun.

## Requires and Tested on
Server side
- Node.js 14.17.0
- Express 4.17.1
- Socket.IO 4.1.2

Client uses p5.js linked to CDN site. Unless otherwise, you do not need to download it.
- p5.js 1.3.1

## How to run
node server.js

## Game Rules
Room must be at least 2 users in the room, and up to 5 users. Once users in the room are ready, lock the room. Nobody else can enter the room.
If a user leaves the room while the room was locked, reset all users in the room back to not ready state.
if a user lose, disable the user untill the winner is decided.

While engaging the game, users shoud not know other users choice.

## Server side
```
Client connection

Client requestJoinRoom
if success, 
  Server adds the client.
  Server sends "the client joined" message to all other clients in the room
  Server sends back "success" with "join room" message 
  Server sends room 'stats' to all the clients in the room

Client requestReady
Server check the client. (if server crushes while the client is up, the client data is gone, giving user "undefined")
if the room has the space, more than 2 clients exist, and the game is not in progress, 
  Server sets the client Ready state.
if all clients in the room are ready, called it 'hot',
  Server sets all the clients Pick state.
Server sends the notification client READY message
Server sends room 'stats' to all the clients in the room
if the room is hot,
  Server sends back "success" with "room hot"
  Server sends notification "Room is hot"
if the room is not hot yet,
  Server sends back "success" with "user ready"

Client requestChoice
  Server checks the client.
  Server checks the client input, just in case.
  Server set the User state
  if the state does not change, return
  Server sends notification "user made a choice"
  Server sends back "success" with "choice"
  In order to hide other clients choice, make a stats package called dummyStats, setting their state as "Picked"
  Server sends the dummy stats to the room clients except the sender
  In order to show the client its own choice, repackage the dummy stats
  Server sends the client the repackaged dummy stats
  Check if all clients made a choice
  if not, 
    Server sends the client "success" with "wait"
    return
  Now judge users based on their state. The function judgeUsers will return the list of winners, losers and ties, and change their states.
  In order to show losers' pick, mark their status as "LRock" adding 'L' in front, for example.
  The winner gets the win count one up.
  Server sends room 'stats' to all the clients in the room
  Losers get the LOST status so that they will not be able to pick.
  Server sends each loser "success" with "lost"
  Server sends each tie "success" with "tie"
  Set all room users state Pick unless Lost state
  if there's a winner,
    Server sends the winner "success" with "win"
    Server sends notification winner's name
    Server sends all users in the room "success" with "game over"
  
Client requestRematch
  check if the user is valid.
  Set all room users to Pick state.
  Server sends all room users "success" with "root hot"
  Server sends room 'stats' to all the clients in the room
  Server sends notification "user requested rematch"

Client disconnect
  remove the user
  if the user was engaged in the game,
    reset the all users in the room, disengaging the game
    Server sends clinets in the room "success" with "reset"
  Server sends room 'stats' to all the clients in the room

Client requestSendMessage
  check the user and the message
  Server sends notification user name and the message from the client
```

## Client side.
```
Stages
Stage 0, enter room number.
Stage 1, Click when ready
Stage 2, Wait for other users ready
Stage 3, Pick your choice -> repeat till Win or lose
Stage 4, Lost -> Back to 0 or Continue 1
Stage 5, Win -> Back to 0 or Continue 1

Server notification, Client show the message.
```
