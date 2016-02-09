/**
 * Created by Matuszewski on 04/02/16.
 */



module.exports = function (db, io) {
  var r = db.r;
  var movies = ['Revenant', 'Mad Max', 'Martian', 'Brooklyn', 'Room', 'Spotlight', 'Bridge Of Spies', 'Big Short'];

  var initialResult = function (){
    var minutes = {};
    var now = new Date();
    var h = now.getUTCHours();
    var m = now.getUTCMinutes();

    for(var i = 60; i > 0; i-- ){
      minutes[h+':'+(m<10 ? '0' : '')+m--] = movies.reduce(function(obj,val){
        obj[val] = 0;
        return obj;
      },{});
      if( m < 0 ){
        m = 59;
        h--;
      }
    }
    return minutes;
  };

  function getTweetCountPerMinuteFrom(minutes) {
    var seconds = minutes * 60;
    return r.table('Tweet')
        .orderBy({index: 'created_at'})
        .filter(function (tweet) {
          return r.now().sub(tweet('created_at')).le(seconds);
        })
        .concatMap(function (tweet) {
          return tweet('movies').map(function (title) {
            return {
              title: title,
              tweet_created_at: tweet('created_at')
            }
          });
        })
        .group(function (movie) {
          return [movie('title'), movie('tweet_created_at').hours(), movie('tweet_created_at').minutes()];
        }).count();
  }
  function getTweetCount() {
    return r.table('Tweet').concatMap(function (tweet) {
      return tweet('movies').map(function (title) {
        return {title: title}
      });
    }).group(function (movie) {
      return movie('title');
    }).count();
  }

  function getTweetCountAndSendEvents(conn, socket) {
    getTweetCountPerMinuteFrom(60).run(conn, function (err, cursor) {
      if (err) throw err;
      var aggregated_result = initialResult();
      var result = initialResult();
      var rows = [];
      cursor.each(
          function (err, row) {
            if (err) throw err;
            var title = row['group'].splice(0,1)[0];
            var hour = row['group'].join(':');
            result[hour][title] =  row.reduction;
            rows.push({hour: row['group'][0],minute: row['group'][1], time: hour, title: title, count: row.reduction});
          }, function () {

            rows.sort(function(a,b){
              return (a.hour - b.hour)*60 + a.minute - b.minute;
            });
            for(var i = 0; i < rows.length; i++){
              aggregated_result[rows[i].time][rows[i].title] += rows[i].count;
              for(var j = i+1; j < rows.length;j++){
                aggregated_result[rows[j].time][rows[i].title] += rows[i].count;
              }
            }

            socket.emit('tweet_aggregated', aggregated_result);
            socket.emit('tweet_not_aggregated', result);
          });

    });

    getTweetCount().run(conn, function (err, cursor) {
      if (err) throw err;
      var result = {}
      var rows = []
      cursor.each(function (err, row) {
        if (err) throw err;
        rows.push({'name': row['group'], 'value': row['reduction']});
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

        socket.emit('tweet_counters', rows);
      });
    });
  }

  db.conn.then(function (conn) {
    io.on('connection', function (socket) {
      getTweetCountAndSendEvents(conn, socket);
      db.r.table('Tweet').changes(
          {
            squash: true
          }
      ).run(conn, function (err, cursor) {
        cursor.each(function (err, row) {
          if (err) {
            throw err;
          }
          socket.emit('tweet', row);
          getTweetCountAndSendEvents(conn, socket);
        }, function () {
          // finished processing
        });
      });
    });
  })
}



