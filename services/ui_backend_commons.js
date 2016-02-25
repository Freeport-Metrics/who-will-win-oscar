uiBackendCommonsInit = function () {



  function generateKeys(secondsAgo, fromDate) {
    var keys = [];

    for (var i = 0; i < secondsAgo; i++) {
      keys.push(new Date(fromDate - 1000*i));
    }
    return keys;
  }

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
        for (var j = cache[title].length - 1; j >= 0; j--) {
          cache[title][j] -= removedValue;
        }
      }
    });

  }

  function updateCache(cache, isAggregated, row) {

    if (!row) {

      row = {
        date: new Date(),
        movies: []
      };
    }
    var lastKey = cache.time[0];

    var secondsAgo = Math.floor((row.date - lastKey)/1000);

    if (secondsAgo > 0) {

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
  }

  function updateCounter(counter, row){
    row.movies.forEach(function (title) {
      counter[title] += 1;
    });
  }

  return {
    updateCache: updateCache,
    updateCounter: updateCounter,
    generateKeys: generateKeys,
    chartMinutesBack: 5
  }

};

if (typeof module != 'undefined') {
  module.exports = uiBackendCommonsInit;
}


