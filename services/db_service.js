/**
 * Created by Matuszewski on 04/02/16.
 */
var db = require('../config/db')
var io = require('../config/socket.io')

db.conn.then(function(conn){
  io.on('connection', function(socket){
    db.r.table('test').changes().run(conn, function(err, cursor) {
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



