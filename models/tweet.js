/**
 * Created by Matuszewski on 03/02/16.
 */
var thinky = require('thinky')();

var Tweet = thinky.createModel("Tweets", {
  id: String,
  title: String,
  content: String,
  idAuthor: String
});

