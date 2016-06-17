"use strict";

var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var pgp = require('pg-promise')();
var db = pgp(connectionString);

function onError(err) {
    console.log(err.message || err);
    Promise.reject(err.message || err);
}


var documentModel = {
    //For document update
    getFilesInfo: function () {
        return db.any('SELECT file.file.file_id, file.file.label, file.version.path, file.version.version_id, file.version.log_data_id FROM file.file ' +
            'INNER JOIN file.version ON file.file.file_id = file.version.file_id');
    },

    getVersionById: function (log_data_id) {
        return db.one('SELECT version_id,label,log_data_id,valid,path,file_id FROM file.version WHERE log_data_id = $1', log_data_id);
    },


    getVersionIdByFileLabel: function (file_name) {
        return db.any("SELECT file.version.version_id FROM file.file INNER JOIN file.version " +
            "ON file.version.file_id = file.file.file_id WHERE file.label = $1", [file_name]);
    },

    getFile_GroupByLogData: function (log_data_id) {
        return db.one("SELECT file_id,group_id FROM file_group WHERE log_data_id = $1", [log_data_id]);
    }

}

module.exports = documentModel;

