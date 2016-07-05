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
            "layout.layout_id, pin.user_id, pin.registration, " +
            "pinboard.layout.label AS layout_label, " +
            "pinboard.pinboard.label AS pinboard_label, " +
            "pinboard.pin.label AS pin_label " +
            "FROM pinboard.layout " +
            "INNER JOIN pinboard.pinboard ON pinboard.layout.layout_id = pinboard.pinboard.layout_id " +
            "INNER JOIN pinboard.pin ON pinboard.pinboard.pinboard_id = pinboard.pin.pinboard_id " +
            "WHERE pinboard.pin.log_data_id = $1 ", log_data_id);
    },

    //For th BULK
    getPinInfoWithGroup: function () {
        return db.any("SELECT pinboard.pin.pin_id, pinboard.layout.label AS layout_label, " +
            "pin.user_id, pin.registration, layout.layout_id, " +
            "pinboard.pinboard.label AS pinboard_label, " +
            "pinboard.pin.label AS pin_label, " +
            "pinboard.vote_pin.vote, pinboard.pin.log_data_id, pinboard.pinboard.pinboard_id, " +
            "array(SELECT group_id FROM pinboard.pinboard_group WHERE pinboard_group.pinboard_id = pinboard.pinboard_id) AS group_ids " +
            "FROM pinboard.layout " +
            "INNER JOIN pinboard.pinboard ON pinboard.layout.layout_id = pinboard.pinboard.layout_id " +
            "INNER JOIN pinboard.pin ON pinboard.pinboard.pinboard_id = pinboard.pin.pinboard_id " +
            "INNER JOIN pinboard.vote_pin ON pinboard.pin.pin_id = pinboard.vote_pin.pin_id;");
    },


    //for pin update 
    getPinUpdateInfoById: function (log_data_id) {
        return db.one("SELECT label,log_data_id, pin_id " +
            "FROM pinboard.pin " +
            "WHERE pinboard.pin.log_data_id = $1 ", log_data_id);
    },

    //vote pin and log_data_id from id to update 
    getPinVote: function (log_data_id) {
        return db.one("SELECT pinboard.pin.log_data_id, pinboard.vote_pin.vote " +
            "FROM pinboard.vote_pin " +
            "INNER JOIN pinboard.pin ON pinboard.vote_pin.pin_id = pinboard.pin.pin_id " +
            "WHERE pinboard.vote_pin.log_data_id = $1 ", log_data_id);
    },

    //for pinboard update
    getPinboardByLogdata: function (log_data_id) {
        return db.one("SELECT label,pinboard_id " +
            "FROM pinboard.pinboard " +
            "WHERE pinboard.pinboard.log_data_id = $1 ", log_data_id);
    },

    //for layout update
    getLayoutByLogdata: function (log_data_id) {
        return db.one("SELECT label,layout_id " +
            "FROM pinboard.layout " +
            "WHERE pinboard.layout.log_data_id = $1 ", log_data_id);
    },

    getGroupForPinboardByLogdata: function (log_data_id) {
        return db.one("SELECT group_id,pinboard_id " +
            "FROM pinboard.pinboard_group " +
            "WHERE pinboard.pinboard_group.log_data_id = $1 ", log_data_id);
    },


    getPinByID: function (pin_id) {
        return db.one("SELECT * FROM pin WHERE pin_id = $1", pin_id);
    },


};


module.exports = pinModel;

