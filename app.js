var app = require('express')();
var server = require('http').createServer(app);


/***** CONFIGURATION MODULES *****/
// Adding routes to bootstrapper
require('./routes/routes')(app)

// Adding app configuration to bootstrapper
require('./config/config')(app, __dirname);
// Adding dependencies to bootstrapper
require('./config/dependencies')(app, __dirname);
// Adding error handlers config to bootstrapper
require('./config/error_handlers')(app);
// Adding ORM models to bootstrapper
var schema = require('./schema');
// Adding socket.io to bootstrapper
var io = require('./config/socket.io')(server);
// Adding Twitter API client
var twitter = require('./config/twitter.js');

/***** SERVICE MODULES *****/
require('./services/db_service')(schema, io)

require('./services/twitter_service.js')(twitter, schema);

module.exports = {
  app: app,
  server: server
};
