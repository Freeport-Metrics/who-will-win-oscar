var db = require('../config/db');
var r = db.r;
require('dotenv').config();
var twitter = require('../config/twitter.js');
var movies_dictionary = require('../helpers/movies_dictionary');
var models = require('../schema');
var urlgrey = require('urlgrey');
var url = urlgrey("https://user:pass@subdomain.asdf.com/path/kid?asdf=1234#frag")
Object.keys(movies_dictionary.movies_hashtags).forEach(function(keyword) {
  console.log('Looking for: '+keyword);
  twitter.get('search/tweets', {q: url.encode(keyword),count: 1000}, function(error, tweets, response){
    console.log('Found '+tweets.statuses.length+' tweets');
    tweets.statuses.forEach(function(tweet){
      models.tweet.find(tweet.id).then(function(db_tweet){
        if(db_tweet.movies.indexOf(movies_dictionary.movies_hashtags[keyword]) < 0){
          db_tweet.movies.push(movies_dictionary.movies_hashtags[keyword]);
          db_tweet.save();
        }
      }).catch(models.errors.DocumentNotFound, function(err) {
        tweet.movies = [movies_dictionary.movies_hashtags[keyword]];
        models.tweet.create(tweet).catch(function(err){
        });
      }).error(function(error) {
        // Unexpected error
      });

    });
  });
});
