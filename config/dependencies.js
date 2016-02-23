/**
 * Created by Matuszewski on 03/02/16.
 */
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');

module.exports = function(app, dir){
  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
  app.use('/fonts', express.static(dir + '/node_modules/font-awesome/fonts/'));
  app.use(express.static(path.join(dir, 'public')));

}