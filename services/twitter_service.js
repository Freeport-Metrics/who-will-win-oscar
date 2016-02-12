var Tweet = require('../models/tweet');
var movies_dict = require('../helpers/movies_dictionary');

var movies_hashtags = movies_dict.movies_hashtags;
var movies = movies_dict.movies;


module.exports = function(twitter, models){
    var keywords = Object.keys(movies_hashtags);
    twitter.stream('statuses/filter', {track: keywords.join(',')},  function(stream){
    stream.on('data', function(tweet) {
        tweet.movies = [];
        keywords.forEach(function(value, index){
            if(tweet.text.toLowerCase().includes(value.toLowerCase())){
                tweet.movies.push(movies_hashtags[value]);
            }
        })
        if(tweet.movies.length == 0){
            return;
        }
        var db_tweet = models.tweet.find(tweet.id).then(function(){

        }).catch(models.errors.DocumentNotFound, function(err) {
            models.tweet.create(tweet).catch(function(err){

            });
        }).error(function(error) {
            // Unexpected error
        });
    });
    stream.on('error', function(error) {
        console.log(error)
        });
    });
};