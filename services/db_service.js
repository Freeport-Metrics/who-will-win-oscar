/**
 * Created by Matuszewski on 04/02/16.
 */



module.exports = function (db, io) {
  var r = db.r;

  function getTweetCount() {
    return r.table('Tweet').concatMap(function (tweet) {
      return tweet('movies').map(function (title) {
        return {title: title}
      });
    }).group(function (movie) {
      return movie('title');
    }).count();
  }

  db.conn.then(function (conn) {
    io.on('connection', function (socket) {
      db.r.table('Tweet').changes(
          {
            squash: true
          }
      ).run(conn, function (err, cursor) {
        cursor.each(function (err, row) {
          if (err) {
            throw err;
          }
          getTweetCount().run(conn, function (err, cursor) {
            if (err) throw err;
            var result = {}
            cursor.each(function (err, row) {
              if (err) throw err;
              result[row['group']]=row['reduction'];
            },function(){
              // resulting json is an object with movie titles as keys and tweet counts as values e.g:
              //{
              //  "Big Short": 65,
              //    "Bridge Of Spies": 18,
              //    "Brooklyn": 709,
              //    "Mad Max": 151,
              //    "Martian": 167,
              //    "Revenant": 436,
              //    "Room": 12296,
              //    "Spotlight": 935
              //}
              socket.emit('tweet_counters', result);
              socket.emit('tweet', result);
            });
          });

        }, function () {
          // finished processing
        });
      });
    });
  })
}



