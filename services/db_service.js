/**
 * Created by Matuszewski on 04/02/16.
 */
var extend = require('util')._extend;


module.exports = function (db, io) {
  var r = db.r;
  var movies = ['Revenant', 'Mad Max', 'Martian', 'Brooklyn', 'Room', 'Spotlight', 'Bridge Of Spies', 'Big Short'];
  var lastUpdate = {
    h: 0,
    m: 0,
    time: '00:00'
  };

  var toTime = function(h,m){
    return ('0'+h).slice(-2) + ':' + ('0'+m).slice(-2)
  };

  var currentTime = function() {
    var now = new Date();
    return {
      h: now.getUTCHours(),
      m: now.getUTCMinutes(),
      time: toTime(now.getUTCHours(),now.getUTCMinutes())
    };
  };

  var initialResult = function (minutesAgo,initialValues) {
    var minutes = {};
    if(!minutesAgo){
      minutesAgo = 60;
    }
    var now = new Date();
    var h = now.getUTCHours();
    var m = now.getUTCMinutes();

    for (var i = minutesAgo; i > 0; i--) {
      minutes[toTime(h,m--)] = initialValues ? initialValues : movies.reduce(function (obj, val) {
        obj[val] = 0;
        return obj;
      }, {});
      if (m < 0) {
        m = 59;
        h--;
      }
    }
    return minutes;
  };

  var cached_aggregated = null;
  var cached_temp = null;


  function updateCache(row, cache){
    var time = toTime(row.hour,row.minute);
    if(!cache[time]){
      var initial = cache[lastUpdate.time];
      var now = currentTime();
      var minutesAgo = 60*(now.h - lastUpdate.h) + (now.min - lastUpdate.m);
      var new_vals = initialResult(minutesAgo, initial);
      extend(cache,new_vals);
    }
    row.movies.forEach(function(title){
      cache[time][title] += 1;
    });
    lastUpdate = currentTime();

    return cache[time];
  }


  function getTweetCountPerMinuteFrom(minutes) {
    var seconds = minutes * 60;
    return r.table('Tweet')
        .orderBy({index: 'created_at'})
        .filter(function (tweet) {
          return r.now().sub(tweet('created_at')).lt(seconds);
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

  function initialize(conn, callback) {
    getTweetCountPerMinuteFrom(60).run(conn, function (err, cursor) {
      if (err) throw err;
      var aggregated_result = initialResult();
      var result = initialResult();
      cursor.each(
          function (err, row) {
            if (err) throw err;
            var title = row['group'].splice(0, 1)[0];
            var h = row['group'][0];
            var m = row['group'][1];
            var time = toTime(h,m);

            if (!result[time]) {
              return;
            }
            result[time][title] = row.reduction;
            Object.keys(aggregated_result).forEach(function (key) {
              if (key > time) {
                aggregated_result[key][title] += row.reduction;

              }
            });

          }, function () {
            cached_aggregated = aggregated_result;
            cached_temp = result;
            lastUpdate = currentTime();
            if(callback) {
              callback();
            }
          });
    });
  }

  function sendCache(socket){
    socket.emit('initialize_tweet_aggregated', cached_aggregated);
    socket.emit('initialize_tweet_not_aggregated', cached_temp);
  }

  db.conn.then(function (conn) {

    initialize(conn, function(){
      io.on('connection', function (socket) {
        sendCache(socket);
        db.r.table('Tweet').changes(
            {
              squash: true
            }
        ).map(function(row){
          return {
            hour: row('new_val')('created_at').hours(),
            minute: row('new_val')('created_at').minutes(),
            date: row('new_val')('created_at'),
            text: row('new_val')('text'),
            is_new: row('old_val').eq(null),
            movies: row('new_val')('movies')
          };
        }).run(conn, function (err, cursor) {
          cursor.each(function (err, row)  {
            if (err) {
              throw err;
            }


            if(!row.is_new){
              return;
            }
            var lastValueAgg = updateCache(row,cached_aggregated);
            var lastValue = updateCache(row,cached_temp);

            console.log(lastValueAgg);
            console.log('<<<<<<<>>>>>>>');
            socket.emit('new_tweets_aggregates',lastValueAgg);
            socket.emit('new_tweets',lastValue);
            socket.emit('tweet', row);
          }, function () {
            // finished processing
          });
        });
        socket.on('disconnect', function (socket) {

        })
      });
    });


  })
}



