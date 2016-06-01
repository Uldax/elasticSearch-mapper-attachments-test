"use strict";

var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/opus';
var pgp = require('pg-promise')();
var db = pgp(connectionString);


var documentModel = {
    getFileInfoById: function (version_id) {
        //TODO create view
        return db.one('SELECT version_id,label,valid,path,file_id FROM file.version WHERE version_id = $1', version_id);
    },


}


module.exports = documentModel;

