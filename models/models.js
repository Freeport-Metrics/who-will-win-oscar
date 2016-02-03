/**
 * Created by Matuszewski on 03/02/16.
 */
'use strict';
var fs = require('fs');
var path = require('path');
module.exports = function(app){
  fs.readdirSync('./models').forEach(function (file) {
    if (file === path.basename(__filename))
    {
      return;
    }
    require('./' + file)(app);
  });
}