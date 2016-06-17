"use strict";
var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var pgp = require('pg-promise')();
var update = require('./update');
var document = require('./document');
var pin = require('./pin');
var utils = require('../helper/utils');


var db = pgp(connectionString);


var testModel = {
    removeTrigger: function () {
        return new Promise(function (resolve, reject) {
            db.task(function (t) {
                // this = t = transaction protocol context;
                // this.ctx = transaction config + state context;
                return t.batch([
                    t.none("DROP TRIGGER IF EXISTS version_change_trigger ON file.version"),
                    t.none("DROP TRIGGER IF EXISTS pinboard_change_trigger ON pinboard.pinboard"),
                    t.none("DROP TRIGGER IF EXISTS pin_change_trigger ON pinboard.pin"),
                    t.none("DROP TRIGGER IF EXISTS layout_change_trigger ON pinboard.layout"),
                    t.none("DROP TRIGGER IF EXISTS vote_change_trigger ON pinboard.vote_pin"),
                    t.none("DROP TRIGGER IF EXISTS document_group_change_trigger ON file.file_group;")
                ]);
            })
                .then(function (data) {
                    resolve('trigger remove');
                })
                .catch(function (error) {
                    reject(error.message || error);
                });
        })
    },

    setTrigger: function () {
        return new Promise(function (resolve, reject) {
            db.task(function (t) {
                // this = t = transaction protocol context;
                // this.ctx = transaction config + state context;
                return t.batch([
                    t.none("CREATE TRIGGER version_change_trigger " +
                        "AFTER INSERT OR UPDATE " +
                        "ON file.version " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_change()"),


                    t.none("CREATE TRIGGER pinboard_change_trigger " +
                        "AFTER UPDATE " +
                        "ON pinboard.pinboard " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_change()"),


                    t.none("CREATE TRIGGER pin_change_trigger " +
                        "AFTER INSERT OR UPDATE " +
                        "ON pinboard.pin " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_change()"),

                    t.none("CREATE TRIGGER layout_change_trigger " +
                        "AFTER UPDATE " +
                        "ON pinboard.layout " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_change()"),

                    t.none("CREATE TRIGGER document_group_change_trigger " +
                        "AFTER INSERT OR DELETE " +
                        "ON file.file_group " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_change()"),

                    // t.none("CREATE TRIGGER vote_change_trigger " +
                    //     "AFTER UPDATE " +
                    //     "ON pinboard.vote_pin " +
                    //     "FOR EACH ROW " +
                    //     "EXECUTE PROCEDURE on_change()")
                ]);
            })
                .then(function (data) {
                    resolve('trigger remove');
                })
                .catch(function (error) {
                    reject(error.message || error);
                });
        })
    },

    clean_db: function () {
        return new Promise(function (resolve, reject) {
            var P1 = update.deleteUpdates();
            var P2 = testModel.deleteFiles();
            var P3 = pin.deletePins();
            //TODO : delete user
            var promiseArray = [P1, P2, P3];
            //don't know why didn't work
            Promise.all(promiseArray)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err.message || err);
                })
        })
    },

    restart_db: function () {
        return testModel.removeTrigger()
            .then(function (mess) {
                return testModel.clean_db()
            })
            .then(function () {
                return testModel.setTrigger()
            })
            .catch(function (err) {
                reject(err.message || err);
            })
    },

    insertLayout: function () {
        return db.one("INSERT INTO pinboard.layout(label, width, height, user_id) VALUES ('layoutTest', 200, 200, 1) RETURNING layout_id")
    },

    updateLayout: function (layout_id, new_label) {
        return db.none("UPDATE pinboard.layout SET label = $1 WHERE layout_id = $2", [new_label, layout_id]);
    },

    insertPinBoard: function (pinboard_label, layout_id, user_id) {
        return db.one("INSERT INTO pinboard.pinboard(label, layout_id, user_id) VALUES ($1,$2,$3) RETURNING pinboard_id ", [pinboard_label, layout_id, user_id]);
    },

    updatePinBoard: function (pinboard_id, new_label) {
        return db.none("UPDATE pinboard.pinboard SET label = $1 WHERE pinboard_id = $2", [new_label, pinboard_id]);
    },

    insertPin: function (pinboard_id, label, user_id) {
        return db.one("INSERT INTO pinboard.pin(pinboard_id, label, user_id) VALUES ($1, $2, $3) RETURNING pin_id ", [pinboard_id, label, user_id]);
    },

    updatePin: function (pin_id, new_label) {
        return db.none("UPDATE pinboard.pin SET label = $1 WHERE pin_id = $2", [new_label, pin_id]);
    },

    //First document insert
    insertFileInFolder: function (folder_name, file_name, file_path) {
        return new Promise(function (resolve, reject) {
            db.one("SELECT folder_id FROM file.folder WHERE label = $1", folder_name).then(function (row) {
                var folder_id = row.folder_id;
                db.one("INSERT INTO file.file (label, folder_id, user_id) VALUES ($1,$2, 1) RETURNING file_id;", [file_name, folder_id]).then(function (row) {
                    var file_id = row.file_id;
                    resolve(testModel.insertFileVersion(file_id, file_path));
                }).catch(utils.onError)
            }).catch(utils.onError)
        })

    },

    //Second for document update
    insertFileVersion: function (id_file, path) {
        return db.one("INSERT INTO file.version (file_id, label, path, user_id) VALUES " +
            "($1, 'test version 1', $2, 1) RETURNING log_data_id", [id_file, path]);
    },

    insertFileVersionByFileLabel: function (file_name, file_path) {
        return new Promise(function (resolve, reject) {
            db.one("SELECT file.file_id FROM file.file WHERE label = $1", [file_name]).then(function (row) {
                var file_id = row.file_id;
                resolve(testModel.insertFileVersion(file_id, file_path));
            }).catch(utils.onError)
        })
    },

    insertFolder: function (folder_name) {
        return db.none("INSERT INTO file.folder (label, user_id) VALUES ($1, 1);", folder_name);
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
                    reject(error.message || error);
                });
        })

    },


}


module.exports = testModel;


