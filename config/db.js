/**
 * Created by Matuszewski on 04/02/16.
 */
var r = require('rethinkdb');

var DB_NAME = 'who_will_win_oscars'

// Connecting to rethinkDB
var conn = r.connect({db: DB_NAME});

module.exports = {
  conn: conn,
  r: r,
};