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

  var toTime = function (h, m, s) {
    return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2)
  };


  var initialResult = function (secondsAgo, fromDate, initialValues) {
    var minutes = [];
    if (!secondsAgo) {
      secondsAgo = 3600;
    }
    var now = fromDate ? fromDate : new Date();
    var h = now.getUTCHours();
    var m = now.getUTCMinutes();
    var s = now.getUTCSeconds();

    for (var i = 0; i < secondsAgo; i++) {
      var counter = {};
      counter[toTime(h, m,s--)] = initialValues ? JSON.parse(JSON.stringify(initialValues)) : movies.reduce(function (obj, val) {
        obj[val] = 0;
        return obj;
      }, {});

      minutes.push(counter);
      if(s < 0) {
        s = 59;
        m--;
        if (m < 0) {
          m = 59;
          h = (h + 23) % 24;
        }
      }
    }
    return minutes;
  };

  var generateKeys = function (secondsAgo, fromDate) {
    var keys = [];
    var h = fromDate.getUTCHours();
    var m = fromDate.getUTCMinutes();
    var s = fromDate.getUTCSeconds();

    for (var i = 0; i < secondsAgo; i++) {
      keys.push(toTime(h, m,s--));
      if(s < 0) {
        s = 59;
        m--;
        if (m < 0) {
          m = 59;
          h = (h + 23) % 24;
        }
      }
    }
    return keys;
  };

  var aggregatedCache = {data:{},time:[]};
  var tempCache = {data:{},time:[]};


  function updateValues(cache, secondsAgo, isAggregated){
    Object.keys(cache.data).forEach(function(title){
      var val = isAggregated ? cache.data[title][0] : 0;
      for(var i = 0; i < secondsAgo; i++) {
        cache.data[title].unshift(val);
      }
      var removed = cache.data[title].splice(-secondsAgo, secondsAgo);
      var removedValue = removed[0];
      if(isAggregated) {
        cache.data[title].map(function(val){return val - removedValue;});
      }
    });

  }

  function updateCache( cache, isAggregated, row) {
    if(!row) {
      var now = new Date();
      var h = now.getUTCHours();
      var m = now.getUTCMinutes();
      var s = now.getUTCSeconds();

      row = {
        hour: h,
        minute: m,
        second: s,
        date: now,
        movies: []
      };
    }

    var time = toTime(row.hour, row.minute,row.second);

    if (cache.time[0] != time) {
      var last_key = cache.time[0];

      var lastUpdate = {
        h: last_key.split(':')[0],
        m: last_key.split(':')[1],
        s: last_key.split(':')[2],
        time: last_key
      };
      var secondsAgo = 3600 * ((row.hour - lastUpdate.h + 24) % 24) + (row.minute - lastUpdate.m) * 60 + (row.second - lastUpdate.s);
      updateValues(cache, secondsAgo, isAggregated);
      var newKeys = generateKeys(secondsAgo, row.date);
      newKeys.unshift(0);
      newKeys.unshift(0);
      cache.time.splice.apply(cache.time,newKeys);
      cache.time.splice(-secondsAgo,secondsAgo);

    }

    row.movies.forEach(function (title) {
      cache.data[title][0] += 1;
    });

    return cache[0];
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
          return [movie('title'), movie('tweet_created_at').hours(), movie('tweet_created_at').minutes(),movie('tweet_created_at').seconds()];
        }).count();
  }

  function initialize(callback) {
    var aggregated_result = initialResult();
    var result = initialResult();
    getTweetCountPerSecondFrom(60).run().then(function (rows) {
      rows.forEach(function (row) {
        var title = row['group'].splice(0, 1)[0];
        var h = row['group'][0];
        var m = row['group'][1];
        var s = row['group'][2];
        var time = toTime(h, m,s);
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


      aggregated_result.forEach(function(value){
        var key = Object.keys(value)[0];
        aggregatedCache['time'].push(key);
        Object.keys(value[key]).forEach(function(k){
          var val = value[key][k];
          if( !aggregatedCache.data[k] ){
            aggregatedCache.data[k] = [];
          }
          aggregatedCache.data[k].push(val);
        });
      });
      result.forEach(function(value){
        var key = Object.keys(value)[0];
        tempCache['time'].push(key);
        Object.keys(value[key]).forEach(function(k){
          var val = value[key][k];
          if( !tempCache.data[k] ){
            tempCache.data[k] = [];
          }
          tempCache.data[k].push(val);
        });
      });


      if (callback) {
        callback();
      }
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
          second: doc['created_at'].getUTCSeconds(),
          date: doc['created_at'],
          text: doc['text'],
          movies: doc['movies'],
          sentiment: doc['sentiment'],
          lang: doc['lang']
        };
        updateCache(aggregatedCache, true, mappedRow);
        updateCache(tempCache, false, mappedRow);
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
    socket.emit('structure', {labels: movie_labels, colors: movie_colors})
  }

  function cacheWatch(){
    updateCache(aggregatedCache,true);
    updateCache(tempCache,false);
  }
  // We need to wait for model to initialise, otherwise we got concurrency problem
  // This is probably not documented but we found it based on the source code
  schema.tweet.model().ready().then(function () {
    console.log('Schema created, starting processing');
    initialize(function () {

      listenForChanges(sendCountersToActiveSockets);
      var interval = setInterval(cacheWatch,1000);
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



