"use strict";

var conf = require('../config.js');
var connectionString = conf.db.pgsql;
var pgp = require('pg-promise')();
var db = pgp(connectionString);
var sco; // shared connection object

var updateModel = {
    getUpdates: function () {
        //TODO create view
        return db.any("SELECT update_id,update.type_id,op,type.table_name FROM public.update NATURAL JOIN content.type ORDER BY updated ASC ");
    },

    deleteUpdate: function (update_id, type_id) {
        return db.none("DELETE FROM public.update WHERE update_id = $1 AND type_id = $2", [update_id, type_id]);
    },

    deleteUpdates: function () {
        return db.none("DELETE FROM public.update");
    },

    deleteUpdatesByIds: function (ids) {
        return db.none("DELETE FROM public.update WHERE update_id IN ($1:csv)", [ids]);
    },

    //Permanent listener, outside of the connection pool: 
    //listening will never stop, unless the physical connection fails, or if you call sco.done() to release it.
    listenChannel: function (channel, callback) {
        //{direct: true} to create a separate Client, plus we never release the connection.
        db.connect({ direct: true })
            .then(obj => {
                sco = obj;
                sco.client.on('notification', data => {
                    callback();
                });
                return sco.none('LISTEN $1~', channel);
            })
            .catch(error => {
                console.log('Error:', error);
            });
    },

     unlisten: function () {
         if(sco) {
            sco.done()
         } else {
             console.log("how can you listen ?");
         }

    }


}


module.exports = updateModel;

