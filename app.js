var express = require('express');
var app = express();

require('dotenv').config();

/***** CONFIGURATION MODULES *****/
/*****  OTHER MODULES *****/
// Adding ORM models to bootstrapper
require('./models/models')
// Adding routes to bootstrapper
require('./routes/routes')(app)
// Adding app configuration to bootstrapper
require('./config/config')(app, __dirname)
// Adding dependencies to bootstrapper
require('./config/dependencies')(app, __dirname)
// Adding error handlers config to bootstrapper
require('./config/error_handlers')(app)
// Adding rethinkdb to bootstrapper
require('./config/db')
// Adding socket.io to bootstrapper
require('./config/socket.io')
// Adding Twitter API client
var twitter = require('./config/twitter.js');

//testing stream api
twitter.stream('statuses/filter', {track: 'oscar'},  function(stream){
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
