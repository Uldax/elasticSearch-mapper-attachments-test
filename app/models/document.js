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
    getFileInfoById: function (version_id) {
        return db.one('SELECT version_id,label,valid,path,file_id FROM file.version WHERE version_id = $1', version_id);
    },

    getFilesInfo: function (){
        return db.any('SELECT file.file.file_id, file.file.label, file.version.path, file.version.version_id, file.version.log_data_id FROM file.file ' +
                        'INNER JOIN file.version ON file.file.file_id = file.version.file_id');
    },
    
    //First document insert
    insertFileInFolder: function (folder_name, file_name, file_path) {
        return new Promise(function (resolve, reject) {
            db.one("SELECT folder_id FROM file.folder WHERE label = $1", folder_name).then(function (row) {
                var folder_id = row.folder_id;
                db.one("INSERT INTO file.file (label, folder_id, user_id) VALUES ($1,$2, 1) RETURNING file_id;", [file_name, folder_id]).then(function (row) {
                    var file_id = row.file_id;
                    resolve(documentModel.insertFileVersion(file_id, file_path));
                }).catch(onError)
            }).catch(onError)
        })

    },

    //Second for document update
    insertFileVersion: function (id_file, path) {
        return db.none("INSERT INTO file.version (file_id, label, path, user_id) VALUES " +
            "($1, 'test version 1', $2, 1)", [id_file, path]);
    },

    insertFileVersionByFileLabel: function (file_name, file_path) {
        return new Promise(function (resolve, reject) {
            db.one("SELECT file.file_id FROM file.file WHERE label = $1", [file_name]).then(function (row) {
                var file_id = row.file_id;
                resolve(documentModel.insertFileVersion(file_id, file_path));
            }).catch(onError)
        })
    },

    insertFolder: function (folder_name) {
        return db.none("INSERT INTO file.folder (label, user_id) VALUES ($1, 1);", folder_name);
    },

    getVersionById: function (version_id) {
        return db.one('SELECT version_id,label,valid,path,file_id FROM file.version WHERE version_id = $1', version_id);
    },


    getVersionIdByFileLabel: function (file_name) {
        return db.any("SELECT file.version.version_id FROM file.file INNER JOIN file.version "+
        "ON file.version.file_id = file.file.file_id WHERE file.label = $1", [file_name]);
    },

    deleteFiles: function () {
        return new Promise(function (resolve, reject) {
            db.tx(function (t) {
                // this = t = transaction protocol context;
                // this.ctx = transaction config + state context;
                return t.batch([
                    t.none("DELETE FROM file.version"),
                    t.none("DELETE FROM file.file"),
                    t.none("DELETE FROM file.folder")
                ]);
            })
                .then(function (data) {
                    resolve("Files delete");
                })
                .catch(function (error) {
                    reject( error.message || error);
                });
        })

    },


}

module.exports = documentModel;

