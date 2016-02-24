/**
 * Created by Matuszewski on 03/02/16.
 */
var express = require('express');
var path = require('path');

//var favicon = require('serve-favicon');

module.exports = function (app, dir, static_resources) {
  // uncomment after placing your favicon in /public
  //app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

  [static_resources.js, static_resources.css].forEach(function (resource_set) {
    resource_set.forEach(function (resource) {
      var path = dir + '/' + resource;
      app.use('/' + resource, express.static(path));
    });
  });

  app.use('/node_modules/font-awesome/fonts/', express.static(dir + '/node_modules/font-awesome/fonts/'));
  app.use('/fonts', express.static(dir + '/node_modules/font-awesome/fonts/'));
  app.use('/public', express.static(dir + '/public'));
  app.use(express.static(path.join(dir, 'public')));

}