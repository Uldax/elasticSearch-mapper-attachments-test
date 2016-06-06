"use strict";

var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var pgp = require('pg-promise')();
var db = pgp(connectionString);


var updateModel = {
    getUpdates: function () {
        //TODO create view
        return db.any("SELECT update_id,update.type_id,op,type.table_name FROM public.update NATURAL JOIN content.type ORDER BY updated ASC ");
    },

    deleteUpdate: function (update_id, type_id) {
        return db.none("DELETE FROM public.update WHERE update_id = $1 AND type_id = $2", [update_id, type_id]);
    },

    deleteUpdates: function (update_id, type_id) {
        return db.none("DELETE FROM public.update");
    }


}


module.exports = updateModel;

