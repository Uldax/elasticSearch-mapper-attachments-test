"use strict";
//Classe that consume builder to perform request to elastic serveur
//All methode return a Promise with success message or error log from elasticServer
const request = require("request"),
    elasticServiceBuilder = require("./builder/indexBuilder"),
    conf = require("../config"),
    elasticsearch = require('elasticsearch'),
    mapping = require('../elasticMapping'),

    //Conf parameters
    elasticSearchPort = conf.elastic.port,
    protocol = conf.elastic.protocol,
    serverIp = conf.elastic.serverIp,
    indexName = conf.elastic.mainIndex,
    baseURL = protocol + "://" + serverIp + ":" + elasticSearchPort,

    client = new elasticsearch.Client({
        host: serverIp + ":" + elasticSearchPort,
        log: 'trace'
    });

const elasticService = {
    /*************** DOCUMENT  **************** */
    createDocument: function (row) {
        //! fileSize > 104857600      
        try {
            const requestData = elasticServiceBuilder.createDocument(row);
            if(requestData === false ) {
                //try remove indexed -1 ?
                return Promise.reject("File " + row.label + " v:" +row.version_id +"too big");
            }
            return client.create({
                id: row.log_data_id,
                index: indexName,
                type: 'document',
                body: requestData
            });
        }
        catch (err) {
            return Promise.reject(err.message || err);
        }

    },

    //In update we don't reindex the content of file :
    //if the content change , there is a new version so it's insertDocument
    updateDocument: function (row) {
        const requestData = elasticServiceBuilder.updateDocumentVersion(row);
        return client.update({
            index: indexName,
            type: 'document',
            id: row.log_data_id,
            body: requestData
        });
    },

    /*************** UPDATE BY QUERY : Multi update  **************** */
    //update by query is not currently implement into elasticJS API

    //The updates that have been performed still stick. In other words, the process is not rolled back, only aborted
    //While the first failure causes the abort all failures that are returned by the failing bulk request are returned in the failures element 
    //so it’s possible for there to be quite a few.
    sendUpdateByQuery: function (url, requestObject) {
        return new Promise(function (resolve, reject) {
            const options = {
                method: 'POST',
                url: baseURL + url + "/_update_by_query?refresh",
                json: requestObject,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                }
            };
            request(options, function (err, response, body) {
                if (!err) {
                    switch (response.statusCode) {
                        //EveryThing works
                        case 200:
                            //TODO handle 
                            if ((typeof body !== undefined) && body.total > 0) {
                                if (body.total == body.updated) {
                                    resolve(body.total + " document updated");
                                } else if (body.total == body.noops) {
                                    resolve(body.total + " update ignored");
                                }
                            }

                            else {
                                //TODO handle other case
                                console.log(body);
                                reject(body);
                            }
                            break;
                        //Conflict
                        case 409:
                            console.log(body.version_conflicts + " conflicted");
                            //TODO : handle error
                            reject(body.failures);
                            break;

                        //bad request
                        case 400:
                            reject("Bad request object");
                            break;

                        //Todo : find
                        case 500:
                            reject("Bad request object");
                            break;
                        default:
                            console.log("default");
                            reject(response.statusCode);
                            break;
                    }
                } else {
                    reject(err);
                }
            });
        });

    },

    addGroupToDocument: function (group_id, document_id) {
        return this.sendUpdateByQuery("/opus/document/", elasticServiceBuilder.addGroupToFile(group_id, document_id));
    },

    removeGroupToDocument: function (group_id, document_id) {
        return this.sendUpdateByQuery("/opus/document/", elasticServiceBuilder.removeGroupToDocument(group_id, document_id));
    },

    addGroupToPinboard: function (group_id, pinboard_id) {
        return this.sendUpdateByQuery("/opus/pin/", elasticServiceBuilder.addGroupToPinboard(group_id, pinboard_id));
    },

    removeGroupToPinboard: function (group_id, pinboard_id) {
        return this.sendUpdateByQuery("/opus/pin/", elasticServiceBuilder.removeGroupToPinboard(group_id, pinboard_id));
    },

    updatePinWithPinboard: function (pinboard_label, pinboard_id) {
        return this.sendUpdateByQuery("/opus/pin/", elasticServiceBuilder.updatePinWithPinboard(pinboard_label, pinboard_id));
    },

    updatePinWithLayout: function (layout_label, layout_id) {
        return this.sendUpdateByQuery("/opus/pin/", elasticServiceBuilder.updatePinWithLayout(layout_label, layout_id));
    },

    updatePinwithPinBoard: function (pinboard_label, pinboard_id) {
        return this.sendUpdateByQuery("/opus/pin/", elasticServiceBuilder.updatePinWithPinboard(pinboard_label, pinboard_id));
    },

    /*************** IMPORT  **************** */
    bulkPin: function (rows) {
        return new Promise(function (resolve, reject) {
            const requestData = elasticServiceBuilder.bulkPin(rows);
            if (requestData) {
                client.bulk({
                    body: requestData
                }).then(function (resp) {
                    resolve("All pinboards indexed");
                }, function (err) {
                    reject(err.message || err);
                });
            }
            else {
                reject("No JSON for bulk");
            }
        });
    },

    /*************** PIN  **************** */
    createPin: function (row) {
        try {
            const requestData = elasticServiceBuilder.createPin(row);
            return client.create({
                index: indexName,
                type: 'pin',
                id: row.log_data_id,
                body: requestData
            });
        } catch (error) {
            return Promise.reject(error.message || error);
        }
    },


    updatePin: function (row) {
        try {
            const requestData = elasticServiceBuilder.updatePin(row);
            return client.update({
                index: indexName,
                type: 'pin',
                id: row.log_data_id,
                body: requestData
            });
        } catch (error) {
            return Promise.reject(error.message || error);
        }
    },

    //Maybe latter it'll exist other pin unique update
    //pin_log_data_id is the id of a pin in elastic index
    sendUpdatePin: function (pin_log_data_id, requestData) {
        return client.update({
            index: indexName,
            type: 'pin',
            id: pin_log_data_id,
            body: requestData
        });
    },

    updateVote: function (log_data_id, vote) {
        const requestData = {
            "doc": {
                "pin_vote": vote
            }
        };
        return elasticService.sendUpdatePin(log_data_id, requestData);
    },

    /*************** SEARCH  **************** */
    search: function (objectRequest) {
        //https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-get
        return client.search({
            index: indexName,
            body: objectRequest
        });
    },

    searchTest: function () {
        //https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-get
        return new Promise(function (resolve, reject) {
            client.search({
                index: indexName,
                body: {
                    "from": 0,
                    "size": 19,
                    "_source": {
                        "excludes": [
                            "attachment._content"
                        ]
                    },
                    "query": {
                        "match_all": {}
                    },
                    "highlight": {
                        "fields": {
                            "attachment.content": {
                                "fragment_size": 150,
                                "number_of_fragments": 3
                            }
                        }
                    }
                }
            }).then(function (resp) {
                resolve(resp);
            }, function (err) {
                reject(err);
            });
        });
    },

    /*************** UTILS  **************** */
    //Warning count nedd few sec before insert to give the right value

    countByType: function (type) {
        return new Promise(function (resolve, reject) {
            client.count({
                index: 'opus'
            }, function (error, response) {
                resolve(response);
            });
        });

    },

    ping: function (type) {
        return client.ping({
            requestTimeout: 30000,
            // undocumented params are appended to the query string
            hello: "elasticsearch"
        });
    },

    //Explicitly refresh one or more index 
    //making all operations performed since the last refresh available for search.
    refresh: function (type) {
        return client.indices.refresh({
            index: "opus"
        });
    },

    //Create first index and mapping for elastic
    createIndex: function (indexName) {
        //Allow use to do the promise one after the other
        return client.indices.exists({ index: "opus" })
            .then(function (exist) {
                if (exist) {
                    return client.indices.delete({ index: "opus" });
                } else return Promise.resolve();
            })
            .then(function () {
                return client.indices.create({ index: "opus" });
            })
            .then(function () {
                return client.indices.putMapping({ index: "opus", type: 'document', body: mapping.documentMapping });
            })
            .then(function () {
                return client.indices.putMapping({ index: "opus", type: 'pin', body: mapping.pinMapping });
            })
            .catch(function (err) {
                throw new Error(err.message || err);
            });
    }
};

module.exports = elasticService;

