"use strict";
var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var pgp = require('pg-promise')();
var update = require('./update');
var document = require('./document');
var pin = require('./pin');

var db = pgp(connectionString);


var testModel = {
    removeTrigger: function () {
        return new Promise(function (resolve, reject) {
            db.tx(function (t) {
                // this = t = transaction protocol context;
                // this.ctx = transaction config + state context;
                return t.batch([
                    t.none("DROP TRIGGER IF EXISTS version_change_trigger ON file.version"),
                    t.none("DROP TRIGGER IF EXISTS pinboard_change_trigger ON pinboard.pinboard"),
                    t.none("DROP TRIGGER IF EXISTS pin_change_trigger ON pinboard.pin"),
                    t.none("DROP TRIGGER IF EXISTS layout_change_trigger ON pinboard.layout"),
                    t.none("DROP TRIGGER IF EXISTS vote_change_trigger ON pinboard.vote_pin")
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
            db.tx(function (t) {
                // this = t = transaction protocol context;
                // this.ctx = transaction config + state context;
                return t.batch([
                    t.none("CREATE TRIGGER version_change_trigger " +
                        "AFTER INSERT OR UPDATE OR DELETE " +
                        "ON file.version " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_version_change()"),


                    t.none("CREATE TRIGGER pinboard_change_trigger " +
                        "AFTER UPDATE " +
                        "ON pinboard.pinboard " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_pinboard_change()"),


                    t.none("CREATE TRIGGER pin_change_trigger " +
                        "AFTER INSERT OR UPDATE OR DELETE " +
                        "ON pinboard.pin " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_pin_change()"),

                    t.none("CREATE TRIGGER layout_change_trigger " +
                        "AFTER UPDATE " +
                        "ON pinboard.layout " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_layout_change()"),

                    t.none("CREATE TRIGGER vote_change_trigger " +
                        "AFTER UPDATE " +
                        "ON pinboard.vote_pin " +
                        "FOR EACH ROW " +
                        "EXECUTE PROCEDURE on_change()")
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



    clean_db: function (next) {
        return new Promise(function (resolve, reject) {
            testModel.removeTrigger()
                .then(function (mess) {
                    var P1 = update.deleteUpdates();
                    var P2 = document.deleteFiles();
                    var P3 = pin.deletePins();
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
                .catch(function (err) {
                    reject(err.message || err);
                })
        })


    }
}


module.exports = testModel;


