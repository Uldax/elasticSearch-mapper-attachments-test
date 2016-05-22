var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/documentBase';
var pg = require('pg');
var pgp = require('pg-promise')();
var db = pgp(connectionString);
var client;
var elasticService = require("./elasticService");
var elasticUpdater = {

    //on startup read for any unretrieved references that occurred during downtime
    //and update elastic
    start: function () {
        console.log("get downtime update...");
        db.any("SELECT update_id,op,document_name FROM public.update INNER JOIN document ON public.update.update_id = document.document_id ")
            .then(function (result) {
                updateDocuments(result);
            })
            .catch(function (error) {
                console.log("ERROR:", error.message || error);
            });
    },

    //on each update the gateways reads from it and then deletes the reference; 
    trackUpdate: function () {
        //Task for notify 
        var client = new pg.Client(connectionString);
        client.connect();
        client.query('LISTEN "file_watcher"');
        client.on('notification', notifyDocument);
    }
}


//TODO, reindex the content ? : boolean in database ?
//think about transaction
function updateDocument(row) {
    var action;
    //update elastic
    if (row.op === 'U') {
        action = elasticService.updateDocument();
    } else if (row.op === "D") {
        action = elasticService.deleteDocument();
    } else if (row.op === "I") {
        action = elasticService.createDocument(row)
    } else {
        console.error("unknow row.op");
        return;
    }
    //delete row : todo get all id and delete all ?
    action
        .then(function (message) {
            db.none("DELETE FROM public.update WHERE update_id = $1 ", row.update_id)
                .then(function () {
                    console.log(message + " with op : " + row.op);
                })
        })
        .catch(function (err) {
            console.error("ERROR:", err.message || err);
        });
}


function updateDocuments(rows) {
    for (var row in rows) {
        if (rows.hasOwnProperty(row)) {
            var element = rows[row];
            updateDocument(element);
        }
    }      
}


//Get info from the staging table
function notifyDocument(data) {
    //Update elastic 
    console.log("DATA PAYLOAD " + data.payload);
    var idUpdate = data.payload;
    //request to pg then update elastic
    //UPDATE DOCUMENT
}

function bulletinBoard(data) {

}

module.exports = elasticUpdater;

