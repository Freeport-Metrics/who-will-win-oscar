/**
 * Created by Matuszewski on 04/02/16.
 */
module.exports = function(r, model){

  const User = model;

  return {
    create: function(params){
      var user  = new User(params)
      return user.save();
    }
  }
}
