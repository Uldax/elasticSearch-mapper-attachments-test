"use strict";
const conf = require('../config.js'),
    connectionString = conf.db.pgsql,
    pgp = require('pg-promise')(),
    update = require('./update'),
    document = require('./document'),
    pin = require('./pin'),
    utils = require('../helper/utils'),
    //Class for utils function
    fs = require('fs'),
    db = pgp(connectionString);



const testModel = {
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
                    t.none("DROP TRIGGER IF EXISTS document_group_change_trigger ON file.file_group;"),
                    t.none("DROP TRIGGER IF EXISTS pinboard_group_change_trigger ON pinboard.pinboard_group;"),
                ]);
            })
                .then(function (data) {
                    resolve('trigger remove');
                })
                .catch(function (error) {
                    reject(error.message || error);
                });
        });
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
                        "EXECUTE PROCEDURE public.on_change()"),


                    t.none("CREATE TRIGGER pinboard_change_trigger " +
                        "AFTER UPDATE " +
                        "ON pinboard.pinboard " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE public.on_change()"),


                    t.none("CREATE TRIGGER pin_change_trigger " +
                        "AFTER INSERT OR UPDATE " +
                        "ON pinboard.pin " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE public.on_change()"),

                    t.none("CREATE TRIGGER layout_change_trigger " +
                        "AFTER UPDATE " +
                        "ON pinboard.layout " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE public.on_change()"),

                    t.none("CREATE TRIGGER document_group_change_trigger " +
                        "AFTER INSERT OR DELETE " +
                        "ON file.file_group " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE public.on_change()"),

                    t.none("CREATE TRIGGER vote_change_trigger " +
                        "AFTER INSERT OR UPDATE " +
                        "ON pinboard.vote_pin " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE public.on_change()"),

                    t.none("CREATE TRIGGER pinboard_group_change_trigger " +
                        "AFTER INSERT OR DELETE " +
                        "ON pinboard.pinboard_group " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE public.on_change()"),
                ]);
            })
                .then(function (data) {
                    resolve('trigger removed');
                })
                .catch(function (error) {
                    reject(error.message || error);
                });
        });
    },

    clean_db: function () {
        return new Promise(function (resolve, reject) {
            var P1 = update.deleteUpdates();
            var P2 = testModel.deleteFiles();
            var P3 = testModel.deletePins();
            //TODO : delete user
            var promiseArray = [P1, P2, P3];
            //don't know why didn't work
            Promise.all(promiseArray)
                .then(function (result) {
                    resolve(result);
                })
                .catch(function (err) {
                    reject(err.message || err);
                });
        });
    },

    restart_db: function () {
        return testModel.removeTrigger()
            .then(function (mess) {
                return testModel.clean_db();
            })
            .then(function () {
                return testModel.setTrigger();
            })
            .catch(function (err) {
                throw new Error(err.message || err);
            });
    },

    insertLayout: function () {
        return db.one("INSERT INTO pinboard.layout(label, width, height, user_id) VALUES ('layoutTest', 200, 200, 1) RETURNING layout_id");
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
        return db.one("SELECT folder_id FROM file.folder WHERE label = $1", folder_name)
            .then(function (row) {
                var folder_id = row.folder_id;
                return db.one("INSERT INTO file.file (label, folder_id, user_id) VALUES ($1,$2, 1) RETURNING file_id;", [file_name, folder_id]);
            }).then(function (row) {
                var file_id = row.file_id;
                return testModel.insertFileVersion(file_id, file_path);
            })
            .catch(utils.onError);
    },

    issetOrInsertFolder: function (folder_name) {
        return db.one("SELECT folder_id FROM file.folder WHERE label = $1", folder_name)
            .then(function (row) {
                var folder_id = row.folder_id;
            }).catch(function (err) {
                return db.one("INSERT INTO file.folder (label, user_id) VALUES ($1, 1);", folder_name);
            });
    },


    //Not used alone
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
            }).catch(utils.onError);
        });
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
        });

    },


    deletePins: function () {
        return new Promise(function (resolve, reject) {
            db.tx(function (t) {
                // this = t = transaction protocol context;
                // this.ctx = transaction config + state context;
                return t.batch([
                    t.none("DELETE FROM pinboard.pin"),
                    t.none("DELETE FROM pinboard.pinboard"),
                    t.none("DELETE FROM pinboard.layout"),
                ]);
            })
                .then(function (data) {
                    resolve("Pin removed");
                })
                .catch(function (error) {
                    reject(error.message || error);
                });
        });
    },

    getVersionIdByFileLabel: function (file_name) {
        return db.any("SELECT file.version.version_id FROM file.file INNER JOIN file.version " +
            "ON file.version.file_id = file.file.file_id WHERE file.label = $1", [file_name]);
    },



    //test for many document
    crawlFoler: function (folder, multiplictor) {
        let promiseArray = [];
        let multiplictorArray = [];
        var documentNumber = 0;

        var insertFile = function (filename) {
            let path = folder + "/" + filename;
            if (utils.getExt(filename)) {
                promiseArray.push(testModel.insertFileInFolder("root", filename, path));
            }
        };

        return new Promise(function (resolve, reject) {
            var start = 0;
            var totalSizeMb = 0;
            testModel.insertFolder("root")
                .then(function () {
                    start = new Date().getTime();
                    for (let i = 0; i < (multiplictor || 20); i++) {
                        multiplictorArray.push(
                            new Promise(function (resolve, reject) {
                                fs.readdir(folder, function (err, filenames) {
                                    if (err) {
                                        console.log(err.message || err);
                                        return;
                                    }
                                    filenames.forEach(function (filename) {
                                        let path = folder + "/" + filename;
                                        if (utils.getExt(filename)) {
                                            var stats = fs.statSync(path);
                                            var fileSizeInBytes = stats["size"];
                                            //Convert the file size to megabytes (optional)
                                            var fileSizeInMegabytes = fileSizeInBytes / 1000000.0;
                                            totalSizeMb += fileSizeInMegabytes;
                                            promiseArray.push(testModel.insertFileInFolder("root", filename, path));
                                        }
                                    });
                                    resolve("finish");
                                });
                            }));
                    }
                    return Promise.all(multiplictorArray);
                })
                .then(function () {
                    documentNumber = promiseArray.length;
                    console.log("Index " + documentNumber + " file ...");
                    return Promise.all(promiseArray);
                })
                .then(function () {
                    var end = new Date().getTime();
                    var time = end - start;
                    console.log('Execution time: ' + time);
                    var times = time/100;
                    console.log(totalSizeMb + " Mo in " + times +" s" );
                    console.log("Debit : "  +totalSizeMb/times +" Mo/s");
                })
                .catch(function (err) {
                    console.log(err.message || err);
                });
        });
    }
};


module.exports = testModel;


