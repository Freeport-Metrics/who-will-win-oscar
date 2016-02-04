/**
 * Created by Matuszewski on 04/02/16.
 */

module.exports = function (db, io){
  db.conn.then(function(conn){
    io.on('connection', function(socket){
      db.r.table('Tweet').changes(
          {
            squash: true
          }
      ).run(conn, function(err, cursor) {
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
}



