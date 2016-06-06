
var pgp = require("pg-promise")();
var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var db = pgp(connectionString);


module.exports = {
    pgp, db
};