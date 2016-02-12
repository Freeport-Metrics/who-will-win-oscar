/**
 * Created by Matuszewski on 04/02/16.
 */
var thinky = require('thinky')(
    {db:'who_will_win_oscars'} // Config
);
var errors = thinky.Errors;
var r = thinky.r

var Tweet = thinky.createModel("Tweet", {
    id: Number,
    text: String,
    source: String,
    title: String,
    content: String,
    idAuthor: String,
    movies: Array,
    created_at: Date
});

var User = thinky.createModel('User', {
    id: Number,
    name: String,
    screen_name: String,
    location: String,
    url: String,
    description: String,
    created_at: String,
    lang: String,
    profile_image_url: String,
});

Tweet.belongsTo(User, 'user', 'userId', 'id');
User.hasMany(Tweet, 'tweets', 'id', 'userId');

Tweet.ensureIndex('created_at');

module.exports = {
    errors: errors,
    tweet: require('./models/Tweet')(r, Tweet),
    user: require('./models/User')(r, User)
};