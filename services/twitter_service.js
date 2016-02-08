var Tweet = require('../models/tweet');

var movies_hashtags = ['#Revenant', '#MadMax', '#Martian', '#Brooklyn', '#Room', '#Spotlight', '#BridgeOfSpies', '#BigShort']
var movies = ['Revenant', 'Mad Max', 'Martian', 'Brooklyn', 'Room', 'Spotlight', 'Bridge Of Spies', 'Big Short']


module.exports = function(twitter, models){
    //testing stream api
    twitter.stream('statuses/filter', {track: movies.join(',')},  function(stream){
    stream.on('data', function(tweet) {
        tweet.movies = [];
       // console.log(tweet)
        movies.forEach(function(value, index){
            if(tweet.text.toLowerCase().includes(value.toLowerCase())){
                tweet.movies.push(value);
            }
        })
       // console.log(tweet)
        if(tweet.movies.length == 0){
            return;
        }
        var db_tweet = models.tweet.find(tweet.id).then(function(){
            db_tweet.update(tweet);
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