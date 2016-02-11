var Tweet = require('../models/tweet');
                    //              FuryRoad    #TheMartian
var movies_hashtags = {
    '#Revenant': 'Revenant',
    '@RevenantMovie': 'Revenant',
    '#MadMax': 'Mad Max',
    '#RoadFury': 'Mad Max',
    '@MadMax4FuryRoad': 'Mad Max',
    '#TheMartian': 'Martian',
    '@MartianMovie': 'Martian',
    '#BrooklynMovie': 'Brooklyn',
    '#roommovie': 'Room',
    '@RoomTheMovie': 'Room',
    '#SpotlightMovie': 'Spotlight',
    '@SpotlightMovie': 'Spotlight',
    '#BridgeOfSpies': 'Bridge Of Spies',
    '@BridgeofSpies': 'Bridge Of Spies',
    '#BigShort': 'Big Short',
    '@thebigshort': 'Big Short',
    '#TheBigShort': 'Big Short'
};
var movies = ['Revenant', 'Mad Max', 'Martian', 'Brooklyn', 'Room', 'Spotlight', 'Bridge Of Spies', 'Big Short']


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