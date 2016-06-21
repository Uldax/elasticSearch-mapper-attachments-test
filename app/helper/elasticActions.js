"use strict";
//Patern : get the information to index based on log_data_id insert in update table
//then resolve the service call associate to the operation
var documentModel = require('../models/document.js');
var pinModel = require('../models/pin.js');
var elasticService = require("./elasticService");

var Action = class Action {
    constructor(update_id, type_id, op) {
        this.update_id = update_id;
        this.type_id = type_id;
        this.op = op;
        this.status = "pending"
        this.promise = null;
    }
}


var elasticActions = {

    // Action factory that contain promise
    createActionUpdate: function (element) {

        var table_name = element.table_name,
            update_id = element.update_id,
            type_id = element.type_id,
            op = element.op,
        action = new Action(update_id, type_id, op);

        switch (table_name) {
            case 'pin':
                //action.promise = actionPin(op, update_id)
                return elasticActions.actionPin(op, update_id);

            case 'vote_pin':
                return elasticActions.actionVotePin(op, update_id);

            case 'pinboard':
                return elasticActions.actionPinboard(update_id);

            case 'version':
                return elasticActions.actionDocument(op, update_id);

            case 'file_group':
                return elasticActions.actionFile_Group(op, update_id);

            case 'pinboard_group':
                return elasticActions.actionPinboard_Group(op, update_id);

            default:
                break;
        }
        return Promise.reject("CreateActionUpdate : no action found");
    },

    //Index document by converting it's content with base64 or update meta data
    //each document had version
    actionDocument: function (op, update_id) {
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
    },

    //Add to document the groups that have access to it
    actionFile_Group: function (op, log_data_id) {
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
    },

    //Index or update pin with pinboard and layout metadata
    actionPin: function (op, log_data_id) {
        return new Promise(function (resolve, reject) {
            //Get the ligne to update
            pinModel.getPinInfoById(log_data_id)
                .then(function (row_to_insert) {
                    // okay, I have both the "row_to_insert" and the "groupIds"
                    if (op == "I") {
                        return elasticService.createPin(row_to_insert);
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
    },

    //Store the vote associate to a pin
    actionVotePin: function (op, log_data_id) {
        return new Promise(function (resolve, reject) {
            pinModel.getPinVote(log_data_id)
                .then(function (row) {
                    if (op === "I" || op === "U") {
                        return elasticService.updateVote(row.log_data_id, row.vote);
                    } else {
                        throw new Error("Unknow op");
                    }
                })
                .then(function (status) {
                    resolve(status);
                })
                .catch(function (err) {
                    reject("in actionVotePin " + (err.message || err));
                })
        });
    },

    //Add to pin the groups that have access to it
    actionPinboard_Group: function (op, log_data_id) {
        return new Promise(function (resolve, reject) {
            pinModel.getGroupForPinboardByLogdata(log_data_id)
                .then(function (row) {
                    if (op === "I") {
                        return (elasticService.addGroupToPinboard(row.group_id, row.pinboard_id));
                    } else if (op === "D" || op == "T") {
                        return (elasticService.removeGroupToPinboard(row.group_id, row.pinboard_id));
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
    },

    //TODO
    actionPinboard: function (op, update_id, type_id) {
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
    },

    //TODO 
    actionLayout: function () {

    }

}




module.exports = elasticActions;