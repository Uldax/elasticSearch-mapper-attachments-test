//TODO : add log data in every id
"use strict";
//Classe that consume builder to perform request to elastic serveur
//All methode return a Promise with success message or error log from elasticServer
var request = require("request"),
    utils = require("./utils"),
    elasticBuilder = require("./elasticBuilder"),
    conf = require("../config"),
    elasticsearch = require('elasticsearch');

//Conf parameters
var elasticSearchPort = conf.elastic.port,
    protocol = conf.elastic.protocol,
    serverIp = conf.elastic.serverIp,
    indexName = conf.elastic.mainIndex,
    typeName = "document",
    baseURL = protocol + "://" + serverIp + ":" + elasticSearchPort


var client = new elasticsearch.Client({
    host: serverIp + ":" + elasticSearchPort,
    log: 'error'
});


var elasticService = {
    /*************** DOCUMENT  **************** */
    createDocument: function (row) {
        var path = row.path;
        var data = {
            document_id: row.file_id,
            version_id: row.version_id,
            log_data_id: row.log_data_id,
            //TODO : name = file label not file version label
            name: row.label
        }
        //! fileSize > 104857600      
        return new Promise(function (resolve, reject) {
            try {
                var requestData = elasticBuilder.createDocument(path, data);
                    client.create({
                        id: data.log_data_id,
                        index: indexName,
                        type: 'document',
                        body: requestData
                    }).then(function (resp) {
                        resolve("Document " + data.document_id + " version " + data.version_id + " inserted");
                    }, function (err) {
                        reject(err.message || err);
                    });
            } catch (err) {
                reject(err.message || err);
            }
        });
    },

    addGroupToDocument: function (group_id, document_id) {
        var requestObject = elasticBuilder.addGroupToFile(group_id, document_id);
        var options = {
            method: 'POST',
            url: baseURL + "/opus/document/_update_by_query",
            json: requestObject,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (!err) {
                    if (response.statusCode === 200) {
                        if (typeof body != undefined) {
                            resolve(JSON.parse(body));
                        }
                    } else {
                        reject(err);
                    }
                }
            })
        })
    },

    removeGroupToDocument: function (group_id, document_id) {
        var requestObject = elasticBuilder.removeGroupToDocument(group_id, document_id);
        var options = {
            method: 'POST',
            url: baseURL + "/opus/document/_update_by_query",
            json: requestObject,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            }
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (!err) {
                    if (response.statusCode === 200) {
                        if (typeof body != undefined) {
                            resolve(JSON.parse(body));
                        }
                    } else {
                        reject(err);
                    }
                }
            })
        })
    },

    //In update we don't reindex the content of file :
    //if the content change , there is a new version so it's insertDocument
    updateDocument: function (row) {
        //Get info from db 
        // format body
        var versionID = row.document_id;
        var fileName = row.document_name;
        return new Promise(function (resolve, reject) {
            //ReindexDocument         
            // TODO : reidex only if path change  
            var requestData = elasticBuilder.createDocument(fileName);
            if (requestData) {
                client.update({
                    index: indexName,
                    type: 'document',
                    id: versionID,
                    body: requestData
                }).then(function (resp) {
                    resolve("Document with " + versionID + " updated");
                }, function (err) {
                    reject(err.message || err);
                });
            } else {
                reject();
            }
        })
    },

    /*************** IMPORT  **************** */
    bulkPin: function (rows) {
        return new Promise(function (resolve, reject) {
            var body_json = elasticBuilder.bulkPin(rows);
            if (body_json) {
                client.bulk({
                    body: body_json
                }).then(function (resp) {
                    resolve("All pinboards indexed");
                }, function (err) {
                    reject(err.message || err);
                });
            }
            else {
                reject("No JSON for bulk");
            }
        })
    },


    /*************** PIN  **************** */
    createPin: function (row) {
        return new Promise(function (resolve, reject) {
            var requestData = elasticBuilder.createPin(row);
            if (requestData) {
                client.create({
                    index: indexName,
                    type: 'pin',
                    id: row.pin_id,
                    body: requestData
                }).then(function (resp) {
                    resolve("PIN id " + row.pin_id + " inserted");
                }, function (err) {
                    reject(err.message || err);
                });
            } else {
                reject("error in requestData");
            }
        });
    },

    createPinBoard: function (row) {

    },

    updatePinBoard: function (id) {

    },

    addGroupToPin: function (group_id, pin_id) {
        var options = {
            method: 'POST',
            url: baseURL + "/opus/document/_update_by_query",
            json: objectMapping,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Transfer-Encoding': 'chunked'
            }
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (!err) {
                    if (response.statusCode === 200) {
                        if (typeof body != undefined) {
                            resolve(JSON.parse(body));
                        }
                    } else {
                        reject(err);
                    }
                }
            })
        })
    },

    removeGroupToPin: function (group_id, pin_id) {

    },

    /*************** SEARCH  **************** */
    search: function (buildOption) {
        //https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#api-get
        return new Promise(function (resolve, reject) {
            var objectRequest = elasticBuilder.search(buildOption);
            client.search({
                index: indexName,
                body: objectRequest
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
        })

    },

    ping: function (type) {
        return client.ping({
            requestTimeout: 30000,
            // undocumented params are appended to the query string
            hello: "elasticsearch"
        });
    },

    //Create first index and mapping for elastic
    //TODO test
    createIndex: function () {
        //Allow use to do the promise one after the other
        return Promise.resolve()
            .then(function () {
                return client.indices.exists({ index: "opus" })
            })
            .then(function (exist) {
                if (exist) {
                    return client.indices.delete({ index: "opus" })
                } else return Promise.resolve()
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
                console.log(err.message || err);
            });
    },

    countFromAnOtherWorld(type) {
        //index file
        //Option for resquest
        var options = {
            method: 'GET',
            url: baseURL + "/opus/_count",
        };
        return new Promise(function (resolve, reject) {
            request(options, function (err, response, body) {
                if (!err) {
                    if (response.statusCode === 200) {
                        if (typeof body != undefined) {
                            resolve(JSON.parse(body));
                        }
                    } else {
                        reject(err);
                    }
                }
            })
        })
    }
}




module.exports = elasticService;

