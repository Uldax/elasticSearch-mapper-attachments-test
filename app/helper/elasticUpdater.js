var conf = require('../config.js');
var pinModel = require('../models/pin.js');
var updateModel = require('../models/update.js');
var documentModel = require('../models/document.js');
var elasticService = require("./elasticService");

var elasticUpdater = {

    curentUpdate: false,

    start: function () {
        console.log("get downtime update...");
        //Remove notify for scheduleur     
        setInterval(elasticUpdater.readUpdateTable, 10000);
    },

    //daemon that do update every minute
    readUpdateTable: function () {
        return new Promise(function (resolve, reject) {
            if (!elasticUpdater.curentUpdate) {
                //dont't call update if another daemon is running
                elasticUpdater.curentUpdate = true;
                updateModel.getUpdates().then(function (rows) {
                    actionPromises = [];
                    for (var row in rows) {
                        if (rows.hasOwnProperty(row)) {
                            var element = rows[row];
                            actionPromises.push(createActionUpdate(element));
                        }
                    }
                    //console.log("length of promiseArray " + actionPromises.length);
                    Promise.all(actionPromises).then(function (values) {
                        elasticUpdater.curentUpdate = false;
                        resolve('updateDone');
                    }).catch(function (err) {
                        elasticUpdater.curentUpdate = false;
                        reject(err.message || err);
                    })
                }).catch(function (err) {
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

//Label file ?
function actionDocument(op, update_id, type_id) {
    var actionDefiner = new Promise(function (resolve, reject) {
        documentModel.getFileInfoById(update_id)
            .then(function (row_to_update) {
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
                reject(err || err.message);
            })
    });

    return new Promise(function (resolve, reject) {
        actionDefiner.then(function (message) {
            //check here
            updateModel.deleteUpdate(update_id, type_id)
                .then(function () {
                    resolve("zub");
                })
                .catch(function (err) {
                    reject(err.message || err);
                })
        }).catch(function (err) {
            reject(err.message || err);
            //If delete fail undo index ?
        })
    })


}

function actionPin(op, update_id, type_id) {
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
            pinModel.getPinInfoById(update_id).then(function (row_to_update) {
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
        updateModel.deleteUpdate(update_id, type_id)
            .catch(function (err) {
                console.log(err.message || err);
            })
    }).catch(function (err) {
        console.error(err.message || err);
        //If delete fail undo index ?
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
            db.none("DELETE FROM public.update WHERE update_id = $1 AND type_id = $2  ", row_to_update.version_id, type_id)
        }).catch(function (err) {
            console.error(err.message || err);
            //If delete fail undo index ?
        })

    })
}

function createActionUpdate(element) {
    return new Promise(function (resolve, reject) {
        var op = element.op;
        var table_name = element.table_name;
        var type_id = element.type_id;
        switch (table_name) {
            case 'pin':
                resolve(actionPin(op, element.update_id, type_id));
                break;
            case 'pinboard':
                if (op != "INSERT") {
                    resolve(actionPinboard(element.update_id, type_id));
                }
                break;
            case 'version':
                resolve(actionDocument(op, element.update_id, type_id));
                break;

            default:
                reject('Action unknow');
                break;
        }
    })
}

module.exports = elasticUpdater;

