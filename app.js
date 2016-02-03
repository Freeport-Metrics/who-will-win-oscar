var express = require('express');
var app = express();
var r = require('rethinkdb');
require('dotenv').config();
// Socket.io related server
var server = require('http').createServer(express);
var io = require('socket.io')(server);

// Connecting to rethinkDB
var conn = r.connect({db: 'test'});

conn.then(function(conn){
  io.on('connection', function(socket){
    r.table('test').changes().run(conn, function(err, cursor) {
      cursor.each(function(err, row) {
        if (err){
          throw err;
        }
        socket.emit('tweet', row);
      }, function() {
        // finished processing
      });
    });
  });
})

server.listen(3001);

// Adding app configuration to bootstrapper
require('./config/config')(app, __dirname)
// Adding ORM models to bootstrapper
require('./models/models')
// Adding routes to bootstrapper
require('./routes/routes')(app)
// Adding dependencies to bootstrapper
require('./config/dependencies')(app, express, __dirname)
// Adding error handlers config to bootstrapper
require('./config/error_handlers')(app)

// Adding Twitter API client
var twitter = require('./helpers/twitter-parser.js');

//testing stream api
twitter.twitterClient.stream('statuses/filter', {track: 'oscar'},  function(stream){
  stream.on('data', function(tweet) {
    console.log('<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>')
    console.log(tweet);
    console.log('<<<<<<<<<<<<<<<>>>>>>>>>>>>>>>')
  });

  stream.on('error', function(error) {
    console.log(error);
  });
});


module.exports = app;
