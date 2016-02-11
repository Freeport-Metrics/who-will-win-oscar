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

  var toTime = function (h, m) {
    return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2)
  };

  var currentTime = function () {
    var now = new Date();
    return {
      h: now.getUTCHours(),
      m: now.getUTCMinutes(),
      time: toTime(now.getUTCHours(), now.getUTCMinutes())
    };
  };

  var initialResult = function (minutesAgo, initialValues) {
    var minutes = [];
    if (!minutesAgo) {
      minutesAgo = 60;
    }
    var now = new Date();
    var h = now.getUTCHours();
    var m = now.getUTCMinutes();

    for (var i = 0; i < minutesAgo; i++) {
      var counter = {};
      counter[toTime(h, m--)] = initialValues ? initialValues : movies.reduce(function (obj, val) {
        obj[val] = 0;
        return obj;
      }, {});

      minutes.push(counter);
      if (m < 0) {
        m = 59;
        h--;
      }
    }
    return minutes;
  };

  var aggregatedCache = null;
  var tempCache = null;
  var cacheCapacity = 60;

  function updateCache(row, cache) {
    var time = toTime(row.hour, row.minute);

    if (!cache[0][time]) {
      var initial = cache[lastUpdate.time];
      var now = currentTime();
      var minutesAgo = 60 * (now.h - lastUpdate.h) + (now.m - lastUpdate.m);
      var newCounters = initialResult(minutesAgo, initial);

      newCounters.reverse().forEach(function (val) {
        cache.unshift(val);
      });

      cache.splice(-minutesAgo, minutesAgo);
    }
    row.movies.forEach(function (title) {
      cache[0][time][title] += 1;
    });
    lastUpdate = {
      h: time.split(':')[0],
      m: time.split(':')[1],
      time: time
    };
    return cache[0];
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
            var time = toTime(h, m);


            result.forEach(function (counter) {
              if (counter[time]) {
                counter[time][title] = row.reduction;
                return false;
              }
            });
            aggregated_result.forEach(function (counter) {
              var key = Object.keys(counter)[0];
              if (key == time || key > time) {
                counter[key][title] += row.reduction;
              }
            });
          }, function () {
            aggregatedCache = aggregated_result;
            tempCache = result;
            var last_key = Object.keys(aggregatedCache[0])[0];
            lastUpdate = {
              h: last_key.split(':')[0],
              m: last_key.split(':')[1],
              time: last_key
            };
            if (callback) {
              callback();
            }
          });
    });
  }

  function sendCache(socket) {
    socket.emit('initialize_tweet_aggregated', aggregatedCache);
    socket.emit('initialize_tweet_not_aggregated', tempCache);
  }

  function listenForChanges(conn, callback) {
    db.r.table('Tweet').changes(
        {
          squash: true
        }
    ).map(function (row) {
      return {
        hour: row('new_val')('created_at').hours(),
        minute: row('new_val')('created_at').minutes(),
        date: row('new_val')('created_at'),
        text: row('new_val')('text'),
        is_new: row('old_val').eq(null),
        movies: row('new_val')('movies')
      };
    }).run(conn, function (err, cursor) {
      cursor.each(function (err, row) {
        if (err) {
          throw err;
        }


        if (!row.is_new) {
          return;
        }
        var lastCounterAggregated = updateCache(row, aggregatedCache);
        var lastCounter = updateCache(row, tempCache);
        if (callback) {
          callback(row, lastCounter, lastCounterAggregated);
        }

      }, function () {
        // finished processing
      });
    });
  }

  function findClientsSocket(roomId, namespace) {
    var res = [];
    var ns = io.of(namespace || "/");    // the default namespace is "/"

    if (ns) {
      for (var id in ns.connected) {
        if (roomId) {
          var index = ns.connected[id].rooms.indexOf(roomId);
          if (index !== -1) {
            res.push(ns.connected[id]);
          }
        } else {
          res.push(ns.connected[id]);
        }
      }
    }
    return res;
  }

  function sendCountersToActiveSockets(tweet, lastCounter, lastCounterAggregated) {

    findClientsSocket().forEach(function (socket) {
      socket.emit('new_tweets_aggregates', lastCounterAggregated);
      socket.emit('new_tweets', lastCounter);
      socket.emit('tweet', tweet);
    });

  }


  db.conn.then(function (conn) {

    initialize(conn, function () {

      var sockets = [];
      listenForChanges(conn, sendCountersToActiveSockets);

      io.on('connection', function (socket) {
        sendCache(socket);
        sockets.push(socket);
        socket.on('disconnect', function (socket) {

        })
      });
    });


  })
};



