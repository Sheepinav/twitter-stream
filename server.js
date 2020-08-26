const express = require("express");
const http = require('http');
const Twitter = require('twitter');
const io = require('socket.io');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000; 

const app = express();
require('dotenv').config({ path: './.env' })

const server = http.createServer(app);
const socket = io(server)

app.use(bodyParser.json())
app.use(express.static(__dirname + '/public'))

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
})

server.listen(port, () => {
    console.log(port)
})

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_KEY_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

let socketConnection

// const stream = () =>{
//     console.log("stream called")
//     client.stream('statuses/filter', {track: 'convention'}, (stream) => {
//     stream.on('data', tweet => {
//         socketConnection.emit("tweets", tweet);
//         console.log(tweet)
//     })
// })};

console.log("stream called")
var stream = client.stream('statuses/filter', {track: 'convention'});

socket.on("connection", socket => {
    console.log("socket connects")
    //socketConnection = socket;
    stream.on('data', function(tweet) {
        //console.log(event && event.text);
        socket.emit("tweets", tweet);
        
        //console.log(socket.emit("tweets", event.text))
      });
    socket.on("connection", () => console.log("Client connected"));
    socket.on("disconnect", () => console.log("Client disconnected"));
})


//TODO: find out how to stop stream
// setTimeout(() => {
//     socket.destroy();
// },1000)
    
stream.on('error', function(error) {
    console.log(error)
    throw error;
});