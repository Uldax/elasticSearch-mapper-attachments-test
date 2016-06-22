"use strict";
//Class that build request to send to elastic search serveur
var conf = require("../../config"),
    indexName = conf.elastic.mainIndex,
    utils = require("../../helper/utils");


var elasticIndexBuilder = {

    createDocument: function (path, data) {
        var base64file = utils.base64_encode("../" + path);
        var fileSize = Buffer.byteLength(base64file);
        //id is set in url sent to elastic : http POST elastic/index/type/id
        var requestData = {
            "attachment": {
                "_content": base64file,
                "_name": data.name,
                "_content_length": fileSize
            },
            "document_type": utils.getType(path),
            "insertDate": utils.getTodayDateFormat(),
            "document_id": data.document_id,
            "version_id": data.version_id,
            //if not set , add values instead of add to array
            "document_groups_ids": data.groupIds
        }
        return requestData;
    },

    updateDocumentVersion: function (row) {
        //id is set in url sent to elastic : http POST elastic/index/type/id
        var requestData = {
            "doc": {
                "attachment": {
                    "_name": row.label,
                },
                "insertDate": utils.getTodayDateFormat(),
            }
        }
        return requestData;

    },

    //Files are in config/script under elasticSearch folder
    addGroupToFile: function (group_id, document_id) {
        var requestData = {
            "query": {
                "term": {
                    "document_id": document_id
                }
            },
            "script": {
                "file": "addGroupUpdate",
                "params": {
                    "new_group": group_id,
                    "fieldToUpdate": "document_groups_ids"
                }
            }

        }
        return requestData;
    },

    removeGroupToDocument: function (group_id, document_id) {
        var requestData = {
            "query": {
                "term": {
                    "document_id": document_id
                }
            },
            "script": {
                "file": "removeGroupUpdate",
                "params": {
                    "new_group": group_id,
                    "fieldToUpdate": "document_groups_ids"
                }
            }
        }
        return requestData;
    },

    createPin: function (row, groupIds) {
        var requestData = {
            "layou_label": row.label_layout,
            "pin_content": row.pin_label,
            "pinboard_label": row.pinboard_label,
            "pin_vote": 0,

            "layout_id": row.layout_id,
            "pin_id": row.pin_id,
            "pinboard_id": row.pinboard_id,
            "pin_groups_ids": []

        }
        return requestData;
    },

    addGroupToPinboard: function (group_id, pinboard_id) {
        var requestData = {
            "query": {
                "term": {
                    "pinboard_id": pinboard_id
                }
            },
            "script": {
                "file": "addGroupUpdate",
                "params": {
                    "new_group": group_id,
                    "fieldToUpdate": "pin_groups_ids"
                }
            }
        }
        return requestData;
    },

    removeGroupToPinboard: function (group_id, pinboard_id) {
        var requestData = {
            "query": {
                "term": {
                    "pinboard_id": pinboard_id
                }
            },
            "script": {
                "file": "removeGroupUpdate",
                "params": {
                    "new_group": group_id,
                    "fieldToUpdate": "pin_groups_ids"
                }
            }
        }
        return requestData;
    },

    updatePinWithPinboard: function (pinboard_label, pinboard_id) {
        var requestData = {
            "query": {
                "term": {
                    "pinboard_id": pinboard_id
                }
            },
            "script": {
                "file": "updateField",
                "params": {
                    "fieldToUpdate": "pinboard_label",
                    "fieldValue": pinboard_label
                }
            }
        }
        return requestData;
    },

    updatePinWithLayout: function (layout_label, layout_id) {
        var requestData = {
            "query": {
                "term": {
                    "layout_id": layout_id
                }
            },
            "script": {
                "file": "updateField",
                "params": {
                    "fieldToUpdate": "layout_label",
                    "fieldValue": layout_label
                }
            }
        }
        return requestData;
    },


    //Function which returns the JSON to index pins
    bulkPin: function (rows) {
        var myJson = [];
        for (var row = 0; row < rows.length; row++) {
            var layout_label_value = rows[row].label_layout;
            var pin_id_value = rows[row].pin_id;
            var pin_label_value = rows[row].label_pin;
            var pinboard_label_value = rows[row].label_pinboard;
            var pin_vote_value = rows[row].vote;
            var log_data_id_value = rows[row].log_data_id;

            myJson.push(
                { index: { _index: indexName, _type: 'pin', _id: log_data_id_value } },
                {
                    layout_label: layout_label_value,
                    pin_label: pin_label_value,
                    pinboard_label: pinboard_label_value,
                    pin_vote: pin_vote_value,
                    pin_id: pin_id_value
                }
            );
        }
        return myJson;
    },

}

module.exports = elasticIndexBuilder;

