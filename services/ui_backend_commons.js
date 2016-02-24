uiBackendCommonsInit = function () {

  function toTime(h, m, s) {
    return ('0' + h).slice(-2) + ':' + ('0' + m).slice(-2) + ':' + ('0' + s).slice(-2)
  }

  function generateKeys(secondsAgo, fromDate) {
    var keys = [];
    var h = fromDate.getUTCHours();
    var m = fromDate.getUTCMinutes();
    var s = fromDate.getUTCSeconds();

    for (var i = 0; i < secondsAgo; i++) {
      keys.push(toTime(h, m, s--));
      if (s < 0) {
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

  function updateValues(cache, secondsAgo, isAggregated) {
    Object.keys(cache).forEach(function (title) {
      if (title == 'time') return;
      var val = isAggregated ? cache[title][0] : 0;
      for (var i = 0; i < secondsAgo; i++) {
        cache[title].unshift(val);
      }
      var removed = cache[title].splice(-secondsAgo, secondsAgo);
      var removedValue = removed[0];
      if (isAggregated) {
        cache[title].map(function (val) {
          return val - removedValue;
        });
      }
    });

  }

  function updateCache(cache, isAggregated, row) {
    if (!row) {
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

    var time = toTime(row.hour, row.minute, row.second);

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
      cache.time.splice.apply(cache.time, newKeys);
      cache.time.splice(-secondsAgo, secondsAgo);

    }

    row.movies.forEach(function (title) {
      cache[title][0] += 1;
    });

    return cache[0];
  }

  return {
    updateCache: updateCache,
    toTime: toTime,
    chartMinutesBack: 5
  }

};

if (typeof module != 'undefined') {
  module.exports = uiBackendCommonsInit;
}


