/**
 * Created by Matuszewski on 03/02/16.
 */
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');

module.exports = function(app, dir){
  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use('/js',  express.static(dir + '/node_modules/angular/'));
  app.use('/js',  express.static(dir + '/node_modules/angular-sanitize/'));
  app.use('/js', express.static(dir + '/node_modules/socket.io-client/'));
  app.use('/js', express.static(dir + '/node_modules/c3/'));
  app.use('/js', express.static(dir + '/node_modules/d3/'));
  app.use('/js', express.static(dir + '/node_modules/epoch-charting/dist/js/'));
  app.use('/js', express.static(dir + '/node_modules/jquery/dist/'));
  app.use('/fonts', express.static(dir + '/node_modules/font-awesome/fonts/'));
  app.use('/css', express.static(dir + '/node_modules/font-awesome/css/'));
  app.use('/css', express.static(dir + '/node_modules/epoch-charting/dist/css/'));
  app.use('/css', express.static(dir + '/node_modules/bootstrap/dist/css/'));
  app.use(express.static(path.join(dir, 'public')));
}