var Tweet = require('../models/tweet');

var movies_hashtags = ['#Revenant', '#MadMax', '#Martian', '#Brooklyn', '#Room', '#Spotlight', '#BridgeOfSpies', '#BigShort']
var movies = ['Revenant', 'Mad Max', 'Martian', 'Brooklyn', 'Room', 'Spotlight', 'Bridge Of Spies', 'Big Short']


module.exports = function(twitter, models){
    //testing stream api
    twitter.stream('statuses/filter', {track: movies.join(',')},  function(stream){
    stream.on('data', function(tweet) {
        tweet.movies = [];
        movies.forEach(function(value, index){
            if(tweet.text.toLowerCase().indexOf(value.toLowerCase())>=0){
                tweet.movies.push(value);
            }
        })
        models.tweet.create(tweet);
        console.log(tweet)
    });

    stream.on('error', function(error) {
        console.log(error)
        });
    });

};