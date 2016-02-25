var app = require('express')();
var server = require('http').createServer(app);


/***** CONFIGURATION MODULES *****/
// Adding routes to bootstrapper
require('./routes/routes')(app)

// Adding app configuration to bootstrapper
require('./config/config')(app, __dirname);
// Adding dependencies to bootstrapper
var static_resources = require('./config/static_resources')(__dirname);
app.locals.static_resources =  static_resources;

require('./config/dependencies')(app, __dirname, static_resources);
// Adding error handlers config to bootstrapper
require('./config/error_handlers')(app);
// Adding ORM models to bootstrapper
var schema = require('./schema');
// Adding socket.io to bootstrapper
var io = require('./config/socket.io')(server);
// Adding Twitter API client
var twitter = require('./config/twitter.js');

/***** SERVICE MODULES *****/
var db_service = require('./services/db_service')(schema, io)

require('./services/twitter_service.js')(twitter, schema);

app.locals.pretty = true;
app.locals.db_service = db_service;

module.exports = {
  app: app,
  server: server
};
