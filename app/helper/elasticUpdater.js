"use strict";
//Read scheduled update from database and execute thm all
var pinModel = require('../models/pin.js');
var updateModel = require('../models/update.js');
var documentModel = require('../models/document.js');
var elasticService = require("./elasticService");
var utils = require("./utils");


var Action = class Action {
    constructor(update_id, type_id, op) {
        this.update_id = update_id;
        this.type_id = type_id;
        this.op = op;
        this.status = "pending"
        this.promise = null;
    }
}


var elasticUpdater = {

    //Boolean use to know if we can update now or not
    curentUpdate: false,

    //All result state after update
    state: [],

    //Previous use of notify/listen form pgsql but we choose to do schedule update
    start: function () {
        console.log("get downtime update...");
        //setInterval(elasticUpdater.readUpdateTable, 10000);
        elasticUpdater.readUpdateTable().then(function () {
            if (elasticUpdater.state.length > 0)
                console.log(elasticUpdater.state);
            var rejectResult = elasticUpdater.state.filter(x => x.status === "rejected");
            //var updateLength = elasticUpdater.state.length > 0 ? (elasticUpdater.state.length - 1) : 0;
            var updateLength = elasticUpdater.state.length;
            console.log("Update todo :" + updateLength);
            console.log("Numbers of failed :" + rejectResult.length);
            rejectResult.forEach(function (element) {
                console.log(element.e);
            }, this);

        }).catch(function (err) {
            console.log(err);
        })
    },

    //Daemon that do update every minute
    readUpdateTable: function () {
        return new Promise(function (resolve, reject) {
            if (!elasticUpdater.curentUpdate) {
                var updateIds = [];
                //dont't call update if another daemon is running
                elasticUpdater.curentUpdate = true;
                updateModel.getUpdates()
                    .then(function (rows) {
                        var actionPromises = [];
                        for (var row in rows) {
                            if (rows.hasOwnProperty(row)) {
                                var element = rows[row];
                                actionPromises.push(createCallbackAction(element));
                                updateIds.push(element.update_id);
                            }
                        }
                        if (actionPromises.length > 0) {
                            //refresh to allowed direct search after update
                            actionPromises.push(function () { return utils.reflect(elasticService.refresh()) });
                            return pseries(actionPromises)
                        } else {
                            return Promise.resolve();
                        }
                    })

                    .then(function (lastResult) {
                        //In case of no action
                        if (lastResult) {
                            elasticUpdater.state.push(lastResult);
                        }
                        elasticUpdater.curentUpdate = false;
                        //TODO handle rejected 
                        if (updateIds.length > 0) {
                            return updateModel.deleteUpdatesByIds(updateIds);
                        } else {
                            return Promise.resolve();
                        }
                    })
                    .then(function () {
                        resolve();
                    })
                    .catch(function (err) {
                        elasticUpdater.curentUpdate = false;
                        reject(err.message || err);
                    })
            }
            else {
                reject("Update already in progress")
            }
        })
    }
}


/*************** PROMISE UTILS  **************** */

//Magic here with closure
// Si une des promesses de l'itérable est rejetée (n'est pas tenue), 
// la promesse all est rejetée immédiatement avec la valeur rejetée par la promesse en question, 
// d'ou l'utilisation de reflect
function createCallbackAction(element) {
    return function () {
        return utils.reflect(createActionUpdate(element));
    };
}

//Promise.all(), but which doesn't execute the promises in paralle
function pseries(list) {
    var p = Promise.resolve();
    //La méthode reduce() applique une fonction qui est un « accumulateur »
    // traite chaque valeur d'une liste (de la gauche vers la droite)
    // afin de la réduire à une seule valeur.
    return list.reduce(function (pacc, fn) {
        return pacc = pacc.then(function (res) {
            if (res) {
                elasticUpdater.state.push(res);
            }
            return fn();
        });
    }, p);

}


/*************** ACTION  **************** */
// Define if it's update/delete or insert for each update

//Return promise
// eq factory
function createActionUpdate(element) {

    var table_name = element.table_name,
        update_id = element.update_id,
        type_id = element.type_id,
        op = element.op;

    var action = new Action(update_id, type_id, op);
    //table_name = "et";
    switch (table_name) {
        case 'pin':
            //action.promise = actionPin(op, update_id)
            return actionPin(op, update_id);
        case 'pinboard':
            if (op != "I") {
                return actionPinboard(update_id);
            }
            break;
        case 'version':
            return actionDocument(op, update_id);

        case 'file_group':
            return actionFile_Group(op, update_id);

        default:
            break;
    }
    return Promise.reject("CreateActionUpdate : no action found");
}

// function actionResolver(actionDefiner, update_id, type_id) {
//     return new Promise(function (resolve, reject) {
//         actionDefiner
//             .then(function (message) {
//                 console.log(message);
//                 return updateModel.deleteUpdate(update_id, type_id)
//             })
//             .then(function () {
//                 resolve("action done");
//             })
//             .catch(function (err) {
//                 reject("Action resolver : " + (err.message || err));
//             })
//     })
// }




/*************** ACTION TABLE **************** */
//Patern : get the information to index based on log_data_id insert in update table
//then resolve the service call associate to the operation
function actionDocument(op, update_id) {
    return new Promise(function (resolve, reject) {
        documentModel.getVersionById(update_id)
            .then(function (row_to_update) {
                if (op == "U") {
                    return elasticService.updateDocument(row_to_update);
                } else if (op == "I") {
                    return elasticService.createDocument(row_to_update);
                } else {
                    throw new Error("Unknown op for document, op = " + op);
                }
            })
            .then(function (status) {
                resolve(status);
            })
            .catch(function (err) {
                reject("In action document " + (err.message || err));
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
                    return (elasticService.addGroupToDocument(group_id, document_id));
                } else if (op === "D" || op == "T") {
                    return (elasticService.removeGroupToDocument(group_id, document_id));
                } else {
                    throw new Error("Unknow op");
                }
            })

            .then(function (status) {
                resolve(status);
            })
            .catch(function (err) {
                reject("in actionFile_Group " + (err.message || err));
            })
    });
}


//No delete
function actionPin(op, update_id) {
    return new Promise(function (resolve, reject) {
        //Get the ligne to update
        pinModel.getPinInfoById(update_id)
            .then(function (row_to_insert) {
                // okay, I have both the "row_to_insert" and the "groupIds"
                if (op == "I") {
                    return pinModel.getGroupForPinboard(row_to_insert.pinboard_id).then(function (groupIds) {
                        return elasticService.createPin(row_to_insert, groupIds);
                    })
                }
                else if (op == "U") {
                    return elasticService.updatePin(row_to_update);
                } else {
                    throw new Error("Unknow op");
                }
            }).then(function (status) {
                resolve(status);
            })
            .catch(function (err) {
                reject("in actionPin " + (err.message || err));
            })
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

