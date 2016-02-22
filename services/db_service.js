/**
 * Created by Matuszewski on 04/02/16.
 */
module.exports = function (schema, io) {
  var schema = schema;
  var r = schema.r;
  var movies_dictionary = require('../helpers/movies_dictionary');
  var movies = movies_dictionary.movies;
  var movie_labels = movies_dictionary.movies_labels;
  var movie_colors = movies_dictionary.movies_colors;

  var toTime = function (h, m) {
    return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2)
  };


  var initialResult = function (minutesAgo, fromDate, initialValues) {
    var minutes = [];
    if (!minutesAgo) {
      minutesAgo = 60;
    }
    var now = fromDate ? fromDate : new Date();
    var h = now.getUTCHours();
    var m = now.getUTCMinutes();

    for (var i = 0; i < minutesAgo; i++) {
      var counter = {};
      counter[toTime(h, m--)] = initialValues ? JSON.parse(JSON.stringify(initialValues)) : movies.reduce(function (obj, val) {
        obj[val] = 0;
        return obj;
      }, {});

      minutes.push(counter);
      if (m < 0) {
        m = 59;
        h = (h  + 23) % 24;
      }
    }
    return minutes;
  };

  var aggregatedCache = null;
  var tempCache = null;

  function updateCache(row, cache, isAggregated) {
    var time = toTime(row.hour, row.minute);

    if (!cache[0][time]) {
      var last_key = Object.keys(cache[0])[0];

      var initial = isAggregated ? cache[0][last_key] : null;

      var lastUpdate = {
        h: last_key.split(':')[0],
        m: last_key.split(':')[1],
        time: last_key
      };
      var minutesAgo = 60 * ((row.hour - lastUpdate.h + 24) % 24) + (row.minute - lastUpdate.m);
      var newCounters = initialResult(minutesAgo, row.date, initial);
      newCounters.reverse().forEach(function (val) {
        cache.unshift(val);
      });

      cache.splice(-minutesAgo, minutesAgo);
    }
    row.movies.forEach(function (title) {
      cache[0][Object.keys(cache[0])[0]][title] += 1;
    });

    return cache[0];
  }


  function getTweetCountPerMinuteFrom(minutes) {
    var seconds = minutes * 60;
    return r.table('Tweet')
        .orderBy({index: 'created_at'})
        .filter(function (tweet) {
          return r.now().sub(tweet('created_at')).lt(seconds);
        })
        .filter(r.row('movies').contains(function (movie) {
          return r.expr(movies).contains(movie);
        }))
        .concatMap(function (tweet) {
          return tweet('movies').distinct().map(function (title) {
            return {
              title: title,
              'tweet_created_at': tweet('created_at')
            }
          });
        })
        .group(function (movie) {
          return [movie('title'), movie('tweet_created_at').hours(), movie('tweet_created_at').minutes()];
        }).count();
  }

  function getAllTweetsBefore(minutes) {
    var seconds = minutes * 60;
    return r.table('Tweet')
        .orderBy({index: 'created_at'})
        .filter(function (tweet) {
          return r.now().sub(seconds).gt(tweet('created_at'));
        })
        .filter(r.row('movies').contains(function (movie) {
          return r.expr(movies).contains(movie);
        }))
        .concatMap(function (tweet) {
          return tweet('movies').distinct().map(function (title) {
            return {
              title: title
            }
          });
        })
        .group(function (movie) {
          return movie('title');
        }).count();
  }

  function initialize(callback) {
    var aggregated_result = initialResult();
    var result = initialResult();
    tempCache = result;
    getTweetCountPerMinuteFrom(60).run().then(function (rows) {
      rows.forEach(function (row) {
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
      });
      getAllTweetsBefore(60).run().then(function (rows) {
        rows.forEach(function (row) {
          aggregated_result.forEach(function (counter) {
            counter[Object.keys(counter)[0]][row['group']] += row['reduction'];
          });
        });
        aggregatedCache = aggregated_result;
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

  function listenForChanges(callback) {

    schema.tweet.changes().then(function (feed) {
      feed.each(function (error, doc) {
        if (doc.getOldValue()) {
          return
        }
        var mappedRow = {
          hour: doc['created_at'].getUTCHours(),
          minute: doc['created_at'].getUTCMinutes(),
          date: doc['created_at'],
          text: doc['text'],
          movies: doc['movies'],
          sentiment: doc['sentiment']
        };
        var lastCounterAggregated = updateCache(mappedRow, aggregatedCache, true);
        var lastCounter = updateCache(mappedRow, tempCache, false);
        if (callback) {
          callback(mappedRow, lastCounter, lastCounterAggregated);
        }
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

  function sendKeys(socket) {
    socket.emit('structure', {labels: movie_labels, colors: movie_colors})
  }

  // We need to wait for model to initialise, otherwise we got concurrency problem
  // This is probably not documented but we found it based on the source code
  schema.tweet.model().ready().then(function () {
    console.log('Schema created, starting processing');
    initialize(function () {

      listenForChanges(sendCountersToActiveSockets);

      io.on('connection', function (socket) {
        console.log('Socket connected');
        sendKeys(socket);
        sendCache(socket);
        socket.on('disconnect', function (socket) {

        })
      });
    });
  })


};



