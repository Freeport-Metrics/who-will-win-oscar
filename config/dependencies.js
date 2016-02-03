/**
 * Created by Matuszewski on 03/02/16.
 */
var path = require('path');
//var favicon = require('serve-favicon');

module.exports = function(app, express, dir){
  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use('/js',  express.static(dir + '/node_modules/angular/'));
  app.use('/js', express.static(dir + '/node_modules/socket.io-client/'));
  app.use(express.static(path.join(dir, 'public')));
}