var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var r = require('rethinkdb');
var app = express();

var server = require('http').createServer(express);
var io = require('socket.io')(server);

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

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());

// Adding ORM models to bootstrapper
require('./models/models')
// Adding routes to bootstrapper
require('./routes/routes')(app)
// Adding dependencies to bootstrapper
require('./config/dependencies')(app, express, path, __dirname)

// External dependencies config


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
