/**
 * Created by Matuszewski on 04/02/16.
 */



module.exports = function (db, io){
  var r = db.r;

  function getTweetCount(){
    return r.table('Tweet').concatMap(function(tweet){
      return tweet('movies').map(function(title){return {title: title}});
    }).group(function (movie) {
      return movie('title');
    }).count();
  }

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

          getTweetCount().run(conn,function (err, cursor) {
            if (err) throw err;
            cursor.toArray(function (err, result) {
              if (err) throw err;
              var json = JSON.stringify(result, null, 2);
              // resulting json is an array with objects having two properties
              //[{
              //  "group": "Big Short",
              //    "reduction": 39
              //},
              // {
              // "group": "Big Short",
              // "reduction": 39
              // }]

              socket.emit('tweet', json);
              console.log(json);
            });
          });

        }, function() {
          // finished processing
        });
      });
    });
  })
}



