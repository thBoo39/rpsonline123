# RPSonline123

## About
Rock Paper Scissors online with chat. You can play rock paper scissors games with up to 5 people locally or online from all over the world! There is a chat function if you like.

[Try it here](https://rpsonline123.azurewebsites.net/)... (as far as I haven't changed it). If you don't have friends available right away, open two tabs on your browser and test it. Or you can of course deploy it with node app locally. Port is 5000 in default.

Choose the room number shared with your friends. You can choose a number from 1 to 99999. Use name to recognize your friends easily. In app chat is helpful, too. There is a chance stranger in the room. But, hey, this is rock paper scissors. Have fun. Or simply refresh the page to leave the room.

## To run locally...
Requires Node.js. Tested with Node.js V14.17.0 on Windows machines. Once Node.js is installed on the machine, cd to the folder containing the repo, 

```
node server.js
```
Open the web browser, type "localhost:5000". That's it.

Express and Socket.IO are in the node_modules folder.
p5.js is linked to CDN site. Unless otherwise, you do not need to download it.

## Requires
**Server side**
- Node.js 14.17.0
- Express 4.18.2
- Socket.IO 4.5.1
- Mocha 10.2.0

**Client side**
- p5.js 1.3.1

## Game Rules
Room must be at least 2 users in the room, and up to 5 users. Once users in the room are ready, lock the room. Nobody else can enter the room.
If a user leaves the room while the room was locked, reset all users in the room back to not ready state. A loser may leave the room.
if a user lose, disable the user untill the winner is selected. The same users can rematch after the game.

While engaging the game, users shoud not know other users choice (this is obvious but still it needs to be coded...)

