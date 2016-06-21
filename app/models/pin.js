"use strict";
var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var pgp = require('pg-promise')();
var db = pgp(connectionString);


var pinModel = {
    getPinInfoById: function (log_data_id) {
        //TODO create view
        //can't have pin vote when pin create so remove from this request
        return db.one("SELECT pin.pin_id,pin.log_data_id,pinboard.pinboard.pinboard_id, " +
            "pinboard.layout.label AS label_layout, " +
            "pinboard.pinboard.label AS pinboard_label, " +
            "pinboard.pin.label AS pin_label " +
            "FROM pinboard.layout " +
            "INNER JOIN pinboard.pinboard ON pinboard.layout.layout_id = pinboard.pinboard.layout_id " +
            "INNER JOIN pinboard.pin ON pinboard.pinboard.pinboard_id = pinboard.pin.pinboard_id " +
            "WHERE pinboard.pin.log_data_id = $1 ", log_data_id);
    },

    //vote pin and log_data_id from id to update 
    getPinVote: function (log_data_id) {
        return db.one("SELECT pinboard.pin.log_data_id, pinboard.vote_pin.vote " +
            "FROM pinboard.vote_pin " +
            "INNER JOIN pinboard.pin ON pinboard.vote_pin.pin_id = pinboard.pin.pin_id " +
            "WHERE pinboard.vote_pin.log_data_id = $1 ", log_data_id);
    },
    
    getGroupForPinboard: function (pinboard_id) {
        return db.any("SELECT group_id " +
            "FROM pinboard.pinboard_group " +
            "WHERE pinboard.pinboard_group.pinboard_id = $1 ", pinboard_id);
    },


    getPinByID: function (pin_id) {
        return db.one("SELECT * FROM pin WHERE pin_id = $1", pin_id);
    },

    getAllPinInfo: function () {
        return db.any("SELECT pinboard.pin.pin_id, pinboard.layout.label AS label_layout, pinboard.pinboard.label AS label_Pinboard, " +
            "pinboard.pin.label AS label_pin, pinboard.vote_pin.vote, pinboard.pin.log_data_id " +
            "FROM pinboard.layout " +
            "INNER JOIN pinboard.pinboard ON pinboard.layout.layout_id = pinboard.pinboard.layout_id " +
            "INNER JOIN pinboard.pin ON pinboard.pinboard.pinboard_id = pinboard.pin.pinboard_id " +
            "INNER JOIN pinboard.vote_pin ON pinboard.pin.pin_id = pinboard.vote_pin.pin_id;")
    },
}


module.exports = pinModel;

