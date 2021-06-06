# matter-on-web
try web host with matter

Room
  must be at least 2 users in the room
  once room is ready, lock the room. Nobody else can enter the room.
  If a user leaves the room, remove the user. If the number of users in the room is less than 2, back to waiting screen.
  if a user lose, disable the user.
  The last person is the winner.

User


Client -> Server connection
Server:
register client

Client -> Server Enter room
Server:
if room does not exist, create a room
add client to the room
Server -> Client succeed enter room
Server -> Client users in the room
Client:
remove Enter room screen
draw Waiting screen
show users in the room

Client -> Server Ready fight
Server:
if at least two users in the room, lock the room
Server -> Clients Lock room
Client:
draw fight screen

Client -> Server Made choice
Server:
Lock the choice
Server -> Clients user ready
  Clients:
  show user ready
if all the users ready, fight
Server -> clients user results
  Clients:
  show results

STATES
READY = 1;
LOST = 2;
PICK = 3;
PICKED
ROCK = 4;
PAPER = 5;
SCISSOR = 6;
WIN
TIE

if users disconnect > LOST, safely disconnect, keep going the game
When users made a choice, save the state, but others shoudn't know the choice.
Server send the dummy stae.


Client side.
Stages
Stage 0, enter room number.
Stage 1, Click when ready
Stage 2, Wait for other users ready
Stage 3, Pick your choice -> repeat till Win or lose
Stage 4, Lost -> Back to 0 or Continue 1
Stage 5, Win -> Back to 0 or Continue 1

How to show the other users state?
Server sends the updates with user name and state.

Server notification, Client show the message.
