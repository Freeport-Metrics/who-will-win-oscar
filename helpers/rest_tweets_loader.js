var db = require('../config/db');
var r = db.r;
require('dotenv').config();
var twitter = require('../config/twitter.js');


twitter.get('search/tweets', {q: 'node.js'}, function(error, tweets, response){
  console.log(tweets);
});