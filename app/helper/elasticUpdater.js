"use strict";
//Read scheduled update from database and execute thm all
var pinModel = require('../models/pin.js');
var updateModel = require('../models/update.js');
var documentModel = require('../models/document.js');
var elasticService = require("./elasticService");
var utils = require("./utils");

var elasticUpdater = {

    //Boolean use to know if we can update now or not
    curentUpdate: false,

    //Previous use of notify/listen form pgsql but we choose to do schedule update
    start: function () {
        console.log("get downtime update...");
        //setInterval(elasticUpdater.readUpdateTable, 10000);
        elasticUpdater.readUpdateTable();
    },

    //Daemon that do update every minute
    readUpdateTable: function () {
        return new Promise(function (resolve, reject) {
            if (!elasticUpdater.curentUpdate) {
                //dont't call update if another daemon is running
                elasticUpdater.curentUpdate = true;
                updateModel.getUpdates()
                    .then(function (rows) {
                        var actionPromises = [];
                        for (var row in rows) {
                            if (rows.hasOwnProperty(row)) {
                                var element = rows[row];
                                var action = createActionUpdate(element)
                                actionPromises.push(action);
                            }
                        }
                        console.log("Update todo :" +actionPromises.length);
                        return Promise.all(actionPromises.map(utils.reflect))
                        //console.log("length of promiseArray " + actionPromises.length);
                        // Si une des promesses de l'itérable est rejetée (n'est pas tenue), 
                        // la promesse all est rejetée immédiatement avec la valeur rejetée par la promesse en question, 
                    }).then(function (results) {
                        var rejectResult = results.filter(x => x.status === "rejected");
                        elasticUpdater.curentUpdate = false;
                        //TODO handle rejected
                        resolve(results);
                    })
                    .catch(function (err) {
                        console.log("catch all");
                        elasticUpdater.curentUpdate = false;
                        reject(err.message || err);
                    })
            }
            else {
                reject("update already in progress")
            }
        })
    }
}



/*************** ACTION  **************** */
// Define if it's update/delete or insert for each update

function actionResolver(actionDefiner, update_id, type_id) {
    return new Promise(function (resolve, reject) {
        actionDefiner
            .then(function (message) {
                console.log(message);
                return updateModel.deleteUpdate(update_id, type_id)
            })
            .then(function(){
                resolve("action done");
            })
            .catch(function(err) {
                reject("Action resolver : " + (err.message || err));
            })         
    })
}

function createActionUpdate(element) {
    return new Promise(function (resolve, reject) {
        var op = element.op;
        var table_name = element.table_name;
        var type_id = element.type_id;
        var update_id = element.update_id;
        var actionDefiner = null;
        //table_name = "et";
        switch (table_name) {
            case 'pin':
                actionDefiner = actionPin(op, update_id);
                break;
            case 'pinboard':
                if (op != "I") {
                    actionDefiner = actionPinboard(update_id);
                }
                break;
            case 'version':
                actionDefiner = actionDocument(op, update_id);
                break;

            case 'file_group':
                actionDefiner = actionFile_Group(op, update_id);
                break;

            default:
                break;
        }
        if (actionDefiner) {
            //if resolved the promise is resolved else if return it's pending
            resolve( actionResolver(actionDefiner,update_id,type_id));
        }
        else {
            reject("CreateActionUpdate : no action found");
        }
    })
}

/*************** ACTION TABLE **************** */
//Pather : get the information to index based on log_data_id insert in update table
//then resolve the service call associate to the operation

function actionDocument(op, update_id) {
    return new Promise(function (resolve, reject) {
        documentModel.getVersionById(update_id)
            .then(function (row_to_update) {
                if (op == "U") {
                    resolve(elasticService.updateDocument(row_to_update));
                } else if (op == "I") {
                    resolve( elasticService.createDocument(row_to_update));
                } else {
                    reject("unknown op for document, op = " + op);
                }
            })
            .catch(function (err) {
                reject("in action document " + (err.message || err));
            })
    });
}

//No update
function actionFile_Group(op, log_data_id) {
    return new Promise(function (resolve, reject) {
        documentModel.getFile_GroupByLogData(log_data_id)
            .then(function (row) {
                var group_id = row.group_id;
                var document_id = row.file_id;
                if (op === "I") {
                    resolve(elasticService.addGroupToDocument(group_id, document_id));
                } else if (op === "D" || op == "T") {
                    resolve(elasticService.removeGroupToDocument(group_id, document_id));
                } else {
                    reject("unknow op");
                }
            })
            .catch(function (err) {
                reject("in actionFile_Group " + (err.message || err));
            })
    });
}


//No delete
function actionPin(op, update_id) {
    new Promise(function (resolve, reject) {
        //Get the ligne to update
        pinModel.getPinInfoById(update_id).then(function (row_to_insert) {
            if (op == "I") {
                return (elasticService.createPin(row_to_insert));
            }
            if (op == "U") {
                return (elasticService.updatePin(row_to_update));
            } else {
                reject("unknow op");
            }
        }).catch(utils.onError)
    });
}



//TODO : pascale help
function actionPin_Group(op, file_id, group_id, type_id) {
    var actionDefiner = new Promise(function (resolve, reject) {
        var action;
        //Get the ligne to update
        if (op === "I") {
            action = resolve(elasticService.addGroupToDocument(group_id, document_id));
        } else if (op === "D" || op == "T") {
            action = resolve(elasticService.removeGroupToDocument(group_id, document_id));
        } else {
            reject("unknow op");
        }
    });

    actionDefiner.then(function (action) {
        action.then(function (message) {
            db.none("DELETE FROM public.update WHERE update_id = $1 AND update_composite_id = $2 type_id = $3  ", file_id, group_id, type_id)
        }).catch(utils.onError)
    })
}





function actionPinboard(op, update_id, type_id) {
    var actionDefiner = new Promise(function (resolve, reject) {
        var action;
        //Get the ligne to update
        if (op === "I") {
            //db request
            pinModel.getPinInfo(update_id).then(function (row_to_insert) {
                action = resolve(elasticService.createPin(row_to_insert));
            })

        } else if (op === "D" || op == "T" || op === "U") {
            pinModel.getPinByID(update_id).then(function (row_to_update) {
                if (op == "U") {
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
            return db.none("DELETE FROM public.update WHERE update_id = $1 AND type_id = $2  ", row_to_update.version_id, type_id)
        }).catch(function (err) {
            console.error(err.message || err);
            //If delete fail undo index ?
        })

    })
}


module.exports = elasticUpdater;

