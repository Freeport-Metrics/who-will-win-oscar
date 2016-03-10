var movies_dict = require('../helpers/movies_dictionary');
// Sentiment analysis module
var sentiment = require('sentiment');

var movies_hashtags = movies_dict.movies_hashtags;
var movies = movies_dict.movies;


module.exports = function (twitter, schema) {
  var keywords = Object.keys(movies_hashtags);
    twitter.on('tweet', function (tweet) {
      tweet.movies = [];
      keywords.forEach(function (value, index) {

        if (tweet.movies.indexOf(movies_hashtags[value]) < 0 && tweet.text.toLowerCase().includes(value.toLowerCase())) {
          tweet.movies.push(movies_hashtags[value]);
        }
      });
      tweet.sentiment = sentiment(tweet.text);
      if (tweet.movies.length == 0) {
        return;
      }
      schema.tweet.find(tweet.id).then(function () {

      }).catch(schema.errors.DocumentNotFound, function (err) {
        console.log('Adding tweet');
        schema.tweet.create(tweet).catch(function (err) {
        });
      }).error(function (error) {
        // Unexpected error
      });
    });
  twitter.on('error', function (error) {
    console.log(error)
  });

  for (var key in movies_hashtags){
    if(movies_hashtags.hasOwnProperty(key)){
      twitter.track(key);
    }
  }
};