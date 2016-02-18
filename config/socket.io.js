/**
 * Created by Matuszewski on 04/02/16.
 */
// Socket.io related server

module.exports = function(server){
  return require('socket.io')(server);
}