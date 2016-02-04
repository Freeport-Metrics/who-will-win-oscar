
require('../models/tweet');



module.exports = function(app,twitter){
    //testing stream api
    twitter.stream('statuses/filter', {track: 'oscar'},  function(stream){
    stream.on('data', function(tweet) {
        var tweetModel = new Tweet(tweet);
        tweetModel.saveAll();
    });

    stream.on('error', function(error) {
            console.log(error);
        });
    });

};