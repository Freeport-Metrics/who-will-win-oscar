/**
 * Created by Matuszewski on 04/02/16.
 */
module.exports = function(r, model){

  const Tweet = model;

  return {

    update: function(params){
      return Tweet.merge(params).save();
    },

    find: function(params) {
      return Tweet.get(params)
    },

    create: function(params){
      var tweet  = new Tweet(params)
      return tweet.saveAll({user:true});
    }
  }
}
