var Twitter = require('node-tweet-stream'),
    twitterClient = new Twitter({
  consumer_key: process.env.CONSUMER_KEY,
  consumer_secret: process.env.CONSUMER_SECRET,
  token: process.env.ACCESS_TOKEN_KEY,
  token_secret: process.env.ACCESS_TOKEN_SECRET
});

module.exports = twitterClient;