var connectionString = process.env.DATABASE_URL || 'postgres://superopus:superopus@localhost:5432/opus';
var pg = require('pg');
var pgp = require('pg-promise')();
var pinModel = require('../models/pin.js');
var updateModel = require('../models/update.js');
var documentModel = require('../models/document.js');

var db = pgp(connectionString);
var client;
var elasticService = require("./elasticService");



var elasticUpdater = {

    curentUpdate: false,

    start: function () {
        console.log("get downtime update...");
        //Remove notify for scheduleur
        readUpdate();
        //setInterval(readUpdate, 10000);
    },

}


//TODO, reindex the content ? 
function performUpdateDocument(updateID) {
    return new Promise(function (resolve, reject) {
        if (row.op === 'UPDATE' || row.op === "INSERT") {
            db.one("SELECT document_name,document_id FROM document WHERE document_id = $1", updateID)
                .then(function (documentRow) {
                    if (row.op === "UPDATE") {
                        resolve(elasticService.updateDocument(documentRow));
                    } else {
                        resolve(elasticService.createDocument(documentRow));
                    }
                })
                .catch(function (error) {
                    console.log(err);
                    reject("ERROR:", error.message || error);
                })
        }
        else if (row.op === "DELETE" || row.op == "TRUNCATE") {
            resolve(elasticService.deleteDocument(row.update_id));
        }
        else {
            reject("unknow row.op");
        }
    })
}

//Label file ?
function updateDocument(op, update_id, type_id) {

    var actionDefiner = new Promise(function (resolve, reject) {
        documentModel.getFileInfoById(update_id)
            .then(function (row_to_update) {
                console.log("debut" + op + "fin");
                try {
                    if (op == "U") {
                        resolve(elasticService.updateDocument(row_to_update));
                    } else if (op == "I") {
                        resolve(elasticService.createDocument(row_to_update));
                    } else {
                        reject("unknown op for document, op = " + op);
                    }
                }
                catch (error) {
                    reject(error.message || error);
                }
            })
            .catch(function (err) {
                console.log(err || err.message);
            })
    });
    actionDefiner.then(function (message) {
        console.log(message);
        console.log(update_id + " " + type_id);
        //check here
        db.none("DELETE FROM public.update WHERE update_id = $1 AND type_id = $2", [update_id, type_id])
            .catch(function (err) {
                console.log(err.message || err);
            })
    }).catch(function (err) {
        console.error(err.message || err);
        //If delete fail undo index ?
    })

}


//Label file ?
function updatePin(op, update_id, type_id) {
    var actionDefiner = new Promise(function (resolve, reject) {
        //Get the ligne to update
        if (op == "I") {
            //db request
            pinModel.getPinInfoById(update_id).then(function (row_to_insert) {
                resolve(elasticService.createPin(row_to_insert));
            }).catch(function (err) {
                reject(err.message || err);
            })

        } else if (op == "D" || op == "T" || op == "U") {
            pinModel.getPinByID.then(function (row_to_update) {
                if (op == "U") {
                    resolve(elasticService.updatePin(row_to_update));
                } else {
                    resolve(elasticService.deletePin(row_to_update.pin_id));
                }
            })
        } else {
            reject("unknow op");
        }
    });

    actionDefiner.then(function (message) {
            console.log(message);
            db.none("DELETE FROM public.update WHERE update_id = $1 AND type_id = $2  ", [update_id, type_id])
                .catch(function (err) {
                    console.log(err.message || err);
                })
        }).catch(function (err) {
            console.error(err.message || err);
            //If delete fail undo index ?
        })
}

function updatePinboard(op, update_id, type_id) {
    var actionDefiner = new Promise(function (resolve, reject) {
        var action;
        //Get the ligne to update
        if (op === "INSERT") {
            //db request
            pinModel.getPinInfo(update_id).then(function (row_to_insert) {
                action = resolve(elasticService.createPin(row_to_insert));
            })

        } else if (op === "DELETE" || op == "TRUNCATE" || op === "UPDATE") {
            pinModel.getPinByID(update_id).then(function (row_to_update) {
                if (op == "UPDATE") {
                    action = resolve(elasticService.updatePin(row_to_update));
                } else {
                    action = resolve(elasticService.deletePin(row_to_update.pin_id));
                }
            })
        } else {
            reject("unknow op");
        }
    });

    actionDefiner.then(function (action) {
        action.then(function (message) {
            console.log(message);
            db.none("DELETE FROM public.update WHERE update_id = $1 AND type_id = $2  ", row_to_update.version_id, type_id)
        }).catch(function (err) {
            console.error(err.message || err);
            //If delete fail undo index ?
        })

    })
}


//daemon that do update every minute
function readUpdate() {
    console.log("call to update");
    if (!elasticUpdater.curentUpdate) {
        //dont't call update if another daemon is running
        elasticUpdater.curentUpdate = true;
        updateModel.getUpdates().then(function (rows) {
            console.log(rows.length + "to update");
            for (var row in rows) {
                if (rows.hasOwnProperty(row)) {
                    var element = rows[row];
                    var op = element.op;
                    var table_name = element.table_name;
                    var type_id = element.type_id;
                    console.log(table_name);
                    switch (table_name) {
                        case 'pin':
                            updatePin(op, element.update_id, type_id);
                            break;
                        case 'pinboard':
                            if (op != "INSERT") {
                                updatePinboard(element.update_id, type_id);
                            }
                            break;

                        case 'version':
                            console.log('upFile');
                            updateDocument(op, element.update_id, type_id);
                            break;

                        default:
                            break;
                    }
                }
                elasticUpdater.curentUpdate = false;
            }
        }).catch(function (err) {
            console.log(err.message || err);
            elasticUpdater.curentUpdate = false;
        })
    }
    else {
        console.log("update already in progress")
    }




}


module.exports = elasticUpdater;

