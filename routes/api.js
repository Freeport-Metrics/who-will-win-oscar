/**
 * Created by Matuszewski on 03/02/16.
 */
var thinky = require('thinky')();

// Create a model - the table is automatically created
var Tweet = thinky.createModel("Tweets", {
  id: String,
  title: String,
  content: String,
  idAuthor: String
});


//exports.tweets = function (req, res) {
//  Tweet.orderBy({index: r.desc('date')}).getJoin({author: true, comments: {_order: "date"}}).run().then(function(posts) {
//    res.json({
//      posts: posts
//    });
//  }).error(handleError(res));
//};