const express = require("express");
const http = require('http');
const Twitter = require('twitter');
const io = require('socket.io');
const bodyParser = require('body-parser');
const port = process.env.PORT || 3000; 
const fs = require('fs');

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
    console.log("server is live on port " + port)
})

var client = new Twitter({
    consumer_key: process.env.TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.TWITTER_CONSUMER_KEY_SECRET,
    access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
  });

let socketConnection

topic = 'computer'

console.log("stream called")
let stream = client.stream('statuses/filter', {track: topic});

socket.on("connection", socket => {
    console.log("socket connects")

    // on topic change, destroy the old stream, make a new one and connect to it
    socket.on("topic", ( newTopic ) => {
        topic = newTopic
        stream.destroy()
        stream = client.stream('statuses/filter', {track: topic});
        stream.on('data', function(tweet) {
            socket.emit("tweets", tweet);
            //write data to file to combat rate limiting
            // const tweetString = JSON.stringify(tweet)
            // fs.writeFile(sampleData.text, tweetString, (error) => {
            //     console.log(error)
            // })
          });
    })
    
    socket.on("connection", () => console.log("Client connected"));
    socket.on("disconnect", () => console.log("Client disconnected"));
})
    
stream.on('error', function(error) {
    console.log(error)
    throw error;
});