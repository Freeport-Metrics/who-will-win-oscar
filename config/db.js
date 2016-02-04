/**
 * Created by Matuszewski on 04/02/16.
 */
var r = require('rethinkdb');

// Connecting to rethinkDB
var conn = r.connect({db: 'test'});

module.exports = {
  conn: conn,
  r: r
};