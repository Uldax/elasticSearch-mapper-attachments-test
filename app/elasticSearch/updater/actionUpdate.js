"use strict";
//Patern : get the information to index based on log_data_id insert in update table
//then resolve the service call associate to the operation
var documentModel = require('../../models/document.js');
var pinModel = require('../../models/pin.js');
var elasticService = require("../elasticService");
var utils = require("../../helper/utils");

class ActionUpdate {
    constructor(table_name, update_id, type_id, op) {
        this.update_id = update_id;
        this.type_id = type_id;
        this.op = op;
        this.table_name = table_name;
    }

    //create the promise
    get promise() {
        return this.reflect(this.createActionUpdate());
    }

    createActionUpdate() {
        switch (this.table_name) {
            case 'pin':
                return this.actionPin(this.op, this.update_id);

            case 'vote_pin':
                return this.actionVotePin(this.op, this.update_id);

            case 'version':
                return this.actionDocument(this.op, this.update_id);

            case 'file_group':
                return this.actionFile_Group(this.op, this.update_id);

            case 'pinboard_group':
                return this.actionPinboard_Group(this.op, this.update_id);

            case 'layout':
                return this.actionLayout(this.op, this.update_id);

            case 'pinboard':
                return this.actionPinboard(this.op, this.update_id);

            default:
                break;
        }
        return Promise.reject("CreateActionUpdate : no action found");
    }

    resolve(v) {
        return {
            id: this.update_id,
            type_id: this.type_id,
            op: this.op,
            v: v,
            status: 'resolve'
        }
    }

    reject(e) {
        return {
            id: this.update_id,
            type_id: this.type_id,
            op: this.op,
            e: (e.message || e),
            status: 'rejected'
        }
    }

    reflect(promise) {

        var that = this;
        if (utils.isFunction(promise)) {
            return promise().then(function (v) {
                    return that.resolve(v);
                },
                function (e) { return that.reject(e); });
        } else {
            return promise.then(function (v) {
                return that.resolve(v);
            },
                function (e) { return that.reject(e); });
        }
    }

    //List of action 
    //Index document by converting it's content with base64 or update meta data
    //each document had version
    actionDocument(op, update_id) {
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

    //Add to document the groups that have access to it
    actionFile_Group(op, log_data_id) {
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

    //Index or update pin with pinboard and layout metadata
    actionPin(op, log_data_id) {
        return new Promise(function (resolve, reject) {
            //Get the ligne to update  
            Promise.resolve("les nouveau commercant")
                .then(function () {
                    if (op == "I") {
                        pinModel.getPinInfoById(log_data_id)
                            .then(function (row_to_insert) {
                                return elasticService.createPin(row_to_insert);
                            }).then(function (status) {
                                resolve(status);
                            })
                            .catch(function (err) {
                                reject("in actionPin " + (err.message || err));
                            })
                    }
                    else if (op == "U") {
                        pinModel.getPinUpdateInfoById(log_data_id)
                            .then(function (row_to_update) {
                                return elasticService.updatePin(row_to_update);
                            }).then(function (status) {
                                resolve(status);
                            })
                            .catch(function (err) {
                                reject("in actionPin " + (err.message || err));
                            })
                    } else {
                        throw new Error("Unknow op");
                    }
                })

        })
    }

    //Store the vote associate to a pin
    actionVotePin(op, log_data_id) {
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
    }

    //Add to pin the groups that have access to it
    actionPinboard_Group(op, log_data_id) {
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
    }

    //Update pin if pinboard change
    actionPinboard(op, log_data_id) {
        return new Promise(function (resolve, reject) {
            //Get the ligne to update
            pinModel.getPinboardByLogdata(log_data_id)
                .then(function (row) {
                    if (op == "U") {
                        console.log("pinboard");
                        return elasticService.updatePinWithPinboard(row.label, row.pinboard_id);
                    } else {
                        throw new Error("Unknow op for pinboard");
                    }
                }).then(function (status) {
                    resolve(status);
                })
                .catch(function (err) {
                    reject("in actionPinboard " + (err.message || err));
                })
        });
    }

    //Update pin if layout change
    actionLayout(op, log_data_id) {
        return new Promise(function (resolve, reject) {
            //Get the ligne to update
            pinModel.getLayoutByLogdata(log_data_id)
                .then(function (row) {
                    if (op == "U") {
                        return elasticService.updatePinWithLayout(row.label, row.layout_id);
                    } else {
                        throw new Error("Unknow op for layout");
                    }
                }).then(function (status) {
                    resolve(status);
                })
                .catch(function (err) {
                    reject("in actionLayout " + (err.message || err));
                })
        });
    }
}

module.exports = ActionUpdate;