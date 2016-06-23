"use strict";

var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var pgp = require('pg-promise')();
var db = pgp(connectionString);


var userModel = {
    getGroupsForUser: function (user_id) {
        return db.one("SELECT array (SELECT group_id FROM public.get_administrated_groups_by_user($1))  ;",user_id);
    },
}


module.exports = userModel;

