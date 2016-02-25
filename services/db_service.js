/**
 * Created by Matuszewski on 04/02/16.
 */

var uiBackendCommons = require('./ui_backend_commons')();


module.exports = function (schema, io) {
  var schema = schema;
  var r = schema.r;
  var movies_dictionary = require('../helpers/movies_dictionary');
  var movies = movies_dictionary.movies;
  var movie_labels = movies_dictionary.movies_labels;
  var movie_colors = movies_dictionary.movies_colors;
  var aggregatedCache = {time: []};
  var overallCounter = (function(){
    var c = {};
    movies.forEach(function(title){
      c[title] = 0;
    });
    return c;
  })();



  function initialResult() {
    var minutes = [];
    var secondsAgo = 60 * uiBackendCommons.chartMinutesBack;
    var now = new Date();

    for (var i = 0; i < secondsAgo; i++) {
      var counter = {};
      counter[now] = movies.reduce(function (obj, val) {
        obj[val] = 0;
        return obj;
      }, {});
      now = new Date(now - 1000);//decrement one second
      minutes.push(counter);
    }
    return minutes;
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
        .group(function (tweet) {
          return tweet('movies');
        },{multi: true}).count();
  }

  function getTweetCountPerSecondFrom(minutesAgo) {
    var seconds = minutesAgo * 60;
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
          return [
            movie('title'),
            movie('tweet_created_at')
          ];
        }).count();
  }


  function initialize(callback) {
    var aggregated_result = initialResult();
    getTweetCountPerSecondFrom(uiBackendCommons.chartMinutesBack).run().then(function (rows) {
      rows.forEach(function (row) {
        var title = row['group'].splice(0, 1)[0];
        var date = row['group'][0];
        var time = new Date(date);
        aggregated_result.forEach(function (counter) {
          var key = new Date(Object.keys(counter)[0]);
          if (key == time || key > time) {
            counter[key][title] += row.reduction;
          }
        });
      });


      aggregated_result.forEach(function (value) {
        var key = Object.keys(value)[0];
        aggregatedCache['time'].push(new Date(key));
        Object.keys(value[key]).forEach(function (k) {
          var val = value[key][k];
          if (!aggregatedCache[k]) {
            aggregatedCache[k] = [];
          }
          aggregatedCache[k].push(val);
        });
      });

      getAllTweetsBefore(0).run().then(function(rows){
        rows.forEach(function(row){
          overallCounter[row['group']] = row['reduction'];
        });
        if (callback) {
          callback();
        }
      });
    });

  }
  function sendCache(socket) {
    socket.emit('initialize_tweet_aggregated', aggregatedCache);
  }
  function listenForChanges(callback) {

    schema.tweet.changes().then(function (feed) {
      feed.each(function (error, doc) {
        if (doc.getOldValue()) {
          return
        }
        var mappedRow = {
          date: doc['created_at'],
          text: doc['text'],
          movies: doc['movies'],
          sentiment: doc['sentiment'],
          lang: doc['lang']
        };
        uiBackendCommons.updateCache(aggregatedCache, true, mappedRow);
        uiBackendCommons.updateCounter(overallCounter,mappedRow);
        if (callback) {
          callback(mappedRow);
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
  function sendCountersToActiveSockets(tweet) {

    findClientsSocket().forEach(function (socket) {
      socket.emit('tweet', tweet);
    });

  }
  function sendKeys(socket) {
    socket.emit('structure', {labels: movie_labels, colors: movie_colors,counters: overallCounter})
  }
  function cacheWatch() {
    uiBackendCommons.updateCache(aggregatedCache, true);
  }

  // We need to wait for model to initialise, otherwise we got concurrency problem
  // This is probably not documented but we found it based on the source code
  schema.tweet.model().ready().then(function () {
    console.log('Schema created, starting processing');
    initialize(function () {

      listenForChanges(sendCountersToActiveSockets);
      var interval = setInterval(cacheWatch, 1000);
      io.on('connection', function (socket) {
        console.log('Socket connected');
        sendKeys(socket);
        sendCache(socket);
        socket.on('disconnect', function (socket) {

        })
      });
    });
  })

  return {
    noOfConnections : function(){
      return findClientsSocket().length;
    },
    aggregatedCache: aggregatedCache,
    overallCounter: overallCounter
  }


};





