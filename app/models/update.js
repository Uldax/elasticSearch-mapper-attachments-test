"use strict";

var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/opus';
var pgp = require('pg-promise')();
var db = pgp(connectionString);


var updateModel = {
    getUpdates: function (pin_id) {
        //TODO create view
        return db.any("SELECT update_id,update.type_id,op,type.table_name FROM public.update NATURAL JOIN content.type ORDER BY updated ASC ");
    },


}


module.exports = updateModel;

