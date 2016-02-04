var Tweet = require('../models/tweet');

module.exports = function(twitter, models){
    //testing stream api
    twitter.stream('statuses/filter', {track: 'oscar'},  function(stream){
    stream.on('data', function(tweet) {
        models.tweet.create(tweet);
    });

    stream.on('error', function(error) {
        });
    });

};