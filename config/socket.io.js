/**
 * Created by Matuszewski on 04/02/16.
 */
// Socket.io related server
var express = require('express');
var server = require('http').createServer(express);
var io = require('socket.io')(server);

server.listen(3001);

module.exports = io