"use strict";
var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var pgp = require('pg-promise')();
var db = pgp(connectionString);


var pinModel = {
    getPinInfoById: function (pin_id) {
        console.log(pin_id);
        //TODO create view
        return db.one("SELECT pin.pin_id, " +
            "pinboard.layout.label AS label_layout, " +
            "pinboard.pinboard.label AS pinboard_label, " +
            "pinboard.pin.label AS pin_label " +
            //"pinboard.vote_pin.vote +
            "FROM pinboard.layout " +
            "INNER JOIN pinboard.pinboard ON pinboard.layout.layout_id = pinboard.pinboard.layout_id " +
            "INNER JOIN pinboard.pin ON pinboard.pinboard.pinboard_id = pinboard.pin.pinboard_id " +
            "WHERE pinboard.pin.pin_id = $1 ", pin_id)
    },

    getPinByID: function (pin_id) {
        return db.one("SELECT * FROM pin WHERE pin_id = $1", pin_id);
    },

    getAllPinInfo: function (){
        return db.any("SELECT pinboard.pin.pin_id, pinboard.layout.label AS label_layout, pinboard.pinboard.label AS label_Pinboard, " +
        "pinboard.pin.label AS label_pin, pinboard.vote_pin.vote, pinboard.pin.log_data_id " +
        "FROM pinboard.layout " +
	    "INNER JOIN pinboard.pinboard ON pinboard.layout.layout_id = pinboard.pinboard.layout_id " +
	    "INNER JOIN pinboard.pin ON pinboard.pinboard.pinboard_id = pinboard.pin.pinboard_id " +
	    "INNER JOIN pinboard.vote_pin ON pinboard.pin.pin_id = pinboard.vote_pin.pin_id;")
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
        })
    }
}


module.exports = pinModel;

