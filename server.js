var express = require("express");
var app = express();
var server = app.listen(process.env.port || 3000);

app.use(express.static('public'));

console.log("Server is running.");
