"use strict";

var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/opus';
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
    }

}


module.exports = pinModel;

