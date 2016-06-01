var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/opus';
var pg = require('pg');
var pgp = require('pg-promise')();
var db = pgp(connectionString);
var client;
var elasticService = require("./elasticService");



var elasticUpdater = {

    curentUpdate: false,
    //on startup read for any unretrieved references that occurred during downtime
    //and update elastic
    //For babillard , use bulk
    start: function () {
        console.log("get downtime update...");
        //Warning delete
        db.any("SELECT update_id,op FROM public.update")
            .then(function (result) {
                console.log(result.length + " update in stage");
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
        client.query('LISTEN "babillard_watcher"');
        client.query('LISTEN "file_watcher"');
        client.on('notification', notify);
    }
}


//TODO, reindex the content ? : boolean in database ?
function performUpdateDocument(updateID) {
    return new Promise(function (resolve, reject) {
        var action;
        db.one("SELECT update_id,op FROM public.update WHERE update_id = $1", updateID)
            .then(function (row) {
                //update elastic
                if (row.op === 'U' || row.op === "I") {
                    db.one("SELECT document_name,document_id FROM document WHERE document_id = $1", updateID)
                        .then(function (documentRow) {
                            if (row.op === "U") {
                                resolve(elasticService.updateDocument(documentRow));
                            } else {
                                resolve(elasticService.createDocument(documentRow));
                            }
                        })
                }
                else if (row.op === "D") {
                    resolve(elasticService.deleteDocument(row.update_id));
                }
                else {
                    reject("unknow row.op");
                }
            })
            .catch(function (error) {
                console.log(err);
                reject("ERROR:", error.message || error);
            });
    })

}


function updateDocument(versionID) {
    performUpdateDocument(versionID).then(function (message) {
        console.log(message);
        db.none("DELETE FROM public.update WHERE update_id = $1 ", versionID)
    }).catch(function (err) {
        console.error(err.message || err);
    })
}

function updateDocuments(rows) {
    for (var row in rows) {
        if (rows.hasOwnProperty(row)) {
            var element = rows[row];
            updateDocument(element.update_id);
        }
    }
}


//Dispatch to the righe handler
function notify(data) {
    var action;
    console.log(data)
    var info = JSON.parse(data.payload);
    if (info.id) {
        if (data.channel === "file_watcher") {
            updateDocument(info.id);
        } else {
            console.error("unknow channel");
        }
    }
}


module.exports = elasticUpdater;

